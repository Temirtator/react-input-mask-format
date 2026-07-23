import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import InputMask from "react-input-mask-format";

function App() {
  const [phone, setPhone] = useState("");
  return (
    <main style={{ fontFamily: "sans-serif", maxWidth: 480, margin: "40px auto", display: "grid", gap: 16 }}>
      <h1>react-input-mask-format</h1>
      <label>
        Date (uncontrolled) <br />
        <InputMask mask="99/99/9999" data-testid="date" />
      </label>
      <label>
        Phone (controlled, prefix) <br />
        <InputMask
          mask="+7 (999) 999-99-99"
          value={phone}
          onChange={e => setPhone((e.target as HTMLInputElement).value)}
          data-testid="phone"
        />
      </label>
      <label>
        Legacy v2 props (maskChar) <br />
        <InputMask mask="99-99" maskChar="•" alwaysShowMask data-testid="legacy" />
      </label>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
