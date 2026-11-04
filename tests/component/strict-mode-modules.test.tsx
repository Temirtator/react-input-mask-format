import React, { useState } from "react";
import { NumberFormat, useNumberFormat } from "../../src/number";
import { TimeFormat, useTimeFormat } from "../../src/time";
import { DateFormat, useDateFormat } from "../../src/date";
import {
  CardNumberFormat,
  useCardNumberFormat,
  CardExpiryFormat,
  useCardExpiryFormat,
  CardCvcFormat,
  useCardCvcFormat
} from "../../src/card";
import type { NumberFormatValues } from "../../src/number";
import {
  compareStrictMode,
  microtasks,
  focus,
  blur,
  selectAll,
  external,
  type,
  paste,
  caret,
  write,
  rerender
} from "./strict-mode-harness";
import type { Field, Row } from "./strict-mode-harness";

function controlled(
  Input: React.ElementType,
  pick: (values: NumberFormatValues) => unknown = values => values.value
): Field {
  return function Controlled({ emit, initial = "", external = "", ...options }) {
    const [value, setValue] = useState(initial);
    return (
      <>
        <Input
          {...options}
          value={value}
          onValueChange={(values: NumberFormatValues) => {
            emit(values);
            setValue(pick(values));
          }}
          data-testid="field"
        />
        <button type="button" onClick={() => setValue(external)}>external</button>
      </>
    );
  };
}

function uncontrolled(Input: React.ElementType): Field {
  return function Uncontrolled({ emit, ...options }) {
    return <Input {...options} onValueChange={emit} data-testid="field" />;
  };
}

function hooked(useFormat: (options: never) => React.RefCallback<HTMLInputElement>): Field {
  return function Hooked({ emit, defaultValue, ...options }) {
    const ref = useFormat({ ...options, onValueChange: emit } as never);
    return <input ref={ref} defaultValue={defaultValue as string | undefined} data-testid="field" />;
  };
}

const backspaces = (count: number) => Array.from({ length: count }, () => type("{Backspace}"));

const isAllowed = (values: NumberFormatValues) => values.floatValue === undefined || values.floatValue <= 99;
const grouped = { thousandSeparator: "," };
const money = { thousandSeparator: ",", prefix: "$ ", decimalScale: 2 };

const numberRows: Row[] = [
  ["types key by key", grouped, [focus, type("1234567")], "1,234,567"],
  ["Backspace", grouped, [focus, type("1234567"), ...backspaces(2)], "12,345"],
  ["Backspace in the middle", grouped, [focus, type("1234567"), caret(3), type("{Backspace}")], "134,567"],
  ["prefix and decimals", money, [focus, type("1234.5")], "$ 1,234.5"],
  ["pastes", money, [focus, paste("1234.567")], "$ 1,234.56"],
  ["select all + retype", grouped, [focus, type("1234"), selectAll, type("98")], "98"],
  ["focus and blur", grouped, [focus, type("1234"), blur], "1,234"]
];

const numberComponentRows: Row[] = [
  ["isAllowed rejects a mid-string edit", { isAllowed }, [focus, type("15"), caret(1), type("3")], "15"],
  [
    "formats the initial value",
    { ...grouped, decimalScale: 2, fixedDecimalScale: true, initial: "1234.5" },
    [],
    "1,234.50"
  ],
  ["external value change", { ...grouped, external: "9876543" }, [focus, type("12"), external], "9,876,543"]
];

const numberFloatRows: Row[] = [
  ["keeps a trailing decimal separator", money, [focus, type("12.5")], "$ 12.5"],
  ["keeps trailing zeros", money, [focus, type("1.50")], "$ 1.50"],
  ["isAllowed rejects an edit", { isAllowed }, [focus, type("123")], "12"]
];

const numberHookRows: Row[] = [
  ["formats defaultValue", { ...grouped, defaultValue: "1234567" }, [], "1,234,567"],
  ["edits defaultValue", { ...grouped, defaultValue: "1234567" }, [focus, type("{Backspace}")], "123,456"],
  ["option change", grouped, [focus, type("1234"), rerender({ prefix: "$ " }), type("5")], "$ 12,345"]
];

const timeRows: Row[] = [
  ["types and clamps key by key", {}, [focus, type("2999")], "23:59"],
  ["steps back with Backspace", {}, [focus, type("223"), ...backspaces(3)], ""],
  ["Backspace after the separator in the middle", {}, [focus, type("1230"), caret(3), type("{Backspace}")], "13:0"],
  ["Delete before the separator in the middle", {}, [focus, type("1230"), caret(2), type("{Delete}")], "12:0"],
  ["multi-character separator", { separator: " : " }, [focus, type("22"), type("{Backspace}")], "2"],
  ["pastes", {}, [focus, paste("09:05")], "09:05"],
  ["select all + retype", {}, [focus, type("1230"), selectAll, type("0815")], "08:15"],
  ["focus and blur", {}, [focus, type("12"), blur], "12:"],
  ["separator change", {}, [focus, type("1230"), rerender({ separator: "." })], "12.30", 5]
];

