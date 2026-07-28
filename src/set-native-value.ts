// Write to input.value through the native prototype setter so React's
// internal value tracker stays stale. The user's keystroke `input` event then
// bubbles into React's root listener, which sees masked value != stale tracker
// and fires the consumer's onChange with the masked value. Using the tracked
// (React-wrapped) setter instead would suppress that onChange.
export function setNativeValue(input: HTMLInputElement, value: string): void {
  const descriptor = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value"
  );
  const setter = descriptor && descriptor.set;
  if (setter) {
    setter.call(input, value);
  } else {
    input.value = value;
  }
}
