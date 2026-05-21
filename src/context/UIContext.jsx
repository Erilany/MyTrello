import { createContext, useContext } from 'react';
import { useUI } from '../hooks/useUI.jsx';
import { useSettings } from '../hooks/useSettings.jsx';

const UIContext = createContext(null);

export function UIProvider({ children }) {
  const ui = useUI();
  const settings = useSettings();

  return (
    <UIContext.Provider value={{ ...ui, ...settings }}>
      {children}
    </UIContext.Provider>
  );
}

export function useUIContext() {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUIContext must be used within a UIProvider');
  }
  return context;
}
