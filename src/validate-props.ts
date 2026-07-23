import type React from "react";
import { CONTROLLED_PROPS } from "./constants";
import type { InputMaskProps } from "./types";

function warnDev(condition: boolean, message: string): void {
  if (process.env.NODE_ENV !== "production" && !condition) {
    console.error(`react-input-mask-format: ${message}`);
  }
}

function invariant(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`react-input-mask-format: ${message}`);
  }
}

export function validateMaxLength(props: InputMaskProps): void {
  warnDev(
    !props.maxLength || !props.mask,
    "maxLength property shouldn't be passed to the masked input. It breaks masking and unnecessary because length is limited by the mask length."
  );
}

export function validateMaskPlaceholder(props: InputMaskProps & { maskPlaceholder?: string | null }): void {
  const { mask, maskPlaceholder } = props;

  invariant(
    !mask ||
      !maskPlaceholder ||
      maskPlaceholder.length === 1 ||
      maskPlaceholder.length === mask.length,
    "maskPlaceholder should either be a single character or have the same length as the mask:\n" +
      `mask: ${mask}\n` +
      `maskPlaceholder: ${maskPlaceholder}`
  );
}

export function validateChildren(
  props: InputMaskProps,
  inputElement: React.ReactElement
): void {
  const conflictProps = CONTROLLED_PROPS.filter(
    propId =>
      (inputElement.props as Record<string, unknown>)[propId] != null &&
      (inputElement.props as Record<string, unknown>)[propId] !==
        (props as Record<string, unknown>)[propId]
  );

  invariant(
    !conflictProps.length,
    `the following props should be passed to the InputMask component, not to children: ${conflictProps.join(",")}`
  );
}
