import React, { useEffect, useRef, useState } from "react";
import InputMask from "react-input-mask-format";
import type { Mask, Transform } from "react-input-mask-format";
import * as presets from "react-input-mask-format/presets";
import type { MaskPreset } from "react-input-mask-format/presets";

const bg = "#0e1420", panel = "#131c2c", line = "#223049", ink = "#f4f8ff", dim = "#6b7f9c", gold = "#FFC800";
const mono = "ui-monospace, monospace";
const red = "#e06c75";

const fieldStyle: React.CSSProperties = {
  fontFamily: mono, fontSize: 15, background: "#0a0f18",
  border: `1px solid #2c3d59`, borderRadius: 7, padding: "9px 12px", color: ink, width: "100%", boxSizing: "border-box"
};

const labelStyle: React.CSSProperties = {
  display: "grid", gap: 6, minWidth: 0, fontSize: 13, fontWeight: 600
};
const noteStyle: React.CSSProperties = { fontSize: 11, color: dim, fontFamily: mono, fontWeight: 400 };
const checkStyle: React.CSSProperties = { accentColor: gold, margin: 0 };

const PRESETS: Record<string, MaskPreset> = {};
Object.keys(presets).forEach(name => {
  const value = (presets as Record<string, unknown>)[name];
  if (value && typeof value === "object" && "mask" in value) {
    PRESETS[name] = value as MaskPreset;
  }
});

const GROUPS: { label: string; names: string[] }[] = [];
Object.keys(PRESETS).forEach(name => {
  const country = /^([a-z]+)[A-Z]/.exec(name);
  const label = country ? country[1].toUpperCase() : "Generic";
  const group = GROUPS.find(g => g.label === label);
  if (group) {
    group.names.push(name);
  } else {
    GROUPS.push({ label, names: [name] });
  }
});

const LEGEND: [string, string][] = [
  ["9", "digit 0-9"],
  ["a", "letter a-z, A-Z"],
  ["*", "letter or digit"],
  ["\\", "makes the next character fixed"]
];

interface Options {
  preset: string;
  mask: string;
  arrayMask: Array<string | RegExp> | null;
  placeholder: string;
  placeholderNone: boolean;
  alwaysShowMask: boolean;
  transform: Transform | undefined;
}

const INITIAL: Options = {
  preset: "",
  mask: "+7 (999) 999-99-99",
  arrayMask: null,
  placeholder: "_",
  placeholderNone: false,
  alwaysShowMask: false,
  transform: undefined
};

function maskLength(mask: Mask): number {
  return typeof mask === "string" ? mask.replace(/\\([\s\S]?)/g, "$1").length : mask.length;
}

function arraySource(mask: Array<string | RegExp>): string {
  const parts = mask.map(part => (typeof part === "string" ? JSON.stringify(part) : String(part)));
  return `[${parts.join(", ")}]`;
}

