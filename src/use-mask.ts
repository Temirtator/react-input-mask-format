import { useRef, useCallback, useEffect } from "react";
import type React from "react";
import MaskUtils from "./utils/mask";
import { createMaskController } from "./bind-mask";
import type { MaskController, MaskControllerOptions } from "./bind-mask";
import {
  resolveMaskPlaceholder,
  normalizeFormatChars,
  createBeforeMaskedStateChangeAdapter,
  warnDeprecatedOnce
} from "./v2-compat";
import { resolveTransform } from "./utils/transform";
import type { UseMaskOptions, BeforeMaskedStateChangeFn, V2MaskOptions } from "./types";

export function useMask(options: UseMaskOptions): React.RefCallback<HTMLInputElement> {
  const {
    mask,
    maskPlaceholder: maskPlaceholderProp,
    alwaysShowMask = false,
    formatChars,
    transform,
    beforeMaskedStateChange: beforeMaskedStateChangeProp,
    beforeMaskedValueChange
  } = options;

  if (beforeMaskedValueChange !== undefined) {
    warnDeprecatedOnce(
      "beforeMaskedValueChange",
      "beforeMaskedValueChange is deprecated, use beforeMaskedStateChange."
    );
  }

  const resolvedPlaceholder = resolveMaskPlaceholder(maskPlaceholderProp, undefined);
  const maskPlaceholder = resolvedPlaceholder === undefined ? "_" : resolvedPlaceholder;

  const { formatChars: normalizedFormatChars, hasLegacyString } = normalizeFormatChars(formatChars);
  if (hasLegacyString) {
    warnDeprecatedOnce(
      "formatChars",
      "string values in formatChars are deprecated, pass RegExp values instead."
    );
  }

  const maskUtils = new MaskUtils({
    mask: mask ?? null,
    maskPlaceholder,
    formatChars: normalizedFormatChars,
    transform: resolveTransform(transform)
  });

  let beforeMaskedStateChange: BeforeMaskedStateChangeFn | undefined = beforeMaskedStateChangeProp;
  if (!beforeMaskedStateChange && beforeMaskedValueChange) {
    const v2MaskOptions: V2MaskOptions = {
      mask: mask ?? undefined,
      maskChar: maskPlaceholder,
      alwaysShowMask,
      formatChars: formatChars ?? { "9": "[0-9]", a: "[A-Za-z]", "*": "[A-Za-z0-9]" },
      permanents: maskUtils.maskOptions.permanents
    };
    beforeMaskedStateChange = createBeforeMaskedStateChangeAdapter(beforeMaskedValueChange, v2MaskOptions);
  }

  const controllerOptions: MaskControllerOptions = { alwaysShowMask, beforeMaskedStateChange };

  const controllerRef = useRef<MaskController | null>(null);

  // Keep the live controller's engine/options current across re-renders
  // without re-binding DOM listeners. Done in an effect (not during render)
  // so the hook stays render-pure under StrictMode / concurrent React.
  useEffect(() => {
    controllerRef.current?.update(maskUtils, controllerOptions);
  });

  return useCallback((el: HTMLInputElement | null) => {
    if (el) {
      const controller = createMaskController(maskUtils, controllerOptions);
      controller.bind(el);
      controllerRef.current = controller;
    } else {
      controllerRef.current?.unbind();
      controllerRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
