import InputMask from "react-input-mask-format";
import { kzPhone } from "react-input-mask-format/presets";
import { isValidIin } from "react-input-mask-format/validators";
import { NumberFormat } from "react-input-mask-format/number";
import { DateFormat } from "react-input-mask-format/date";
import { TimeFormat } from "react-input-mask-format/time";
import { CardNumberFormat } from "react-input-mask-format/card";

export default function Page() {
  return (
    <form>
      <InputMask {...kzPhone} defaultValue="7011234567" />
      <NumberFormat value="1234.5" thousandSeparator="," />
      <DateFormat defaultValue="2024-05-12" />
      <TimeFormat defaultValue="09:05" />
      <CardNumberFormat defaultValue="4111111111111111" />
      <output>{String(isValidIin("000000000000"))}</output>
    </form>
  );
}
