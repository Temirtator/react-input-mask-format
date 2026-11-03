import React from "react";
import { createRoot } from "react-dom/client";
import InputMask, { useMask } from "react-input-mask-format";

function HookField() {
  const ref = useMask({ mask: "99/99/9999" });
  return <input ref={ref} defaultValue="12122020" data-testid="reset-hook" />;
}

createRoot(document.getElementById("root")!).render(
  <form>
    <InputMask mask="99/99/9999" defaultValue="12122020" data-testid="reset-mask" />
    <HookField />
    <InputMask mask="99/99/9999" data-testid="reset-empty" />
    <button type="reset" data-testid="reset">Reset</button>
    <input data-testid="reset-scratch" />
  </form>
);