const timeComponentRows: Row[] = [
  ["edits the initial value", { initial: "09:05" }, [focus, type("{End}{Backspace}7")], "09:07", 2],
  ["external value change", { external: "09:05" }, [focus, type("12"), external], "09:05"]
];

const timeHookRows: Row[] = [
  ["formats defaultValue", { defaultValue: "0905" }, [], "09:05"],
  ["edits defaultValue", { defaultValue: "0905" }, [focus, type("{Backspace}")], "09:0"],
  [
    "outside write then separator change",
    {},
    [focus, type("1230"), write("09:05"), rerender({ separator: "." })],
    "09.05"
  ]
];

const dateRows: Row[] = [
  ["types and clamps key by key", {}, [focus, type("45139999")], "31.12.9999"],
  ["steps back with Backspace", {}, [focus, type("12053"), ...backspaces(4)], "1"],
  [
    "Backspace after a separator in the middle",
    {},
    [focus, type("12052024"), caret(3), type("{Backspace}"), type("2")],
    "12.05.2024"
  ],
  [
    "multi-character separator, month first",
    { order: "mdy", separator: " / " },
    [focus, type("0512"), type("{Backspace}")],
    "05 / 1"
  ],
  ["pastes a padded date", {}, [focus, paste("1.5.2024")], "01.05.2024"],
  ["select all + retype", {}, [focus, type("12052024"), selectAll, type("01062025")], "01.06.2025"],
  ["a date that does not exist", {}, [focus, type("31022024")], "31.02.2024"],
  ["focus and blur", {}, [focus, type("1205"), blur], "12.05."],
  ["order change", {}, [focus, type("12052024"), rerender({ order: "ymd", separator: "-" })], "2024-05-12", 9]
];

const dateComponentRows: Row[] = [
  ["edits the initial ISO value", { initial: "2024-05-12" }, [focus, type("{End}{Backspace}5")], "12.05.2025", 2],
  [
    "Backspace in the middle of the initial value",
    { initial: "2024-05-12" },
    [focus, caret(2), type("{Backspace}")],
    "10.52.024"
  ],
  ["external value change", { external: "2024-06-01" }, [focus, type("1205"), external], "01.06.2024"]
];

const dateHookRows: Row[] = [
  ["formats defaultValue", { defaultValue: "12052024" }, [], "12.05.2024"],
  [
    "re-lays out defaultValue on an order change",
    { defaultValue: "12.05.2024" },
    [rerender({ order: "mdy" })],
    "05.12.2024",
    1
  ],
  [
    "outside write then order change",
    {},
    [focus, type("12052024"), write("01.01.2030"), rerender({ order: "ymd", separator: "-" })],
    "2030-01-01"
  ]
];

const cardNumberRows: Row[] = [
  ["groups an Amex key by key", {}, [focus, type("378282246310005")], "3782 822463 10005"],
  ["stops at the longest length", {}, [focus, type("55555555555544449")], "5555 5555 5555 4444"],
  [
    "Backspace after a separator in the middle",
    {},
    [focus, type("41111111"), caret(5), type("{Backspace}")],
    "4111 111"
  ],
  ["Delete before a separator in the middle", {}, [focus, type("41111111"), caret(4), type("{Delete}")], "4111 111"],
  ["types in the middle across a brand change", {}, [focus, type("41111111"), caret(0), type("3")], "3411 11111"],
  ["pastes with dashes", {}, [focus, paste("4111-1111-1111-1111")], "4111 1111 1111 1111"],
  ["select all + retype", {}, [focus, type("4111111111111111"), selectAll, type("5555")], "5555"],
  ["focus and blur", {}, [focus, type("4111"), blur], "4111"],
  [
    "separator change",
    {},
    [focus, type("4111111111111111"), rerender({ separator: "-" })],
    "4111-1111-1111-1111",
    17
  ]
];

const cardNumberComponentRows: Row[] = [
  [
    "round-trips the initial value",
    { initial: "4111111111111111" },
    [focus, type("{End}{Backspace}")],
    "4111 1111 1111 111",
    1
  ],
  ["external value change", { external: "378282246310005" }, [focus, type("4111"), external], "3782 822463 10005"]
];

