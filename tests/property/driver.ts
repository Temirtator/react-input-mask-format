import type { InputState, Subject } from "./subject";

export interface Field {
  value: string;
  start: number;
  end: number;
}

export type Action =
  | { kind: "type"; char: string }
  | { kind: "paste"; text: string }
  | { kind: "select"; from: number; to: number }
  | { kind: "selectAll" }
  | { kind: "moveCaret"; at: number }
  | { kind: "backspace" }
  | { kind: "del" }
  | { kind: "autofill"; text: string }
  | { kind: "focus" };

export function describeAction(action: Action): string {
  switch (action.kind) {
    case "type":
      return `type ${JSON.stringify(action.char)}`;
    case "paste":
      return `paste ${JSON.stringify(action.text)}`;
    case "autofill":
      return `autofill ${JSON.stringify(action.text)}`;
    case "select":
      return `select ${action.from.toFixed(2)}..${action.to.toFixed(2)}`;
    case "moveCaret":
      return `caret ${action.at.toFixed(2)}`;
    default:
      return action.kind;
  }
}

function toField(state: InputState): Field {
  const start = state.selection.start ?? state.value.length;
  const end = state.selection.end ?? start;
  return { value: state.value, start, end };
}

function previousOf(field: Field): InputState {
  return {
    value: field.value,
    selection: { start: field.start, end: field.end, length: field.end - field.start }
  };
}

function edit(subject: Subject, field: Field, value: string, caret: number): Field {
  return toField(subject.change({ value, selection: { start: caret, end: caret } }, previousOf(field)));
}

export function focus(subject: Subject, value = ""): Field {
  const state = subject.focus({ value, selection: { start: value.length, end: value.length } });
  return state ? toField(state) : { value, start: value.length, end: value.length };
}

function at(field: Field, fraction: number): number {
  return Math.min(field.value.length, Math.floor(fraction * (field.value.length + 1)));
}

export function insert(subject: Subject, field: Field, text: string): Field {
  const value = field.value.slice(0, field.start) + text + field.value.slice(field.end);
  return edit(subject, field, value, field.start + text.length);
}

export function caretAt(field: Field, position: number): Field {
  return { ...field, start: position, end: position };
}

export function apply(subject: Subject, field: Field, action: Action): Field {
  const { value, start, end } = field;
  switch (action.kind) {
    case "type":
      return insert(subject, field, action.char);
    case "paste":
      return insert(subject, field, action.text);
    case "autofill":
      return edit(subject, field, action.text, action.text.length);
    case "focus":
      return focus(subject, value);
    case "select": {
      const a = at(field, Math.min(action.from, action.to));
      const b = at(field, Math.max(action.from, action.to));
      return { ...field, start: a, end: b };
    }
    case "selectAll":
      return { ...field, start: 0, end: value.length };
    case "moveCaret":
      return caretAt(field, at(field, action.at));
    case "backspace":
      if (start !== end) {
        return edit(subject, field, value.slice(0, start) + value.slice(end), start);
      }
      return start === 0 ? field : edit(subject, field, value.slice(0, start - 1) + value.slice(start), start - 1);
    case "del":
      if (start !== end) {
        return edit(subject, field, value.slice(0, start) + value.slice(end), start);
      }
      return start === value.length ? field : edit(subject, field, value.slice(0, start) + value.slice(start + 1), start);
  }
}

export function run(subject: Subject, actions: Action[], from: Field = focus(subject)): Field[] {
  const fields = [from];
  for (const action of actions) {
    fields.push(apply(subject, fields[fields.length - 1], action));
  }
  return fields;
}

export function typeString(subject: Subject, field: Field, text: string): Field {
  return text.split("").reduce((current, char) => insert(subject, current, char), field);
}

export function pasteOverAll(subject: Subject, field: Field, text: string): Field {
  return insert(subject, { ...field, start: 0, end: field.value.length }, text);
}
