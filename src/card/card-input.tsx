import React, { forwardRef } from "react";
import { useDigitInput } from "../utils/digit-format";
import type { DigitFormatKind, DigitValues } from "../utils/digit-format";

export function cardInput<O, V extends DigitValues, P>(
  kind: DigitFormatKind<O, V>,
  option: keyof O & keyof P,
  autoComplete: string
): React.ForwardRefExoticComponent<React.PropsWithoutRef<P> & React.RefAttributes<HTMLInputElement>> {
  return forwardRef<HTMLInputElement, P>(function CardInput(props, forwardedRef) {
    const {
      value = "",
      onValueChange,
      [option]: setting,
      ...domProps
    } = props as P & { value?: string; onValueChange?: (values: V) => void };
    const input = useDigitInput(
      kind,
      value,
      { [option]: setting } as O,
      onValueChange,
      forwardedRef
    );
    return <input inputMode="numeric" autoComplete={autoComplete} {...domProps} {...input} />;
  });
}