const cardNumberHookRows: Row[] = [
  ["formats defaultValue", { defaultValue: "4111111111111111" }, [], "4111 1111 1111 1111"],
  ["pastes with a custom separator", { separator: "-" }, [focus, paste("4111 1111 1111 1111")], "4111-1111-1111-1111"]
];

const cardExpiryRows: Row[] = [
  ["types key by key", {}, [focus, type("1226")], "12/26"],
  ["steps back with Backspace", {}, [focus, type("1226"), ...backspaces(3)], "1"],
  ["pastes a four-digit year", {}, [focus, paste("12/2026")], "12/26"],
  ["Backspace shifts the month", {}, [focus, type("1296"), caret(2), type("{Backspace}"), type("2")], "12/96"],
  ["select all + retype", {}, [focus, type("1226"), selectAll, type("0130")], "01/30"],
  ["focus and blur", {}, [focus, type("12"), blur], "12/"],
  ["separator change", {}, [focus, type("1226"), rerender({ separator: " / " })], "12 / 26", 5]
];

const cardExpiryComponentRows: Row[] = [
  ["formats the initial value", { initial: "12/26", separator: " / " }, [], "12 / 26"],
  ["external value change", { external: "01/30" }, [focus, type("12"), external], "01/30"]
];

const cardExpiryHookRows: Row[] = [["formats defaultValue", { defaultValue: "1226" }, [], "12/26"]];

const cardCvcRows: Row[] = [
  ["cuts to the brand length", { brand: "amex" }, [focus, type("12345")], "1234"],
  [
    "cuts and reports when the brand leaves amex",
    { brand: "amex" },
    [focus, type("1234"), rerender({ brand: "visa" })],
    "123",
    5
  ],
  [
    "emits nothing on a brand change of the same length",
    { brand: "visa" },
    [focus, type("123"), rerender({ brand: "mastercard" })],
    "123",
    3
  ],
  ["Backspace", {}, [focus, type("123"), type("{Backspace}")], "12"],
  ["pastes", { brand: "amex" }, [focus, paste("98765")], "9876"],
  ["select all + retype", {}, [focus, type("123"), selectAll, type("98")], "98"],
  ["focus and blur", {}, [focus, type("12"), blur], "12"]
];

const cardCvcComponentRows: Row[] = [["external value change", { external: "987" }, [focus, type("12"), external], "987"]];

const cardCvcHookRows: Row[] = [
  ["formats defaultValue", { brand: "amex", defaultValue: "12345" }, [], "1234"],
  [
    "does not bring back a value cleared from outside",
    { brand: "amex" },
    [focus, type("1234"), write(""), rerender({ brand: undefined })],
    "",
    4
  ]
];

const storingFloat = controlled(NumberFormat, values => values.floatValue);

compareStrictMode([
  ["NumberFormat", controlled(NumberFormat), [...numberRows, ...numberComponentRows], microtasks],
  ["NumberFormat storing floatValue", storingFloat, [...numberRows, ...numberFloatRows], microtasks],
  ["useNumberFormat", hooked(useNumberFormat), [...numberRows, ...numberHookRows], microtasks],
  ["TimeFormat", controlled(TimeFormat), [...timeRows, ...timeComponentRows], microtasks],
  ["useTimeFormat", hooked(useTimeFormat), [...timeRows, ...timeHookRows], microtasks],
  ["DateFormat", controlled(DateFormat), [...dateRows, ...dateComponentRows], microtasks],
  ["useDateFormat", hooked(useDateFormat), [...dateRows, ...dateHookRows], microtasks],
  ["CardNumberFormat", controlled(CardNumberFormat), [...cardNumberRows, ...cardNumberComponentRows], microtasks],
  ["CardNumberFormat uncontrolled", uncontrolled(CardNumberFormat), cardNumberRows, microtasks],
  ["useCardNumberFormat", hooked(useCardNumberFormat), [...cardNumberRows, ...cardNumberHookRows], microtasks],
  ["CardExpiryFormat", controlled(CardExpiryFormat), [...cardExpiryRows, ...cardExpiryComponentRows], microtasks],
  ["CardExpiryFormat uncontrolled", uncontrolled(CardExpiryFormat), cardExpiryRows, microtasks],
  ["useCardExpiryFormat", hooked(useCardExpiryFormat), [...cardExpiryRows, ...cardExpiryHookRows], microtasks],
  ["CardCvcFormat", controlled(CardCvcFormat), [...cardCvcRows, ...cardCvcComponentRows], microtasks],
  ["CardCvcFormat uncontrolled", uncontrolled(CardCvcFormat), cardCvcRows, microtasks],
  ["useCardCvcFormat", hooked(useCardCvcFormat), [...cardCvcRows, ...cardCvcHookRows], microtasks]
]);
