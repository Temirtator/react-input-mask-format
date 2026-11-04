import InputMask, { useMask } from "react-input-mask-format";
import type { InputMaskProps } from "react-input-mask-format";
import { kzPhone } from "react-input-mask-format/presets";
import { isValidIin } from "react-input-mask-format/validators";
import { NumberFormat } from "react-input-mask-format/number";
import { DateFormat } from "react-input-mask-format/date";
import { TimeFormat } from "react-input-mask-format/time";
import { CardNumberFormat } from "react-input-mask-format/card";

const props: InputMaskProps = { mask: "99/99" };

export function Form() {
  const ref = useMask({ mask: "99/99/9999" });
  return (
    <form>
      <InputMask {...props} onChange={event => event.target.value.toUpperCase()} />
      <InputMask {...kzPhone} />
      <input ref={ref} />
      <NumberFormat onValueChange={values => values.floatValue} />
      <DateFormat onValueChange={values => values.value} />
      <TimeFormat />
      <CardNumberFormat onValueChange={values => values.brand} />
      <output>{String(isValidIin("000000000000"))}</output>
    </form>
  );
}
