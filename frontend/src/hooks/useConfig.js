import { useEffect, useState } from "react";
import { designService } from "../services/designService.js";

export default function useConfig() {
  const [config, setConfig] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    designService
      .loadConfig()
      .then((value) => {
        if (active) setConfig(value);
      })
      .catch((reason) => {
        if (active) setError(reason);
      });
    return () => {
      active = false;
    };
  }, []);

  return { config, error };
}
