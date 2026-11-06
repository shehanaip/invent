import { PreferencesContext } from "./preferencesContext";

export default function PreferencesProvider({ value, children }) {
  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}
