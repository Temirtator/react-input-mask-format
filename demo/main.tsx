import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import InputMask, { useMask } from "react-input-mask-format";
import { extendedFormatChars } from "react-input-mask-format";
import {
  card, kzPhone, kzIin, kzBin, kzIban, kzPlate, kzPostal,
  ruPhone, ruInnPerson, ruInnCompany, ruSnils, ruOgrn, ruOgrnip, ruKpp,
  ruBik, ruAccount, ruIban, ruPlate, ruPostal, ruPassport,
  uzPhone, uzPinfl, uzInn, uzAccount, uzMfo, uzPlate, uzPlateCompany, uzPostal, uzPassport,
  kgPhone, kgInnPerson, kgInnCompany, kgAccount, kgBik, kgPlate, kgPlateCompany, kgPostal, kgPassport, MaskPreset
} from "react-input-mask-format/presets";
import {
  isValidIin, isValidBin, isValidKzIban, luhn,
  isValidRuInn, isValidRuSnils, isValidRuOgrn, isValidRuOgrnip, isValidRuKpp,
  isValidRuBik, isValidRuAccount, isValidRuIban, isValidRuPlate,
  isValidUzPinfl, isValidUzInn,
  isValidKgInn, isValidKgAccount, isValidKgBik
} from "react-input-mask-format/validators";
import { NumberFormat, useNumberFormat } from "react-input-mask-format/number";
import { TimeFormat, useTimeFormat } from "react-input-mask-format/time";

const bg = "#0e1420", panel = "#131c2c", line = "#223049", ink = "#f4f8ff", dim = "#6b7f9c", gold = "#FFC800";

const fieldStyle: React.CSSProperties = {
  fontFamily: "ui-monospace, monospace", fontSize: 15, background: "#0a0f18",
  border: `1px solid #2c3d59`, borderRadius: 7, padding: "9px 12px", color: ink, width: "100%", boxSizing: "border-box"
};

function Row({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, background: panel, border: `1px solid ${line}`, borderRadius: 10, padding: "11px 14px" }}>
      <div style={{ width: 128, flex: "none" }}>
        <div style={{ fontSize: 13, color: ink, fontWeight: 600 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: dim, fontFamily: "ui-monospace, monospace" }}>{sub}</div>}
      </div>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

function Valid({ ok }: { ok: boolean | null }) {
  if (ok === null) return null;
  return <span style={{ marginLeft: 10, color: ok ? "#7fd6a3" : "#e06c75", fontSize: 13 }}>{ok ? "✓" : "✗"}</span>;
}

function PresetField(
  { preset, testid, validate }:
  { preset: MaskPreset; testid: string; validate?: (v: string) => boolean }
) {
  const [v, setV] = useState("");
  const ok = validate && v.trim() ? validate(v) : null;
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <InputMask
        {...preset}
        value={v}
        onChange={e => setV((e.target as HTMLInputElement).value)}
        data-testid={testid}
        style={fieldStyle as React.CSSProperties}
      />
      <Valid ok={ok} />
    </div>
  );
}

const FancyInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  (props, ref) => <input ref={ref} {...props} style={fieldStyle} />
);

function UseMaskField() {
  const [readout, setReadout] = useState("");
  const ref = useMask({ mask: "99/99/9999", maskPlaceholder: "_" });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <input
        ref={ref}
        data-testid="usemask"
        onChange={e => setReadout((e.target as HTMLInputElement).value)}
        style={fieldStyle}
      />
      <span data-testid="usemask-readout" style={{ fontFamily: "ui-monospace, monospace", fontSize: 12, color: dim }}>
        {readout}
      </span>
    </div>
  );
}

function NumericHookField() {
  const ref = useNumberFormat({ thousandSeparator: " " });
  return <input ref={ref} data-testid="numeric-hook" style={fieldStyle} />;
}

function TimeHookField() {
  const ref = useTimeFormat({});
  return <input ref={ref} data-testid="time-hook" style={fieldStyle} />;
}

type Country = "kz" | "ru" | "uz" | "kg";
const COUNTRIES: { id: Country; label: string }[] = [
  { id: "kz", label: "KZ" },
  { id: "ru", label: "RU" },
  { id: "uz", label: "UZ" },
  { id: "kg", label: "KG" }
];
const DEMO_BIK = "044525225";

