import type React from "react";
import { CONTROLLED_PROPS } from "./constants";
import type { InputMaskProps, Mask } from "./types";

function warnDev(condition: boolean, message: string): void {
  if (process.env.NODE_ENV !== "production" && !condition) {
    console.error(`react-input-mask-format: ${message}`);
  }
}

let warned: string[] | undefined;

function warnDevOnce(condition: boolean, message: string): void {
  if (process.env.NODE_ENV !== "production" && !condition) {
    warned = warned || [];
    if (warned.indexOf(message) === -1) {
      warned.push(message);
      console.error(`react-input-mask-format: ${message}`);
    }
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

export function validateMaskPlaceholder(props: { mask?: Mask | null; maskPlaceholder?: string | null }): void {
  const { mask, maskPlaceholder } = props;

  invariant(
    !mask ||
      !maskPlaceholder ||
      maskPlaceholder.length === 1 ||
      maskPlaceholder.length === (typeof mask === "string" ? mask.replace(/\\([\s\S]?)/g, "$1") : mask).length,
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

export function validateEditablePositions(mask: Mask | null | undefined, lastEditablePosition: number | null): void {
  warnDevOnce(
    !mask || (lastEditablePosition ?? -1) >= 0,
    `the mask has no editable positions, so nothing can be typed into the field: ${JSON.stringify(mask)}`
  );
}

export function validateInputElement(input: HTMLInputElement | null): void {
  if (process.env.NODE_ENV !== "production") {
    invariant(
      !!input,
      "InputMask could not find its <input>. A custom child component must forward its ref to the input element (React.forwardRef)."
    );
  }
}
