import { useContext } from "react";
import { PreferencesContext } from "./preferencesContext";

export function usePreferences() {
  const preferences = useContext(PreferencesContext);
  if (!preferences) {
    throw new Error("usePreferences must be used within PreferencesProvider");
  }
  return preferences;
}
