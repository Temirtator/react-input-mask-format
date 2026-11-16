import { forwardRef } from "react";
import type * as React from "react";

export function component<T, P>(
  displayName: string,
  render: React.ForwardRefRenderFunction<T, React.PropsWithoutRef<P>>
): React.ForwardRefExoticComponent<React.PropsWithoutRef<P> & React.RefAttributes<T>> {
  const result = forwardRef<T, P>(render);
  result.displayName = displayName;
  return result;
}
