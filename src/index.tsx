import * as React from "react";
import { useReducer, useRef } from "react";
import { useIsomorphicLayoutEffect } from "./utils/layout-effect";

import { useInputState, useInputElement, usePrevious } from "./hooks";
import { validateMaxLength, validateChildren, validateInputElement } from "./validate-props";
import { defer } from "./utils/defer";
import { isInputFocused, getInputSelection } from "./utils/input";
import { isFunction, toString } from "./utils/helpers";
import { resolveMaskConfig } from "./core/config";
import type { MaskConfig } from "./core/config";
import { decideChange, decideFocus, decideBlur, decideClickSelection, formatDefaultValue } from "./core/decide";
import { watchClick } from "./core/click-tracker";
import { component } from "./utils/component";
import type { InputMaskProps, InputState } from "./types";

const InputMask = /* @__PURE__ */ component<HTMLInputElement, InputMaskProps>("InputMask", function InputMask(
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

  const isMasked = !!mask;
  const isEditable = !restProps.disabled && !restProps.readOnly;
  const isControlled = props.value !== null && props.value !== undefined;
  const previousIsMasked = usePrevious(isMasked);
  const initialValue = toString((isControlled ? props.value : props.defaultValue) ?? "");

  const {
    inputRef,
    getInputState,
    setInputState,
    getLastInputState
  } = useInputState(initialValue, isMasked);
  const getInputElement = useInputElement(inputRef);
  const compositionRef = useRef<InputState | null>(null);
  const composingTextRef = useRef<string | null>(null);
  const composedRef = useRef(false);
  const [, forceUpdate] = useReducer((n: number) => n + 1, 0);

  function onChange(event: React.ChangeEvent<HTMLInputElement>): void {
    if (compositionRef.current || (event.nativeEvent as InputEvent).isComposing) {
      compositionRef.current = compositionRef.current || getLastInputState();
      if (isControlled) {
        composingTextRef.current = event.target.value;
        forceUpdate();
      }
      return;
    }
    if (composedRef.current) {
      composedRef.current = false;
      if (event.target.value === getLastInputState().value) return;
    }
    const newInputState = decideChange(config, getInputState(), getLastInputState());
    setInputState(newInputState);
    if (props.onChange) {
      props.onChange(event);
    }
  }

  function onCompositionStart(event: React.CompositionEvent<HTMLInputElement>): void {
    compositionRef.current = { value: getLastInputState().value, selection: getInputSelection(event.currentTarget) };
    if (props.onCompositionStart) {
      props.onCompositionStart(event);
    }
  }

  function onCompositionEnd(event: React.CompositionEvent<HTMLInputElement>): void {
    const before = compositionRef.current;
    compositionRef.current = null;
    composingTextRef.current = null;
    if (before && event.currentTarget.value !== before.value) {
      setInputState(decideChange(config, getInputState(), before));
      composedRef.current = true;
      if (props.onChange) {
        props.onChange(event as unknown as React.ChangeEvent<HTMLInputElement>);
      }
    }
    if (isControlled) {
      forceUpdate();
    }
    if (props.onCompositionEnd) {
      props.onCompositionEnd(event);
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
    } else if (isMasked && currentState.value !== getLastInputState().value) {
      setInputState(currentState);
    }

    if (props.onFocus) {
      props.onFocus(event);
    }
  }

  function onBlur(event: React.FocusEvent<HTMLInputElement>): void {
    compositionRef.current = null;
    composingTextRef.current = null;
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
        setInputState({
          ...lastState,
          selection: decideClickSelection(config, lastState.value, getInputSelection(input))
        });
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
    const valueText = toString(props.value);
    let newValue =
      isFocused || alwaysShowMask || valueText
        ? maskUtils.formatControlledValue(valueText, getLastInputState().value)
        : valueText;

    if (beforeMaskedStateChange) {
      newValue = beforeMaskedStateChange({
        nextState: { value: newValue, selection: { start: null, end: null } }
      }).value;
    }

    renderValue = newValue;
  }

  const lastSelection = getLastInputState().selection;

  useIsomorphicLayoutEffect(() => {
    if (isMasked && isControlled && !compositionRef.current) {
      setInputState({
        ...getLastInputState(),
        value: renderValue as string
      });
    }
  });

  useIsomorphicLayoutEffect(() => {
    if (!isMasked || compositionRef.current) {
      return;
    }

    const input = getInputElement();
    validateInputElement(input);
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
    onCompositionStart: isMasked && isEditable ? onCompositionStart : props.onCompositionStart,
    onCompositionEnd: isMasked && isEditable ? onCompositionEnd : props.onCompositionEnd,
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
    value: isMasked && isControlled ? (composingTextRef.current ?? renderValue) : props.value,
    ...(isMasked && !isControlled && (initialValue || alwaysShowMask)
      ? { defaultValue: formatDefaultValue(config, initialValue) }
      : {})
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


export { defaultFormatChars, extendedFormatChars } from "./constants";
export { useMask } from "./use-mask";
export type {
  InputMaskProps,
  InputState,
  Selection,
  BeforeMaskedStateChangeFn,
  BeforeMaskedValueChangeFn,
  V2MaskOptions,
  Mask,
  Transform,
  FormatChars,
  UseMaskOptions
} from "./types";
export default InputMask;
