export function isTestDom(): boolean {
  return typeof navigator !== "undefined" && /jsdom|HappyDOM/.test(navigator.userAgent);
}
