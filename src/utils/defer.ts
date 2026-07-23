export function defer(fn: FrameRequestCallback): number {
  return requestAnimationFrame(fn);
}

export function cancelDefer(deferId: number | null): void {
  if (deferId !== null) {
    cancelAnimationFrame(deferId);
  }
}