function CountryTabs({ value, onChange }: { value: Country; onChange: (c: Country) => void }) {
  return (
    <div role="tablist" style={{ display: "flex", gap: 6 }}>
      {COUNTRIES.map(c => (
        <button
          key={c.id}
          type="button"
          role="tab"
          aria-selected={value === c.id}
          data-testid={`country-${c.id}`}
          onClick={() => onChange(c.id)}
          style={{
            fontFamily: "ui-monospace, monospace", fontSize: 12, fontWeight: 700, cursor: "pointer",
            padding: "4px 12px", borderRadius: 20, border: `1px solid ${value === c.id ? gold : line}`,
            background: value === c.id ? gold : "transparent", color: value === c.id ? bg : dim
          }}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}

function App() {
  const [country, setCountry] = useState<Country>("kz");
  const [hex, setHex] = useState("");
  const [up, setUp] = useState("");
  const [amount, setAmount] = useState<number | undefined>(undefined);
  const [time, setTime] = useState("");

  return (
    <main style={{ background: bg, minHeight: "100vh", color: ink, fontFamily: "system-ui, sans-serif", margin: 0 }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px 64px", display: "grid", gap: 26 }}>
        <header>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: "ui-monospace, monospace", fontWeight: 600 }}>react-input-mask-format</span>
            <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 11, color: bg, background: gold, padding: "2px 7px", borderRadius: 20, fontWeight: 700 }}>v2.6</span>
          </div>
          <h1 style={{ fontSize: 26, margin: "10px 0 4px" }}>General-purpose input masks for React — with batteries</h1>
          <p style={{ color: dim, margin: 0 }}>Zero-deps · presets are a country-agnostic system · country packs: Kazakhstan, Russia, Uzbekistan, Kyrgyzstan.</p>
        </header>

        <section style={{ display: "grid", gap: 9 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: dim }}>Country preset packs · /presets</div>
            <CountryTabs value={country} onChange={setCountry} />
          </div>
          {country === "kz" && (
            <>
              <Row label="Телефон" sub="kzPhone"><PresetField preset={kzPhone} testid="kzPhone" /></Row>
              <Row label="ИИН" sub="kzIin · checksum"><PresetField preset={kzIin} testid="iin" validate={isValidIin} /></Row>
              <Row label="БИН" sub="kzBin · checksum"><PresetField preset={kzBin} testid="bin" validate={isValidBin} /></Row>
              <Row label="IBAN" sub="kzIban · UPPER · mod-97"><PresetField preset={kzIban} testid="iban" validate={isValidKzIban} /></Row>
              <Row label="Госномер" sub="kzPlate · UPPER"><PresetField preset={kzPlate} testid="plate" /></Row>
              <Row label="Индекс" sub="kzPostal"><PresetField preset={kzPostal} testid="postal" /></Row>
            </>
          )}
          {country === "ru" && (
            <>
              <Row label="Телефон" sub="ruPhone"><PresetField preset={ruPhone} testid="ruPhone" /></Row>
              <Row label="ИНН физлица" sub="ruInnPerson · checksum"><PresetField preset={ruInnPerson} testid="ruInnPerson" validate={isValidRuInn} /></Row>
              <Row label="ИНН юрлица" sub="ruInnCompany · checksum"><PresetField preset={ruInnCompany} testid="ruInnCompany" validate={isValidRuInn} /></Row>
              <Row label="СНИЛС" sub="ruSnils · checksum"><PresetField preset={ruSnils} testid="ruSnils" validate={isValidRuSnils} /></Row>
              <Row label="ОГРН" sub="ruOgrn · checksum"><PresetField preset={ruOgrn} testid="ruOgrn" validate={isValidRuOgrn} /></Row>
              <Row label="ОГРНИП" sub="ruOgrnip · checksum"><PresetField preset={ruOgrnip} testid="ruOgrnip" validate={isValidRuOgrnip} /></Row>
              <Row label="КПП" sub="ruKpp · UPPER"><PresetField preset={ruKpp} testid="ruKpp" validate={isValidRuKpp} /></Row>
              <Row label="БИК" sub="ruBik"><PresetField preset={ruBik} testid="ruBik" validate={isValidRuBik} /></Row>
              <Row label="Р/счёт" sub={`ruAccount · key vs БИК ${DEMO_BIK}`}><PresetField preset={ruAccount} testid="ruAccount" validate={v => isValidRuAccount(v, DEMO_BIK)} /></Row>
              <Row label="IBAN" sub="ruIban · mod-97"><PresetField preset={ruIban} testid="ruIban" validate={isValidRuIban} /></Row>
              <Row label="Госномер" sub="ruPlate · Latin→Кириллица"><PresetField preset={ruPlate} testid="ruPlate" validate={isValidRuPlate} /></Row>
              <Row label="Индекс" sub="ruPostal"><PresetField preset={ruPostal} testid="ruPostal" /></Row>
              <Row label="Паспорт" sub="ruPassport"><PresetField preset={ruPassport} testid="ruPassport" /></Row>
            </>
          )}
          {country === "uz" && (
            <>
              <Row label="Телефон" sub="uzPhone"><PresetField preset={uzPhone} testid="uzPhone" /></Row>
              <Row label="ПИНФЛ" sub="uzPinfl · checksum"><PresetField preset={uzPinfl} testid="uzPinfl" validate={isValidUzPinfl} /></Row>
              <Row label="ИНН" sub="uzInn · format"><PresetField preset={uzInn} testid="uzInn" validate={isValidUzInn} /></Row>
              <Row label="Р/счёт" sub="uzAccount"><PresetField preset={uzAccount} testid="uzAccount" /></Row>
              <Row label="МФО" sub="uzMfo"><PresetField preset={uzMfo} testid="uzMfo" /></Row>
              <Row label="Госномер" sub="uzPlate · UPPER"><PresetField preset={uzPlate} testid="uzPlate" /></Row>
              <Row label="Госномер юрлица" sub="uzPlateCompany · UPPER"><PresetField preset={uzPlateCompany} testid="uzPlateCompany" /></Row>
              <Row label="Индекс" sub="uzPostal"><PresetField preset={uzPostal} testid="uzPostal" /></Row>
              <Row label="Паспорт / ID" sub="uzPassport · UPPER"><PresetField preset={uzPassport} testid="uzPassport" /></Row>
            </>
          )}
          {country === "kg" && (
            <>
              <Row label="Телефон" sub="kgPhone"><PresetField preset={kgPhone} testid="kgPhone" /></Row>
              <Row label="ИНН физлица" sub="kgInnPerson · structure"><PresetField preset={kgInnPerson} testid="kgInnPerson" validate={isValidKgInn} /></Row>
              <Row label="ИНН юрлица" sub="kgInnCompany · structure"><PresetField preset={kgInnCompany} testid="kgInnCompany" validate={isValidKgInn} /></Row>
              <Row label="Р/счёт" sub="kgAccount · mod-97"><PresetField preset={kgAccount} testid="kgAccount" validate={isValidKgAccount} /></Row>
              <Row label="БИК" sub="kgBik"><PresetField preset={kgBik} testid="kgBik" validate={isValidKgBik} /></Row>
              <Row label="Госномер" sub="kgPlate · UPPER"><PresetField preset={kgPlate} testid="kgPlate" /></Row>
              <Row label="Госномер юрлица" sub="kgPlateCompany · UPPER"><PresetField preset={kgPlateCompany} testid="kgPlateCompany" /></Row>
              <Row label="Индекс" sub="kgPostal"><PresetField preset={kgPostal} testid="kgPostal" /></Row>
              <Row label="ID / паспорт" sub="kgPassport · UPPER"><PresetField preset={kgPassport} testid="kgPassport" /></Row>
            </>
          )}
          <Row label="Карта" sub="card · Luhn"><PresetField preset={card} testid="card" validate={luhn} /></Row>
        </section>

        <section style={{ display: "grid", gap: 9 }}>
          <div style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: dim }}>Tokens &amp; transform</div>
          <Row label="Hex" sub='mask="######"'>
            <InputMask mask="######" formatChars={extendedFormatChars} value={hex}
              onChange={e => setHex((e.target as HTMLInputElement).value)} data-testid="hex" style={fieldStyle} />
          </Row>
          <Row label="Uppercase" sub='transform="uppercase"'>
            <InputMask mask="aaaaaa" transform="uppercase" value={up}
              onChange={e => setUp((e.target as HTMLInputElement).value)} data-testid="upper" style={fieldStyle} />
          </Row>
        </section>

        <section style={{ display: "grid", gap: 9 }}>
          <div style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: dim }}>Engine basics</div>
          <Row label="Date" sub="99/99/9999"><InputMask mask="99/99/9999" data-testid="date" style={fieldStyle} /></Row>
          <Row label="Phone" sub="+7 (999)…"><InputMask mask="+7 (999) 999-99-99" data-testid="phone" style={fieldStyle} /></Row>
          <Row label="Legacy" sub="maskChar"><InputMask mask="99-99" maskChar="•" alwaysShowMask data-testid="legacy" style={fieldStyle} /></Row>
          <Row label="Custom child" sub="forwardRef">
            <InputMask mask="99/99/9999"><FancyInput data-testid="children" /></InputMask>
          </Row>
        </section>

        <section style={{ display: "grid", gap: 9 }}>
          <div style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: dim }}>Hook API · useMask</div>
          <Row label="useMask" sub="ref on your own <input>"><UseMaskField /></Row>
        </section>

        <section style={{ display: "grid", gap: 9 }}>
          <div style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: dim }}>Numeric &amp; currency · /number</div>
          <Row label="Currency" sub="NumberFormat · $ ,">
            <NumberFormat
              value={amount ?? ""}
              onValueChange={v => setAmount(v.floatValue)}
              thousandSeparator="," decimalScale={2} prefix="$ " allowNegative
              data-testid="currency" style={fieldStyle}
            />
          </Row>
          <Row label="Raw hook" sub="useNumberFormat · space"><NumericHookField /></Row>
        </section>

        <section style={{ display: "grid", gap: 9 }}>
          <div style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: dim }}>Time · /time</div>
          <Row label="Time" sub="TimeFormat · HH:MM">
            <TimeFormat
              value={time}
              onValueChange={v => setTime(v.value)}
              data-testid="time" style={fieldStyle}
            />
          </Row>
          <Row label="Raw time hook" sub="useTimeFormat"><TimeHookField /></Row>
        </section>
      </div>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
