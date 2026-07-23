import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import type React from "react";

import { defer, cancelDefer } from "./utils/defer";
import { setInputSelection, getInputSelection, isInputFocused } from "./utils/input";
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

function useDeferLoop(callback: () => void): [() => void, () => void] {
  const deferIdRef = useRef<number | null>(null);

  const runLoop = useCallback(() => {
    // If there are simulated focus events, runLoop could be
    // called multiple times without blur or re-render
    if (deferIdRef.current !== null) {
      return;
    }

    function loop() {
      callback();
      deferIdRef.current = defer(loop);
    }

    loop();
  }, [callback]);

  const stopLoop = useCallback(() => {
    cancelDefer(deferIdRef.current);
    deferIdRef.current = null;
  }, []);

  useEffect(() => {
    if (deferIdRef.current) {
      stopLoop();
      runLoop();
    }
  }, [runLoop, stopLoop]);

  useEffect(() => cancelDefer(deferIdRef.current), []);

  return [runLoop, stopLoop];
}

function useSelection(
  inputRef: React.MutableRefObject<HTMLInputElement | null>,
  isMasked: boolean
) {
  const selectionRef = useRef<Selection>({ start: null, end: null });
  const getInputElement = useInputElement(inputRef);

  const getSelection = useCallback(() => {
    const input = getInputElement();
    return getInputSelection(input as HTMLInputElement);
  }, [getInputElement]);

  const getLastSelection = useCallback(() => {
    return selectionRef.current;
  }, []);

  const setSelection = useCallback(
    (selection: Selection) => {
      const input = getInputElement();

      // Don't change selection on unfocused input
      // because Safari sets focus on selection change (#154)
      if (!input || !isInputFocused(input)) {
        return;
      }

      setInputSelection(input, selection.start!, selection.end!);

      // Use actual selection in case the requested one was out of range
      selectionRef.current = getSelection();
    },
    [getInputElement, getSelection]
  );

  const selectionLoop = useCallback(() => {
    selectionRef.current = getSelection();
  }, [getSelection]);
  const [runSelectionLoop, stopSelectionLoop] = useDeferLoop(selectionLoop);

  useLayoutEffect(() => {
    if (!isMasked) {
      return;
    }

    const input = getInputElement();
    if (!input) return;
    input.addEventListener("focus", runSelectionLoop);
    input.addEventListener("blur", stopSelectionLoop);

    if (isInputFocused(input)) {
      runSelectionLoop();
    }

    return () => {
      input.removeEventListener("focus", runSelectionLoop);
      input.removeEventListener("blur", stopSelectionLoop);

      stopSelectionLoop();
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
