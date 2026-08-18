import { useEffect } from "react";

type ShortcutHandlers = {
  search?: () => void;
  newRegistration?: () => void;
};

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  const { search, newRegistration } = handlers;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        search?.();
      } else if (event.key === "F2") {
        event.preventDefault();
        newRegistration?.();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [search, newRegistration]);
}