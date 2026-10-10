import { getElementDocument } from "../utils/helpers";
import { isInputFocused } from "../utils/input";

export function watchClick(
  input: HTMLInputElement,
  event: { clientX: number; clientY: number },
  onQuickClick: () => void
): void {
  const inputDocument = getElementDocument(input);
  if (!inputDocument) {
    return;
  }
  const mouseDownX = event.clientX;
  const mouseDownY = event.clientY;
  const mouseDownTime = new Date().getTime();

  const mouseUpHandler = (mouseUpEvent: MouseEvent): void => {
    inputDocument.removeEventListener("mouseup", mouseUpHandler);
    if (!isInputFocused(input)) {
      return;
    }
    const deltaX = Math.abs(mouseUpEvent.clientX - mouseDownX);
    const deltaY = Math.abs(mouseUpEvent.clientY - mouseDownY);
    const axisDelta = Math.max(deltaX, deltaY);
    const timeDelta = new Date().getTime() - mouseDownTime;
    if ((axisDelta <= 10 && timeDelta <= 200) || (axisDelta <= 5 && timeDelta <= 300)) {
      onQuickClick();
    }
  };

  inputDocument.addEventListener("mouseup", mouseUpHandler);
}
