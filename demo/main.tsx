import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import InputMask, { useMask } from "react-input-mask-format";
import { extendedFormatChars } from "react-input-mask-format";
import {
  card, vin, iban, gePhone, gePostal, mdPhone, mdPostal, uaPhone, uaPostal, tmPhone, tmPostal, kzPhone, kzIin, kzBin, kzIban, kzPlate, kzPostal,
  ruPhone, ruInnPerson, ruInnCompany, ruSnils, ruOgrn, ruOgrnip, ruKpp,
  ruBik, ruAccount, ruIban, ruPlate, ruPostal, ruPassport,
  uzPhone, uzPinfl, uzInn, uzAccount, uzMfo, uzPlate, uzPlateCompany, uzPostal, uzPassport,
  kgPhone, kgInnPerson, kgInnCompany, kgAccount, kgBik, kgPlate, kgPlateCompany, kgPostal, kgPassport,
  byPhone, byPersonalId, byUnp, byIban, byPlate, byPostal, byPassport,
  tjPhone, tjInn, tjEin, tjAccount, tjBik, tjPlate, tjPlateCompany, tjPostal,
  amPhone, amPsn, amTin, amAccount, amPlate, amPostal, amPassport,
  azPhone, azFin, azVoen, azIban, azPlate, azPostal, azPassport, MaskPreset,
  phonePresets, detectPhoneCountry, PhoneCountry
} from "react-input-mask-format/presets";
import {
  isValidIin, isValidBin, isValidKzIban, luhn,
  isValidRuInn, isValidRuSnils, isValidRuOgrn, isValidRuOgrnip, isValidRuKpp,
  isValidRuBik, isValidRuAccount, isValidRuIban, isValidRuPlate,
  isValidUzPinfl, isValidUzInn,
  isValidKgInn, isValidKgAccount, isValidKgBik,
  isValidByPersonalId, isValidByUnp, isValidByIban, isValidTjInn,
  isValidAmPsn, isValidAmTin, isValidAmAccount,
  isValidAzVoen, isValidAzIban, isValidAzFin, isValidVin, isValidIban
} from "react-input-mask-format/validators";
import { NumberFormat, useNumberFormat } from "react-input-mask-format/number";
import { TimeFormat, useTimeFormat } from "react-input-mask-format/time";
import { DateFormat, useDateFormat } from "react-input-mask-format/date";
import {
  CardNumberFormat,
  CardExpiryFormat,
  CardCvcFormat,
  useCardNumberFormat,
} from "react-input-mask-format/card";
import type { CardBrand } from "react-input-mask-format/card";
import { Country } from "./countries";

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
    <div style={{ display: "flex", alignItems: "center" }} data-testid={`${testid}-state`} data-value={v}>
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

function CountryPhoneField() {
  const [country, setCountry] = useState<PhoneCountry>("KZ");
  const [phone, setPhone] = useState("");
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <select
        value={country}
        onChange={e => {
          setCountry(e.target.value as PhoneCountry);
          setPhone("");
        }}
        data-testid="phone-country"
        style={{ ...fieldStyle, width: 80 }}
      >
        {Object.keys(phonePresets).map(code => <option key={code}>{code}</option>)}
      </select>
      <InputMask
        {...phonePresets[country]}
        value={phone}
        onChange={e => setPhone((e.target as HTMLInputElement).value)}
        onPaste={e => {
          const text = e.clipboardData.getData("text");
          const detected = detectPhoneCountry(text);
          if (detected && detected !== country) {
            e.preventDefault();
            setCountry(detected);
            setPhone(text);
          }
        }}
        data-testid="phone-any"
        style={fieldStyle}
      />
    </div>
  );
}

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

function PhoneHookField() {
  const ref = useMask(kzPhone);
  return <input ref={ref} data-testid="kzPhone-hook" style={fieldStyle} />;
}

function NumericHookField() {
  const ref = useNumberFormat({ thousandSeparator: " " });
  return <input ref={ref} data-testid="numeric-hook" style={fieldStyle} />;
}

function TimeHookField() {
  const ref = useTimeFormat({});
  return <input ref={ref} data-testid="time-hook" style={fieldStyle} />;
}

