import type { Selection } from "../types";
import { defer, cancelDefer } from "../utils/defer";
import { getInputSelection, setInputSelection, isInputFocused } from "../utils/input";

export interface SelectionTracker {
  start(): void;
  stop(): void;
  getLast(): Selection;
  set(selection: Selection): void;
}

const hasBeforeInput = typeof InputEvent !== "undefined" && "getTargetRanges" in InputEvent.prototype;

export function createSelectionTracker(getInput: () => HTMLInputElement | null): SelectionTracker {
  let last: Selection = { start: null, end: null };
  let deferId: number | null = null;
  let listening: HTMLInputElement | null = null;

  function read(): void {
    const input = getInput();
    if (input) {
      last = getInputSelection(input);
    }
  }

  function loop(): void {
    read();
    deferId = defer(loop);
  }

  return {
    start() {
      const input = getInput();
      if (input && listening !== input) {
        listening?.removeEventListener("beforeinput", read);
        input.addEventListener("beforeinput", read);
        listening = input;
      }
      if (hasBeforeInput) {
        read();
      } else if (deferId === null) {
        loop();
      }
    },
    stop() {
      listening?.removeEventListener("beforeinput", read);
      listening = null;
      cancelDefer(deferId);
      deferId = null;
    },
    getLast() {
      return last;
    },
    set(selection) {
      const input = getInput();
      if (!input || !isInputFocused(input)) {
        return;
      }
      setInputSelection(input, selection.start!, selection.end!);
      last = getInputSelection(input);
    }
  };
}
