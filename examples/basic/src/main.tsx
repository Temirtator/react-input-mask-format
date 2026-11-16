import { useState } from "react";
import { createRoot } from "react-dom/client";
import { useForm, Controller } from "react-hook-form";
import InputMask, { useMask, isMaskComplete } from "react-input-mask-format";
import { kzPhone, kzIin } from "react-input-mask-format/presets";
import { isValidIin } from "react-input-mask-format/validators";
import { NumberFormat } from "react-input-mask-format/number";
import { DateFormat } from "react-input-mask-format/date";
import { CardNumberFormat, CardExpiryFormat } from "react-input-mask-format/card";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "grid", gap: 4, marginBottom: 12 }}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function HookField() {
  const ref = useMask({ mask: "99/99/9999" });
  return <input ref={ref} placeholder="dd/mm/yyyy" />;
}

type FormValues = { phone: string; iin: string; amount: string };

function App() {
  const [brand, setBrand] = useState<string>();
  const { control, register, handleSubmit } = useForm<FormValues>({ defaultValues: { phone: "", iin: "", amount: "" } });
  const [submitted, setSubmitted] = useState<FormValues>();

  return (
    <form onSubmit={handleSubmit(setSubmitted)} style={{ fontFamily: "system-ui", maxWidth: 360, margin: "40px auto" }}>
      <Field label="Phone (kzPhone preset)">
        <Controller
          name="phone"
          control={control}
          rules={{ validate: v => isMaskComplete(v, kzPhone) || "Enter the full number" }}
          render={({ field }) => <InputMask {...kzPhone} {...field} />}
        />
      </Field>
      <Field label="IIN (with checksum)">
        <Controller
          name="iin"
          control={control}
          rules={{ validate: v => isValidIin(v) || "Invalid IIN" }}
          render={({ field }) => <InputMask {...kzIin} {...field} />}
        />
      </Field>
      <Field label="Amount">
        <NumberFormat {...register("amount")} thousandSeparator=" " decimalScale={2} suffix=" ₸" />
      </Field>
      <Field label="Date">
        <DateFormat />
      </Field>
      <Field label={`Card${brand ? ` (${brand})` : ""}`}>
        <CardNumberFormat onValueChange={values => setBrand(values.brand)} />
      </Field>
      <Field label="Expiry">
        <CardExpiryFormat />
      </Field>
      <Field label="useMask on a plain input">
        <HookField />
      </Field>
      <button type="submit">Submit</button>
      {submitted && <pre>{JSON.stringify(submitted, null, 2)}</pre>}
    </form>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
