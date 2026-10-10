import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import type React from "react";

import { getInputSelection, isInputFocused } from "./utils/input";
import { createSelectionTracker } from "./core/selection-tracker";
import type { SelectionTracker } from "./core/selection-tracker";
import { isDOMElement } from "./utils/helpers";
import type { InputState, Selection } from "./types";

export type InputElementGetter = () => HTMLInputElement | null;

export function useInputElement(
  inputRef: React.MutableRefObject<HTMLInputElement | null>
): InputElementGetter {
  return useCallback(() => {
    let input: HTMLInputElement | Element | null = inputRef.current;
    const isDOMNode = typeof window !== "undefined" && isDOMElement(input);

    // workaround for react-test-renderer
    // https://github.com/sanniassin/react-input-mask/issues/147
    if (!input || !isDOMNode) {
      return null;
    }

    if (input.nodeName !== "INPUT") {
      input = input.querySelector("input");
    }

    if (!input) {
      throw new Error("react-input-mask: inputComponent doesn't contain input node");
    }

    return input as HTMLInputElement;
  }, [inputRef]);
}

function useSelection(
  inputRef: React.MutableRefObject<HTMLInputElement | null>,
  isMasked: boolean
) {
  const getInputElement = useInputElement(inputRef);
  const trackerRef = useRef<SelectionTracker | null>(null);
  if (trackerRef.current === null) {
    trackerRef.current = createSelectionTracker(getInputElement);
  }
  const tracker = trackerRef.current;

  const getSelection = useCallback(() => {
    const input = getInputElement();
    return getInputSelection(input as HTMLInputElement);
  }, [getInputElement]);

  const getLastSelection = useCallback(() => tracker.getLast(), [tracker]);

  const setSelection = useCallback((selection: Selection) => tracker.set(selection), [tracker]);

  useLayoutEffect(() => {
    if (!isMasked) {
      return;
    }

    const input = getInputElement();
    if (!input) return;
    input.addEventListener("focus", tracker.start);
    input.addEventListener("blur", tracker.stop);

    if (isInputFocused(input)) {
      tracker.start();
    }

    return () => {
      input.removeEventListener("focus", tracker.start);
      input.removeEventListener("blur", tracker.stop);

      tracker.stop();
    };
  });

  return { getSelection, getLastSelection, setSelection };
}

function useValue(
  inputRef: React.MutableRefObject<HTMLInputElement | null>,
  initialValue: string
) {
  const getInputElement = useInputElement(inputRef);
  const valueRef = useRef(initialValue);

  const getValue = useCallback(() => {
    return getInputElement()!.value;
  }, [getInputElement]);

  const getLastValue = useCallback(() => {
    return valueRef.current;
  }, []);

  const setValue = useCallback(
    (newValue: string) => {
      valueRef.current = newValue;

      const input = getInputElement();
      if (input) {
        input.value = newValue;
      }
    },
    [getInputElement]
  );

  return {
    getValue,
    getLastValue,
    setValue
  };
}

export function useInputState(
  initialValue: string,
  isMasked: boolean
): {
  inputRef: React.MutableRefObject<HTMLInputElement | null>;
  getInputState: () => InputState;
  getLastInputState: () => InputState;
  setInputState: (state: InputState) => void;
} {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { getSelection, getLastSelection, setSelection } = useSelection(inputRef, isMasked);
  const { getValue, getLastValue, setValue } = useValue(inputRef, initialValue);

  function getLastInputState(): InputState {
    return {
      value: getLastValue(),
      selection: getLastSelection()
    };
  }

  function getInputState(): InputState {
    return {
      value: getValue(),
      selection: getSelection()
    };
  }

  function setInputState({ value, selection }: InputState): void {
    setValue(value);
    setSelection(selection);
  }

  return {
    inputRef,
    getInputState,
    getLastInputState,
    setInputState
  };
}

export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}
