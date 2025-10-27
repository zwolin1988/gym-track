import { useEffect } from "react";

/**
 * Hook chronicy przed przypadkowym zamkniciem strony podczas aktywnego treningu
 * Wy[wietla natywny dialog przegldarki ostrzegajcy o niezapisanych zmianach
 */
export function useBeforeUnload(enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // Standardowa metoda zapobiegania zamkniciu
      event.preventDefault();
      // Chrome wymaga ustawienia returnValue
      event.returnValue = "";
      return "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [enabled]);
}
