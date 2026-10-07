import React, { useLayoutEffect, forwardRef } from "react";

import { useInputState, useInputElement, usePrevious } from "./hooks";
import { validateMaxLength, validateChildren, validateMaskPlaceholder } from "./validate-props";
import { defer } from "./utils/defer";
import { isInputFocused } from "./utils/input";
import { isFunction, toString, getElementDocument } from "./utils/helpers";
import MaskUtils from "./utils/mask";
import {
  resolveMaskPlaceholder,
  normalizeFormatChars,
  createBeforeMaskedStateChangeAdapter,
  warnDeprecatedOnce
} from "./v2-compat";
import { resolveTransform } from "./utils/transform";
import type { InputMaskProps, InputState, V2MaskOptions } from "./types";

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

  if (maskChar !== undefined) {
    warnDeprecatedOnce("maskChar", "maskChar is deprecated, use maskPlaceholder instead. See migration guide: https://github.com/Temirtator/react-input-mask-format#migrating-from-react-input-mask");
  }
  if (beforeMaskedValueChange !== undefined) {
    warnDeprecatedOnce("beforeMaskedValueChange", "beforeMaskedValueChange is deprecated, use beforeMaskedStateChange. See migration guide: https://github.com/Temirtator/react-input-mask-format#migrating-from-react-input-mask");
  }

  const resolvedPlaceholder = resolveMaskPlaceholder(maskPlaceholderProp, maskChar);
  const maskPlaceholder = resolvedPlaceholder === undefined ? "_" : resolvedPlaceholder;

  validateMaxLength(props);
  validateMaskPlaceholder({ ...props, maskPlaceholder });

  const { formatChars: normalizedFormatChars, hasLegacyString } =
    normalizeFormatChars(formatChars);
  if (hasLegacyString) {
    warnDeprecatedOnce(
      "formatChars",
      "string values in formatChars are deprecated, pass RegExp values instead (e.g. { \"#\": /[0-9]/ }). See migration guide: https://github.com/Temirtator/react-input-mask-format#migrating-from-react-input-mask"
    );
  }

  const maskUtils = new MaskUtils({
    mask,
    maskPlaceholder,
    formatChars: normalizedFormatChars,
    transform: resolveTransform(transform)
  });

  let beforeMaskedStateChange = beforeMaskedStateChangeProp;
  if (!beforeMaskedStateChange && beforeMaskedValueChange) {
    const v2MaskOptions: V2MaskOptions = {
      mask,
      maskChar: maskPlaceholder,
      alwaysShowMask,
      formatChars: formatChars ?? { "9": "[0-9]", a: "[A-Za-z]", "*": "[A-Za-z0-9]" },
      permanents: maskUtils.maskOptions.permanents
    };
    beforeMaskedStateChange = createBeforeMaskedStateChangeAdapter(
      beforeMaskedValueChange,
      v2MaskOptions
    );
  }

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
    const currentState = getInputState();
    const previousState = getLastInputState();
    let newInputState: InputState = maskUtils.processChange(currentState, previousState);

    if (beforeMaskedStateChange) {
      newInputState = beforeMaskedStateChange({
        currentState,
        previousState,
        nextState: newInputState
      });
    }

    setInputState(newInputState);

    if (props.onChange) {
      props.onChange(event);
    }
  }

  function onFocus(event: React.FocusEvent<HTMLInputElement>): void {
    // If autoFocus property is set, focus event fires before the ref handler gets called
    inputRef.current = event.target;

    const currentValue = getInputState().value;

    if (isMasked && !maskUtils.isValueFilled(currentValue)) {
      let newValue = maskUtils.formatValue(currentValue);
      let newSelection = maskUtils.getDefaultSelectionForValue(newValue);
      let newInputState: InputState = {
        value: newValue,
        selection: newSelection
      };

      if (beforeMaskedStateChange) {
        newInputState = beforeMaskedStateChange({
          currentState: getInputState(),
          nextState: newInputState
        });
        newValue = newInputState.value;
        newSelection = newInputState.selection;
      }

      setInputState(newInputState);

      if (newValue !== currentValue && props.onChange) {
        props.onChange(event as unknown as React.ChangeEvent<HTMLInputElement>);
      }

      // Chrome resets selection after focus event,
      // so we want to restore it later
      defer(() => {
        setInputState(getLastInputState());
      });
    }

    if (props.onFocus) {
      props.onFocus(event);
    }
  }

  function onBlur(event: React.FocusEvent<HTMLInputElement>): void {
    const currentValue = getInputState().value;
    const lastValue = getLastInputState().value;

    if (isMasked && !alwaysShowMask && maskUtils.isValueEmpty(lastValue)) {
      let newValue = "";
      let newInputState: InputState = {
        value: newValue,
        selection: { start: null, end: null }
      };

      if (beforeMaskedStateChange) {
        newInputState = beforeMaskedStateChange({
          currentState: getInputState(),
          nextState: newInputState
        });
        newValue = newInputState.value;
      }

      setInputState(newInputState);

      if (newValue !== currentValue && props.onChange) {
        props.onChange(event as unknown as React.ChangeEvent<HTMLInputElement>);
      }
    }

    if (props.onBlur) {
      props.onBlur(event);
    }
  }

  // Tiny unintentional mouse movements can break cursor
  // position on focus, so we have to restore it in that case
  //
  // https://github.com/sanniassin/react-input-mask/issues/108
  function onMouseDown(event: React.MouseEvent<HTMLInputElement>): void {
    const input = getInputElement();
    const { value } = getInputState();
    const inputDocument = getElementDocument(input);

    if (!isInputFocused(input as HTMLInputElement) && !maskUtils.isValueFilled(value)) {
      const mouseDownX = event.clientX;
      const mouseDownY = event.clientY;
      const mouseDownTime = new Date().getTime();

      const mouseUpHandler = (mouseUpEvent: MouseEvent): void => {
        inputDocument!.removeEventListener("mouseup", mouseUpHandler);

        if (!isInputFocused(input as HTMLInputElement)) {
          return;
        }

        const deltaX = Math.abs(mouseUpEvent.clientX - mouseDownX);
        const deltaY = Math.abs(mouseUpEvent.clientY - mouseDownY);
        const axisDelta = Math.max(deltaX, deltaY);
        const timeDelta = new Date().getTime() - mouseDownTime;

        if (
          (axisDelta <= 10 && timeDelta <= 200) ||
          (axisDelta <= 5 && timeDelta <= 300)
        ) {
          const lastState = getLastInputState();
          const newSelection = maskUtils.getDefaultSelectionForValue(
            lastState.value
          );
          const newState = {
            ...lastState,
            selection: newSelection
          };
          setInputState(newState);
        }
      };

      inputDocument!.addEventListener("mouseup", mouseUpHandler);
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