function DateHookField() {
  const ref = useDateFormat({ order: "ymd", separator: "-" });
  return <input ref={ref} data-testid="date-format-hook" style={fieldStyle} />;
}

function CardNumberHookField() {
  const [brand, setBrand] = useState<CardBrand | undefined>(undefined);
  const ref = useCardNumberFormat({ onValueChange: v => setBrand(v.brand) });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <input ref={ref} data-testid="card-number-hook" style={fieldStyle} />
      <span data-testid="card-brand-hook" style={{ color: dim, fontSize: 12, minWidth: 80 }}>{brand ?? "—"}</span>
    </div>
  );
}

const COUNTRIES: { id: Country; label: string }[] = [
  { id: Country.Kz, label: "KZ" },
  { id: Country.Ru, label: "RU" },
  { id: Country.Uz, label: "UZ" },
  { id: Country.Kg, label: "KG" },
  { id: Country.By, label: "BY" },
  { id: Country.Tj, label: "TJ" },
  { id: Country.Am, label: "AM" },
  { id: Country.Az, label: "AZ" },
  { id: Country.Ge, label: "GE" },
  { id: Country.Md, label: "MD" },
  { id: Country.Ua, label: "UA" },
  { id: Country.Tm, label: "TM" }
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
  const [country, setCountry] = useState<Country>(Country.Kz);
  const [hex, setHex] = useState("");
  const [up, setUp] = useState("");
  const [amount, setAmount] = useState<number | undefined>(undefined);
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardBrand, setCardBrand] = useState<CardBrand | undefined>(undefined);
  const [cardValid, setCardValid] = useState(false);
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");

  return (
    <main style={{ background: bg, minHeight: "100vh", color: ink, fontFamily: "system-ui, sans-serif", margin: 0 }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px 64px", display: "grid", gap: 26 }}>
        <header>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: "ui-monospace, monospace", fontWeight: 600 }}>react-input-mask-format</span>
            <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 11, color: bg, background: gold, padding: "2px 7px", borderRadius: 20, fontWeight: 700 }}>v2.7</span>
          </div>
          <h1 style={{ fontSize: 26, margin: "10px 0 4px" }}>General-purpose input masks for React — with batteries</h1>
          <p style={{ color: dim, margin: 0 }}>Zero-deps · presets are a country-agnostic system · country packs: Kazakhstan, Russia, Uzbekistan, Kyrgyzstan, Belarus, Tajikistan, Armenia, Azerbaijan; phones and postal codes: Georgia, Moldova, Ukraine, Turkmenistan.</p>
        </header>

        <section style={{ display: "grid", gap: 9 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: dim }}>Country preset packs · /presets</div>
            <CountryTabs value={country} onChange={setCountry} />
          </div>
          {country === Country.Kz && (
            <>
              <Row label="Телефон" sub="kzPhone"><PresetField preset={kzPhone} testid="kzPhone" /></Row>
              <Row label="ИИН" sub="kzIin · checksum"><PresetField preset={kzIin} testid="iin" validate={isValidIin} /></Row>
              <Row label="БИН" sub="kzBin · checksum"><PresetField preset={kzBin} testid="bin" validate={isValidBin} /></Row>
              <Row label="IBAN" sub="kzIban · UPPER · mod-97"><PresetField preset={kzIban} testid="iban" validate={isValidKzIban} /></Row>
              <Row label="Госномер" sub="kzPlate · UPPER"><PresetField preset={kzPlate} testid="plate" /></Row>
              <Row label="Индекс" sub="kzPostal"><PresetField preset={kzPostal} testid="postal" /></Row>
            </>
          )}
          {country === Country.Ru && (
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
          {country === Country.Uz && (
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
          {country === Country.Kg && (
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
          {country === Country.By && (
            <>
              <Row label="Телефон" sub="byPhone"><PresetField preset={byPhone} testid="byPhone" /></Row>
              <Row label="Личный номер" sub="byPersonalId · checksum"><PresetField preset={byPersonalId} testid="byPersonalId" validate={isValidByPersonalId} /></Row>
              <Row label="УНП" sub="byUnp · checksum"><PresetField preset={byUnp} testid="byUnp" validate={isValidByUnp} /></Row>
              <Row label="IBAN" sub="byIban · MOD-97"><PresetField preset={byIban} testid="byIban" validate={isValidByIban} /></Row>
              <Row label="Госномер" sub="byPlate · UPPER"><PresetField preset={byPlate} testid="byPlate" /></Row>
              <Row label="Индекс" sub="byPostal"><PresetField preset={byPostal} testid="byPostal" /></Row>
              <Row label="Паспорт / ID" sub="byPassport · UPPER"><PresetField preset={byPassport} testid="byPassport" /></Row>
            </>
          )}
          {country === Country.Tj && (
            <>
              <Row label="Телефон" sub="tjPhone"><PresetField preset={tjPhone} testid="tjPhone" /></Row>
              <Row label="ИНН" sub="tjInn · structure"><PresetField preset={tjInn} testid="tjInn" validate={isValidTjInn} /></Row>
              <Row label="ЕИН" sub="tjEin"><PresetField preset={tjEin} testid="tjEin" /></Row>
              <Row label="Р/счёт" sub="tjAccount"><PresetField preset={tjAccount} testid="tjAccount" /></Row>
              <Row label="БИК" sub="tjBik"><PresetField preset={tjBik} testid="tjBik" /></Row>
              <Row label="Госномер" sub="tjPlate · UPPER"><PresetField preset={tjPlate} testid="tjPlate" /></Row>
              <Row label="Госномер юрлица" sub="tjPlateCompany · UPPER"><PresetField preset={tjPlateCompany} testid="tjPlateCompany" /></Row>
              <Row label="Индекс" sub="tjPostal"><PresetField preset={tjPostal} testid="tjPostal" /></Row>
            </>
          )}
          {country === Country.Am && (
            <>
              <Row label="Телефон" sub="amPhone"><PresetField preset={amPhone} testid="amPhone" /></Row>
              <Row label="ՀԾՀ (ОСН)" sub="amPsn · structure"><PresetField preset={amPsn} testid="amPsn" validate={isValidAmPsn} /></Row>
              <Row label="ՀՎՀՀ (ИНН)" sub="amTin · structure"><PresetField preset={amTin} testid="amTin" validate={isValidAmTin} /></Row>
              <Row label="Р/счёт" sub="amAccount · structure"><PresetField preset={amAccount} testid="amAccount" validate={isValidAmAccount} /></Row>
              <Row label="Госномер" sub="amPlate · UPPER"><PresetField preset={amPlate} testid="amPlate" /></Row>
              <Row label="Индекс" sub="amPostal"><PresetField preset={amPostal} testid="amPostal" /></Row>
              <Row label="Паспорт" sub="amPassport · UPPER"><PresetField preset={amPassport} testid="amPassport" /></Row>
            </>
          )}
          {country === Country.Az && (
            <>
              <Row label="Телефон" sub="azPhone"><PresetField preset={azPhone} testid="azPhone" /></Row>
              <Row label="FIN" sub="azFin · structure · UPPER"><PresetField preset={azFin} testid="azFin" validate={isValidAzFin} /></Row>
              <Row label="VÖEN" sub="azVoen · checksum"><PresetField preset={azVoen} testid="azVoen" validate={isValidAzVoen} /></Row>
              <Row label="IBAN" sub="azIban · MOD-97"><PresetField preset={azIban} testid="azIban" validate={isValidAzIban} /></Row>
              <Row label="Госномер" sub="azPlate · UPPER"><PresetField preset={azPlate} testid="azPlate" /></Row>
              <Row label="Индекс" sub="azPostal"><PresetField preset={azPostal} testid="azPostal" /></Row>
              <Row label="Паспорт" sub="azPassport · UPPER"><PresetField preset={azPassport} testid="azPassport" /></Row>
            </>
          )}
          {country === Country.Ge && (
            <>
              <Row label="Телефон" sub="gePhone"><PresetField preset={gePhone} testid="gePhone" /></Row>
              <Row label="Индекс" sub="gePostal"><PresetField preset={gePostal} testid="gePostal" /></Row>
              <Row label="IBAN" sub="iban · MOD-97"><PresetField preset={iban} testid="geIban" validate={v => isValidIban(v, "GE")} /></Row>
            </>
          )}
          {country === Country.Md && (
            <>
              <Row label="Телефон" sub="mdPhone"><PresetField preset={mdPhone} testid="mdPhone" /></Row>
              <Row label="Индекс" sub="mdPostal"><PresetField preset={mdPostal} testid="mdPostal" /></Row>
              <Row label="IBAN" sub="iban · MOD-97"><PresetField preset={iban} testid="mdIban" validate={v => isValidIban(v, "MD")} /></Row>
            </>
          )}
          {country === Country.Ua && (
            <>
              <Row label="Телефон" sub="uaPhone"><PresetField preset={uaPhone} testid="uaPhone" /></Row>
              <Row label="Индекс" sub="uaPostal"><PresetField preset={uaPostal} testid="uaPostal" /></Row>
              <Row label="IBAN" sub="iban · MOD-97"><PresetField preset={iban} testid="uaIban" validate={v => isValidIban(v, "UA")} /></Row>
            </>
          )}
          {country === Country.Tm && (
            <>
              <Row label="Телефон" sub="tmPhone"><PresetField preset={tmPhone} testid="tmPhone" /></Row>
              <Row label="Индекс" sub="tmPostal"><PresetField preset={tmPostal} testid="tmPostal" /></Row>
            </>
          )}
          <Row label="Карта" sub="card · Luhn"><PresetField preset={card} testid="card" validate={luhn} /></Row>
          <Row label="VIN" sub="vin · I→1, O/Q→0"><PresetField preset={vin} testid="vin" validate={isValidVin} /></Row>
          <Row label="IBAN" sub="iban · MOD-97"><PresetField preset={iban} testid="iban-any" validate={isValidIban} /></Row>
          <Row label="Телефон + страна" sub="phonePresets · detectPhoneCountry"><CountryPhoneField /></Row>
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
          <Row label="Phone hook" sub="useMask(kzPhone)"><PhoneHookField /></Row>
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

        <section style={{ display: "grid", gap: 9 }}>
          <div style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: dim }}>Date · /date</div>
          <Row label="Date" sub={`DateFormat · DD.MM.YYYY → ${date || "—"}`}>
            <DateFormat
              value={date}
              onValueChange={v => setDate(v.value)}
              data-testid="date-format" style={fieldStyle}
            />
          </Row>
          <Row label="Raw date hook" sub="useDateFormat · YYYY-MM-DD"><DateHookField /></Row>
        </section>

        <section style={{ display: "grid", gap: 9 }}>
          <div style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: dim }}>Карта · /card</div>
          <Row label="Карта" sub={`CardNumberFormat · ${cardValid ? "valid" : "—"}`}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <CardNumberFormat
                value={cardNumber}
                onValueChange={v => {
                  setCardNumber(v.value);
                  setCardBrand(v.brand);
                  setCardValid(v.valid);
                }}
                data-testid="card-number" style={fieldStyle}
              />
              <span data-testid="card-brand" style={{ color: gold, fontSize: 12, minWidth: 80 }}>{cardBrand ?? "—"}</span>
            </div>
          </Row>
          <Row label="Срок" sub="CardExpiryFormat · MM/YY">
            <CardExpiryFormat
              value={cardExpiry}
              onValueChange={v => setCardExpiry(v.value)}
              data-testid="card-expiry" style={fieldStyle}
            />
          </Row>
          <Row label="CVC" sub={`CardCvcFormat · ${cardBrand === "amex" ? 4 : 3} digits`}>
            <CardCvcFormat
              brand={cardBrand}
              value={cardCvc}
              onValueChange={v => setCardCvc(v.value)}
              data-testid="card-cvc" style={fieldStyle}
            />
          </Row>
          <Row label="Raw card hook" sub="useCardNumberFormat"><CardNumberHookField /></Row>
        </section>
        {import.meta.env.DEV && (
          <input data-testid="scratch" aria-label="scratch" style={{ ...fieldStyle, opacity: 0.35 }} />
        )}
      </div>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
