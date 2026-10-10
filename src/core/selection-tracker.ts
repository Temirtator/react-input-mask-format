import type { Selection } from "../types";
import { defer, cancelDefer } from "../utils/defer";
import { getInputSelection, setInputSelection, isInputFocused } from "../utils/input";

export interface SelectionTracker {
  start(): void;
  stop(): void;
  getLast(): Selection;
  set(selection: Selection): void;
}

export function createSelectionTracker(getInput: () => HTMLInputElement | null): SelectionTracker {
  let last: Selection = { start: null, end: null };
  let deferId: number | null = null;

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
      if (deferId !== null) {
        return;
      }
      loop();
    },
    stop() {
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
