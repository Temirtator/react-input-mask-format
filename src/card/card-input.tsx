import * as React from "react";
import { component } from "../utils/component";
import { useDigitInput } from "../utils/digit-format";
import type { DigitFormatKind, DigitValues } from "../utils/digit-format";

/* @__NO_SIDE_EFFECTS__ */
export function cardInput<O, V extends DigitValues, P>(
  displayName: string,
  kind: DigitFormatKind<O, V>,
  option: keyof O & keyof P,
  autoComplete: string
): React.ForwardRefExoticComponent<React.PropsWithoutRef<P> & React.RefAttributes<HTMLInputElement>> {
  return component<HTMLInputElement, P>(displayName, function CardInput(props, forwardedRef) {
    const {
      value,
      defaultValue,
      onValueChange,
      onChange,
      [option]: setting,
      ...domProps
    } = props as P & {
      value?: string;
      defaultValue?: string;
      onValueChange?: (values: V) => void;
      onChange?: React.ChangeEventHandler<HTMLInputElement>;
    };
    const input = useDigitInput(
      kind,
      value,
      { [option]: setting } as O,
      onValueChange,
      forwardedRef,
      defaultValue,
      onChange
    );
    return <input inputMode="numeric" autoComplete={autoComplete} {...domProps} {...input} />;
  });
}
