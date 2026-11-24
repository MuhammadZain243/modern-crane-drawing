import { useEffect, useState } from "react";
import { designService } from "../services/designService.js";

export default function useDebouncedPreview(values, config) {
  const [preview, setPreview] = useState({
    dimensions: [],
    loading: false,
    error: null,
    invalid: false,
    fields: {},
  });

  useEffect(() => {
    if (!config) return undefined;
    let active = true;
    const timer = window.setTimeout(async () => {
      setPreview((current) => ({ ...current, loading: true, error: null, invalid: false }));
      try {
        const dimensions = await designService.preview(values, config);
        if (active) {
          setPreview({ dimensions, loading: false, error: null, invalid: false, fields: {} });
        }
      } catch (error) {
        if (active) {
          setPreview({
            dimensions: [],
            loading: false,
            error: error.code === "VALIDATION_ERROR" ? null : error,
            invalid: error.code === "VALIDATION_ERROR",
            fields: error.fields || {},
          });
        }
      }
    }, 350);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [values, config]);

  return preview;
}
