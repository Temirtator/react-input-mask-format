import React, { useLayoutEffect, forwardRef } from "react";

import { useInputState, useInputElement, usePrevious } from "./hooks";
import { validateMaxLength, validateChildren, validateMaskPlaceholder } from "./validate-props";
import { defer } from "./utils/defer";
import { isInputFocused } from "./utils/input";
import { isFunction, toString } from "./utils/helpers";
import { resolveMaskConfig } from "./core/config";
import type { MaskConfig } from "./core/config";
import { decideChange, decideFocus, decideBlur, decideClickSelection } from "./core/decide";
import { watchClick } from "./core/click-tracker";
import type { InputMaskProps, InputState } from "./types";

const InputMask = forwardRef<HTMLInputElement, InputMaskProps>(function InputMask(
  props,
  forwardedRef
) {
  const {
    alwaysShowMask = false,
    children,
    mask,
    maskPlaceholder: maskPlaceholderProp,
    beforeMaskedStateChange: beforeMaskedStateChangeProp,
    transform,
    maskChar,
    formatChars,
    beforeMaskedValueChange,
    ...restProps
  } = props;

  validateMaxLength(props);

  const { maskUtils, maskPlaceholder, beforeMaskedStateChange } = resolveMaskConfig({
    mask,
    maskPlaceholder: maskPlaceholderProp,
    maskChar,
    alwaysShowMask,
    formatChars,
    transform,
    beforeMaskedStateChange: beforeMaskedStateChangeProp,
    beforeMaskedValueChange
  });
  const config: MaskConfig = { maskUtils, maskPlaceholder, alwaysShowMask, beforeMaskedStateChange };

  validateMaskPlaceholder({ ...props, maskPlaceholder });

  const isMasked = !!mask;
  const isEditable = !restProps.disabled && !restProps.readOnly;
  const isControlled = props.value !== null && props.value !== undefined;
  const previousIsMasked = usePrevious(isMasked);
  const initialValue = toString(
    (isControlled ? props.value : props.defaultValue) || ""
  );

  const {
    inputRef,
    getInputState,
    setInputState,
    getLastInputState
  } = useInputState(initialValue, isMasked);
  const getInputElement = useInputElement(inputRef);

  function onChange(event: React.ChangeEvent<HTMLInputElement>): void {
    const newInputState = decideChange(config, getInputState(), getLastInputState());
    setInputState(newInputState);
    if (props.onChange) {
      props.onChange(event);
    }
  }

  function onFocus(event: React.FocusEvent<HTMLInputElement>): void {
    inputRef.current = event.target;

    const currentState = getInputState();
    const newInputState = isMasked ? decideFocus(config, currentState) : null;

    if (newInputState) {
      setInputState(newInputState);

      if (newInputState.value !== currentState.value && props.onChange) {
        props.onChange(event as unknown as React.ChangeEvent<HTMLInputElement>);
      }

      defer(() => {
        setInputState(getLastInputState());
      });
    }

    if (props.onFocus) {
      props.onFocus(event);
    }
  }

  function onBlur(event: React.FocusEvent<HTMLInputElement>): void {
    const currentState = getInputState();
    const newInputState = isMasked
      ? decideBlur(config, currentState, getLastInputState().value)
      : null;

    if (newInputState) {
      setInputState(newInputState);

      if (newInputState.value !== currentState.value && props.onChange) {
        props.onChange(event as unknown as React.ChangeEvent<HTMLInputElement>);
      }
    }

    if (props.onBlur) {
      props.onBlur(event);
    }
  }

  function onMouseDown(event: React.MouseEvent<HTMLInputElement>): void {
    const input = getInputElement();
    const { value } = getInputState();

    if (input && !isInputFocused(input) && !maskUtils.isValueFilled(value)) {
      watchClick(input, event, () => {
        const lastState = getLastInputState();
        setInputState({ ...lastState, selection: decideClickSelection(config, lastState.value) });
      });
    }

    if (props.onMouseDown) {
      props.onMouseDown(event);
    }
  }

  // For controlled inputs we want to provide properly formatted value
  // prop. Computed purely during render; refs/DOM are synced in a layout
  // effect so render stays side-effect free (StrictMode / concurrent).
  let renderValue = props.value as string | undefined;
  if (isMasked && isControlled) {
    const input = getInputElement();
    const isFocused = !!input && isInputFocused(input);
    let newValue =
      isFocused || alwaysShowMask || props.value
        ? maskUtils.formatControlledValue(props.value as string, getLastInputState().value)
        : (props.value as string);

    if (beforeMaskedStateChange) {
      newValue = beforeMaskedStateChange({
        nextState: { value: newValue, selection: { start: null, end: null } }
      }).value;
    }

    renderValue = newValue;
  }

  const lastSelection = getLastInputState().selection;

  useLayoutEffect(() => {
    if (isMasked && isControlled) {
      setInputState({
        ...getLastInputState(),
        value: renderValue as string
      });
    }
  });

  useLayoutEffect(() => {
    if (!isMasked) {
      return;
    }

    const input = getInputElement();
    const isFocused = isInputFocused(input as HTMLInputElement);
    const previousSelection = lastSelection;
    const currentState = getInputState();
    let newInputState: InputState = { ...currentState };

    // Update value for uncontrolled inputs to make sure
    // it's always in sync with mask props
    if (!isControlled) {
      const currentValue = currentState.value;
      const formattedValue = maskUtils.formatValue(currentValue);
      const isValueEmpty = maskUtils.isValueEmpty(formattedValue);
      const shouldFormatValue = !isValueEmpty || isFocused || alwaysShowMask;
      if (shouldFormatValue) {
        newInputState.value = formattedValue;
      } else if (isValueEmpty && !isFocused) {
        newInputState.value = "";
      }
    }

    if (isFocused && !previousIsMasked) {
      // Adjust selection if input got masked while being focused
      newInputState.selection = maskUtils.getDefaultSelectionForValue(
        newInputState.value
      );
    } else if (isControlled && isFocused && previousSelection) {
      // Restore cursor position if value has changed outside change event
      if (previousSelection.start !== null && previousSelection.end !== null) {
        newInputState.selection = previousSelection;
      }
    }

    if (beforeMaskedStateChange) {
      newInputState = beforeMaskedStateChange({
        currentState,
        nextState: newInputState
      });
    }

    setInputState(newInputState);
  });

  const inputProps = {
    ...restProps,
    onFocus,
    onBlur,
    onChange: isMasked && isEditable ? onChange : props.onChange,
    onMouseDown: isMasked && isEditable ? onMouseDown : props.onMouseDown,
    // `ref` may target either the plain <input> DOM node or, when custom
    // children are used, whatever node the child's own ref forwards to.
    ref: (ref: unknown) => {
      inputRef.current = ref as HTMLInputElement | null;

      if (isFunction(forwardedRef)) {
        (forwardedRef as (instance: unknown) => void)(ref);
      } else if (forwardedRef !== null && typeof forwardedRef === "object") {
        (forwardedRef as React.MutableRefObject<unknown>).current = ref;
      }
    },
    value: isMasked && isControlled ? renderValue : props.value
  };

  if (children) {
    validateChildren(props, children);

    // Clone the child injecting our props and callback ref directly.
    // If the child forwards its ref to a non-input node, useInputElement
    // falls back to querySelector("input") to find the real input.
    return React.cloneElement(children, inputProps);
  }

  return <input {...inputProps} />;
});

InputMask.displayName = "InputMask";

export { defaultFormatChars, extendedFormatChars } from "./constants";
export { useMask } from "./use-mask";
export type {
  InputMaskProps,
  InputState,
  Selection,
  BeforeMaskedStateChangeFn,
  BeforeMaskedValueChangeFn,
  Mask,
  Transform,
  FormatChars,
  UseMaskOptions
} from "./types";
export default InputMask;
