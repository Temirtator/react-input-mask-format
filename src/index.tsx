import React, { useLayoutEffect, forwardRef } from "react";

import { useInputState, useInputElement, usePrevious } from "./hooks";
import { validateMaxLength, validateChildren, validateMaskPlaceholder } from "./validate-props";
import { defer } from "./utils/defer";
import { isInputFocused } from "./utils/input";
import { isFunction, toString, getElementDocument } from "./utils/helpers";
import MaskUtils from "./utils/mask";
import ChildrenWrapper from "./children-wrapper";
import type { InputMaskProps, InputState } from "./types";

const InputMask = forwardRef<HTMLInputElement, InputMaskProps>(function InputMask(
  props,
  forwardedRef
) {
  const {
    alwaysShowMask = false,
    children,
    mask,
    maskPlaceholder = "_",
    beforeMaskedStateChange,
    ...restProps
  } = props;

  validateMaxLength(props);
  validateMaskPlaceholder({ ...props, maskPlaceholder });

  const maskUtils = new MaskUtils({ mask, maskPlaceholder });

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

  // For controlled inputs we want to provide properly formatted
  // value prop
  if (isMasked && isControlled) {
    const input = getInputElement();
    const isFocused = input && isInputFocused(input);
    let newValue =
      isFocused || alwaysShowMask || props.value
        ? maskUtils.formatValue(props.value as string)
        : (props.value as string);

    if (beforeMaskedStateChange) {
      newValue = beforeMaskedStateChange({
        nextState: { value: newValue, selection: { start: null, end: null } }
      }).value;
    }

    setInputState({
      ...getLastInputState(),
      value: newValue
    });
  }

  const lastState = getLastInputState();
  const lastSelection = lastState.selection;
  const lastValue = lastState.value;

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
    // children are used, the ChildrenWrapper class instance (React strips
    // `ref` from props regardless of the target type) — matches old JS.
    ref: (ref: unknown) => {
      inputRef.current = ref as HTMLInputElement | null;

      if (isFunction(forwardedRef)) {
        (forwardedRef as (instance: unknown) => void)(ref);
      } else if (forwardedRef !== null && typeof forwardedRef === "object") {
        (forwardedRef as React.MutableRefObject<unknown>).current = ref;
      }
    },
    value: isMasked && isControlled ? lastValue : props.value
  };

  if (children) {
    validateChildren(props, children);

    // We wrap children into a class component to be able to find
    // their input element using findDOMNode
    return <ChildrenWrapper {...inputProps}>{children}</ChildrenWrapper>;
  }

  return <input {...inputProps} />;
});

InputMask.displayName = "InputMask";

export type { InputMaskProps, InputState, Selection, BeforeMaskedStateChangeFn, Mask } from "./types";
export default InputMask;
