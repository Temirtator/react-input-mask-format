import MaskUtils from "../utils/mask";
import {
  resolveMaskPlaceholder,
  normalizeFormatChars,
  createBeforeMaskedStateChangeAdapter,
  warnDeprecatedOnce
} from "../v2-compat";
import { resolveTransform } from "../utils/transform";
import type {
  BeforeMaskedStateChangeFn,
  BeforeMaskedValueChangeFn,
  Mask,
  Transform,
  V2MaskOptions
} from "../types";

const MIGRATION_GUIDE =
  "See migration guide: https://github.com/Temirtator/react-input-mask-format#migrating-from-react-input-mask";

export interface MaskConfig {
  maskUtils: MaskUtils;
  maskPlaceholder: string | null;
  alwaysShowMask: boolean;
  beforeMaskedStateChange?: BeforeMaskedStateChangeFn;
}

export interface ResolveMaskOptions {
  mask?: Mask | null;
  maskPlaceholder?: string | null;
  maskChar?: string | null;
  alwaysShowMask?: boolean;
  formatChars?: Record<string, RegExp | string>;
  transform?: Transform;
  beforeMaskedStateChange?: BeforeMaskedStateChangeFn;
  beforeMaskedValueChange?: BeforeMaskedValueChangeFn;
}

export function resolveMaskConfig(options: ResolveMaskOptions): MaskConfig {
  const {
    mask,
    maskPlaceholder: maskPlaceholderOption,
    maskChar,
    alwaysShowMask = false,
    formatChars,
    transform,
    beforeMaskedStateChange: beforeMaskedStateChangeOption,
    beforeMaskedValueChange
  } = options;

  if (maskChar !== undefined) {
    warnDeprecatedOnce("maskChar", `maskChar is deprecated, use maskPlaceholder instead. ${MIGRATION_GUIDE}`);
  }
  if (beforeMaskedValueChange !== undefined) {
    warnDeprecatedOnce(
      "beforeMaskedValueChange",
      `beforeMaskedValueChange is deprecated, use beforeMaskedStateChange. ${MIGRATION_GUIDE}`
    );
  }

  const resolvedPlaceholder = resolveMaskPlaceholder(maskPlaceholderOption, maskChar);
  const maskPlaceholder = resolvedPlaceholder === undefined ? "_" : resolvedPlaceholder;

  const { formatChars: normalizedFormatChars, hasLegacyString } = normalizeFormatChars(formatChars);
  if (hasLegacyString) {
    warnDeprecatedOnce(
      "formatChars",
      `string values in formatChars are deprecated, pass RegExp values instead (e.g. { "#": /[0-9]/ }). ${MIGRATION_GUIDE}`
    );
  }

  const maskUtils = new MaskUtils({
    mask: mask ?? null,
    maskPlaceholder,
    formatChars: normalizedFormatChars,
    transform: resolveTransform(transform)
  });

  let beforeMaskedStateChange = beforeMaskedStateChangeOption;
  if (!beforeMaskedStateChange && beforeMaskedValueChange) {
    const v2MaskOptions: V2MaskOptions = {
      mask: mask ?? undefined,
      maskChar: maskPlaceholder,
      alwaysShowMask,
      formatChars: formatChars ?? { "9": "[0-9]", a: "[A-Za-z]", "*": "[A-Za-z0-9]" },
      permanents: maskUtils.maskOptions.permanents
    };
    beforeMaskedStateChange = createBeforeMaskedStateChangeAdapter(beforeMaskedValueChange, v2MaskOptions);
  }

  return { maskUtils, maskPlaceholder, alwaysShowMask, beforeMaskedStateChange };
}
