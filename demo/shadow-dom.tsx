import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import InputMask, { useMask } from "react-input-mask-format";
import { kzPhone } from "react-input-mask-format/presets";
import { DateFormat } from "react-input-mask-format/date";
import { CardNumberFormat } from "react-input-mask-format/card";
import { NumberFormat } from "react-input-mask-format/number";

function HookField() {
  const ref = useMask(kzPhone);
  return <input ref={ref} data-testid="shadow-hook" />;
}

function Fixture() {
  const [date, setDate] = useState("");
  const [card, setCard] = useState("");
  const [amount, setAmount] = useState<number | undefined>(undefined);
  return (
    <>
      <InputMask mask="99/99/9999" data-testid="shadow-mask" />
      <HookField />
      <DateFormat value={date} onValueChange={v => setDate(v.value)} data-testid="shadow-date" />
      <CardNumberFormat value={card} onValueChange={v => setCard(v.value)} data-testid="shadow-card" />
      <NumberFormat
        value={amount ?? ""}
        onValueChange={v => setAmount(v.floatValue)}
        thousandSeparator=" "
        decimalScale={2}
        fixedDecimalScale
        data-testid="shadow-number"
      />
    </>
  );
}

const shadow = document.getElementById("host")!.attachShadow({ mode: "open" });
const container = document.createElement("div");
shadow.appendChild(container);
createRoot(container).render(<Fixture />);