function jsxAttr(name: string, value: string): string {
  return /["&]/.test(value) ? `${name}={${JSON.stringify(value)}}` : `${name}="${value}"`;
}

function withoutFunction(transform: Transform | undefined): Transform | undefined {
  return typeof transform === "function" ? undefined : transform;
}

function buildSnippet(options: Options, maskPlaceholder: string | null): string {
  const preset = options.preset ? PRESETS[options.preset] : null;
  const attrs: string[] = [];
  if (preset) {
    attrs.push(`{...${options.preset}}`);
  } else if (options.mask) {
    attrs.push(jsxAttr("mask", options.mask));
  }
  const basePlaceholder = preset && preset.maskPlaceholder !== undefined ? preset.maskPlaceholder : "_";
  if (maskPlaceholder !== basePlaceholder) {
    attrs.push(
      maskPlaceholder === null ? "maskPlaceholder={null}" : jsxAttr("maskPlaceholder", maskPlaceholder)
    );
  }
  if (options.alwaysShowMask) {
    attrs.push("alwaysShowMask");
  }
  if (options.transform !== (preset ? preset.transform : undefined)) {
    const transform = options.transform;
    attrs.push(typeof transform === "string" ? jsxAttr("transform", transform) : "transform={undefined}");
  }
  const oneLine = `<InputMask${attrs.map(attr => ` ${attr}`).join("")} />`;
  const tag = oneLine.length > 60 ? `<InputMask\n${attrs.map(attr => `  ${attr}\n`).join("")}/>` : oneLine;
  const imports = ['import InputMask from "react-input-mask-format";'];
  if (preset) {
    imports.push(`import { ${options.preset} } from "react-input-mask-format/presets";`);
  }
  return `${imports.join("\n")}\n\n${tag}`;
}

interface GuardProps {
  resetKey: string;
  children: React.ReactNode;
}

class Guard extends React.Component<GuardProps, { error: string | null }> {
  state: { error: string | null } = { error: null };

  static getDerivedStateFromError(error: unknown) {
    return { error: error instanceof Error ? error.message : String(error) };
  }

  componentDidUpdate(previous: GuardProps, previousState: { error: string | null }) {
    if (previousState.error !== null && previous.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error === null) {
      return this.props.children;
    }
    return (
      <div
        data-testid="playground-error"
        style={{ ...fieldStyle, fontSize: 12, color: red, whiteSpace: "pre-wrap" }}
      >
        {this.state.error}
      </div>
    );
  }
}

export function Playground() {
  const [options, setOptions] = useState<Options>(INITIAL);
  const [field, setField] = useState(0);
  const [value, setValue] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const mask: Mask = options.arrayMask ?? options.mask;
  const masked = !!options.arrayMask || options.mask !== "";
  const typedPlaceholder = options.placeholderNone ? null : options.placeholder;
  const placeholderFits =
    !masked || typedPlaceholder === null || typedPlaceholder.length <= 1 ||
    typedPlaceholder.length === maskLength(mask);
  const maskPlaceholder =
    typedPlaceholder === null || placeholderFits ? typedPlaceholder : typedPlaceholder.charAt(0);
  const presetTransform = options.preset ? PRESETS[options.preset].transform : undefined;
  const transformChoice = typeof options.transform === "function" ? "preset" : options.transform ?? "";
  const snippet = buildSnippet(options, maskPlaceholder);
  const maskSource = options.arrayMask ? arraySource(options.arrayMask) : options.mask;
  const resetKey = JSON.stringify([maskSource, maskPlaceholder, options.alwaysShowMask, transformChoice]);

  useEffect(() => {
    setValue(inputRef.current ? inputRef.current.value : "");
  }, [resetKey, field]);

  useEffect(() => {
    if (!copyStatus) {
      return;
    }
    const timer = setTimeout(() => setCopyStatus(""), 1500);
    return () => clearTimeout(timer);
  }, [copyStatus]);

  function update(patch: Partial<Options>) {
    setOptions(current => ({ ...current, ...patch }));
  }

  function choosePreset(name: string) {
    const preset = PRESETS[name];
    if (!preset) {
      setOptions(current => ({
        ...current, preset: "", arrayMask: null, transform: withoutFunction(current.transform)
      }));
      return;
    }
    setField(current => current + 1);
    setOptions(current => ({
      ...current,
      preset: name,
      mask: typeof preset.mask === "string" ? preset.mask : current.mask,
      arrayMask: typeof preset.mask === "string" ? null : preset.mask,
      placeholder: typeof preset.maskPlaceholder === "string" ? preset.maskPlaceholder : "_",
      placeholderNone: preset.maskPlaceholder === null,
      transform: preset.transform
    }));
  }

  function changeMask(text: string) {
    setOptions(current => ({
      ...current, preset: "", mask: text, arrayMask: null, transform: withoutFunction(current.transform)
    }));
  }

  function changeTransform(choice: string) {
    if (choice === "preset") {
      update({ transform: presetTransform });
    } else {
      update({ transform: choice ? (choice as Transform) : undefined });
    }
  }

  function copy() {
    try {
      navigator.clipboard.writeText(snippet).then(
        () => setCopyStatus("Copied"),
        () => setCopyStatus("Copy failed")
      );
    } catch {
      setCopyStatus("Copy failed");
    }
  }

  return (
    <section data-testid="playground" style={{ display: "grid", gap: 9, minWidth: 0, colorScheme: "dark" }}>
      <div style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: dim }}>
        Playground · try any mask
      </div>
      <div
        style={{
          background: panel, border: `1px solid ${line}`, borderRadius: 10, padding: 14,
          display: "grid", gap: 14, minWidth: 0
        }}
      >
        <label style={labelStyle}>
          Preset
          <select
            data-testid="playground-preset"
            value={options.preset}
            onChange={e => choosePreset(e.target.value)}
            style={fieldStyle}
          >
            <option value="">Custom</option>
            {GROUPS.map(group => (
              <optgroup key={group.label} label={group.label}>
                {group.names.map(name => <option key={name} value={name}>{name}</option>)}
              </optgroup>
            ))}
          </select>
        </label>

        <div style={labelStyle}>
          <label htmlFor="playground-mask">mask</label>
          {options.arrayMask ? (
            <div
              data-testid="playground-mask-array"
              style={{ ...fieldStyle, fontSize: 13, color: dim, overflowWrap: "anywhere" }}
            >
              {maskSource}
            </div>
          ) : (
            <input
              id="playground-mask"
              data-testid="playground-mask"
              value={options.mask}
              onChange={e => changeMask(e.target.value)}
              spellCheck={false}
              autoComplete="off"
              style={fieldStyle}
            />
          )}
          {options.arrayMask && (
            <span style={noteStyle}>array mask · read-only · choose Custom to type one</span>
          )}
          {!masked && <span style={noteStyle}>empty · the field is not masked</span>}
          <div data-testid="playground-legend" style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px" }}>
            {LEGEND.map(([token, meaning]) => (
              <span key={token} style={{ fontSize: 12, color: dim, fontWeight: 400 }}>
                <code style={{ fontFamily: mono, color: gold, marginRight: 6 }}>{token}</code>
                {meaning}
              </span>
            ))}
            <span style={{ fontSize: 12, color: dim, fontWeight: 400 }}>anything else is fixed</span>
          </div>
        </div>

        <div
          style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}
        >
          <div style={labelStyle}>
            <label htmlFor="playground-placeholder">maskPlaceholder</label>
            <input
              id="playground-placeholder"
              data-testid="playground-placeholder"
              value={options.placeholder}
              disabled={options.placeholderNone}
              onChange={e => update({ placeholder: e.target.value })}
              spellCheck={false}
              autoComplete="off"
              style={{ ...fieldStyle, opacity: options.placeholderNone ? 0.4 : 1 }}
            />
            <label style={{ ...noteStyle, display: "flex", alignItems: "center", gap: 6 }}>
              <input
                type="checkbox"
                data-testid="playground-placeholder-none"
                checked={options.placeholderNone}
                onChange={e => update({ placeholderNone: e.target.checked })}
                style={checkStyle}
              />
              none (null)
            </label>
            {!placeholderFits && (
              <span data-testid="playground-placeholder-hint" style={{ ...noteStyle, color: red }}>
                {`1 character or ${maskLength(mask)} (the mask length) · "${maskPlaceholder}" until then`}
              </span>
            )}
          </div>
          <label style={labelStyle}>
            transform
            <select
              data-testid="playground-transform"
              value={transformChoice}
              onChange={e => changeTransform(e.target.value)}
              style={fieldStyle}
            >
              <option value="">none</option>
              <option value="uppercase">uppercase</option>
              <option value="lowercase">lowercase</option>
              {typeof presetTransform === "function" && (
                <option value="preset">function from the preset</option>
              )}
            </select>
          </label>
        </div>

        <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            data-testid="playground-always-show"
            checked={options.alwaysShowMask}
            onChange={e => update({ alwaysShowMask: e.target.checked })}
            style={checkStyle}
          />
          alwaysShowMask
        </label>

        <div style={{ display: "grid", gap: 8, borderTop: `1px solid ${line}`, paddingTop: 14, minWidth: 0 }}>
          <label htmlFor="playground-input" style={{ fontSize: 13, fontWeight: 600 }}>Try it</label>
          <Guard key={field} resetKey={resetKey}>
            <InputMask
              id="playground-input"
              ref={inputRef}
              mask={mask}
              maskPlaceholder={maskPlaceholder}
              alwaysShowMask={options.alwaysShowMask}
              transform={options.transform}
              onChange={e => setValue(e.target.value)}
              data-testid="playground-input"
              style={fieldStyle}
            />
          </Guard>
          <div style={{ ...noteStyle, fontSize: 12, overflowWrap: "anywhere" }}>
            value{" "}
            <span data-testid="playground-value" data-value={value} style={{ color: ink }}>
              {JSON.stringify(value)}
            </span>
          </div>
        </div>

        <div style={{ display: "grid", gap: 8, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Code</span>
            <button
              type="button"
              data-testid="playground-copy"
              onClick={copy}
              style={{
                fontFamily: mono, fontSize: 12, fontWeight: 700, cursor: "pointer", padding: "4px 12px",
                borderRadius: 20, border: `1px solid ${gold}`, background: gold, color: bg
              }}
            >
              {copyStatus || "Copy"}
            </button>
          </div>
          <pre
            data-testid="playground-snippet"
            style={{
              margin: 0, padding: "12px 14px", background: "#0a0f18", border: `1px solid #2c3d59`,
              borderRadius: 7, fontFamily: mono, fontSize: 12, lineHeight: 1.6, color: ink,
              whiteSpace: "pre-wrap", overflowWrap: "anywhere"
            }}
          >
            {snippet}
          </pre>
        </div>
      </div>
    </section>
  );
}
