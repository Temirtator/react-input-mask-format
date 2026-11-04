import { useRef, useCallback, useEffect } from "react";
import type React from "react";
import { resolveMaskConfig } from "./core/config";
import { createMaskController } from "./bind-mask";
import type { MaskController } from "./bind-mask";
import type { UseMaskOptions } from "./types";

export function useMask(options: UseMaskOptions): React.RefCallback<HTMLInputElement> {
  const config = resolveMaskConfig(options);

  const controllerRef = useRef<MaskController | null>(null);
  const configRef = useRef(config);
  configRef.current = config;

  useEffect(() => {
    controllerRef.current?.update(config);
  });

  return useCallback((el: HTMLInputElement | null) => {
    if (el) {
      const controller = createMaskController(configRef.current);
      controller.bind(el);
      controllerRef.current = controller;
    } else {
      controllerRef.current?.unbind();
      controllerRef.current = null;
    }
  }, []);
}
