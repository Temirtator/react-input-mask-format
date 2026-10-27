export interface PrefixHost {
  prefix: string;
  slots: number;
  fillingIndices(string: string): number[];
  fillingLengthAt(string: string, position: number): number;
}

export function hasSignificantPrefix(prefix: string | null): boolean {
  return !!prefix && /[0-9A-Za-z]/.test(prefix);
}

export function prefixSignificantCharacters(prefix: string): string {
  return prefix.replace(/[^0-9A-Za-z]/g, "");
}

function startsWithCharacters(value: string, indices: number[], characters: string): boolean {
  return (
    indices.length >= characters.length &&
    characters
      .split("")
      .every((character, k) => value[indices[k]].toUpperCase() === character.toUpperCase())
  );
}

export function stripInternationalPrefix(host: PrefixHost, string: string): string | null {
  const { prefix } = host;
  if (!prefix.startsWith("+") || !string.trimStart().startsWith("+")) {
    return null;
  }
  const significant = prefixSignificantCharacters(prefix);
  const indices = host.fillingIndices(string);
  if (!significant || !startsWithCharacters(string, indices, significant)) {
    return null;
  }
  return indices.length > significant.length ? string.slice(indices[significant.length]) : "";
}

export function trimOverflowingPrefix(host: PrefixHost, string: string, position: number): string {
  const { prefix, slots } = host;
  if (!hasSignificantPrefix(prefix) || position > prefix.length) {
    return string;
  }
  const international = stripInternationalPrefix(host, string);
  if (international !== null) {
    return international;
  }
  const indices = host.fillingIndices(string);
  if (indices.length <= slots) {
    return string;
  }
  return string.slice(indices[indices.length - slots]);
}

export function shouldInsertAfterPrefix(
  host: PrefixHost,
  string: string,
  position: number,
  wasTrimmed: boolean
): boolean {
  const { prefix } = host;
  if (!string || !hasSignificantPrefix(prefix) || position >= prefix.length) {
    return false;
  }
  if (!wasTrimmed) {
    const remaining = prefixSignificantCharacters(prefix.slice(position));
    const typed = prefixSignificantCharacters(string).slice(0, remaining.length);
    if (typed && remaining.toUpperCase().startsWith(typed.toUpperCase())) {
      return false;
    }
  }
  return host.fillingLengthAt(string, prefix.length) > 0;
}

export function normalizeUnprefixedValue(host: PrefixHost, value: string): string | null {
  const { prefix, slots } = host;
  if (!hasSignificantPrefix(prefix) || !value || value.startsWith(prefix)) {
    return null;
  }
  const international = stripInternationalPrefix(host, value);
  if (international !== null) {
    return international;
  }
  const indices = host.fillingIndices(value);
  const significant = prefixSignificantCharacters(prefix);
  for (let k = 1; k < significant.length; k++) {
    if (indices.length === slots + k && startsWithCharacters(value, indices, significant.slice(-k))) {
      return value.slice(indices[k]);
    }
  }
  if (startsWithCharacters(value, indices, significant)) {
    const rest = indices.slice(significant.length);
    if (rest.length === 0) {
      return "";
    }
    return value.slice(rest[Math.max(0, rest.length - slots)]);
  }
  if (indices.length < slots) {
    return null;
  }
  return value.slice(indices[indices.length - slots]);
}

export function sameFillingCharacters(host: PrefixHost, a: string, b: string): boolean {
  const filling = (string: string) =>
    host
      .fillingIndices(string)
      .map(i => string[i])
      .join("")
      .toUpperCase();
  return filling(a) === filling(b);
}
