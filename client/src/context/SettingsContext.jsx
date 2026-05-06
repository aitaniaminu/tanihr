import { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext(null);

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

export function SettingsProvider({ children }) {
  const [clientName, setClientName] = useState(() => {
    return localStorage.getItem('tanihr_client_name') || '';
  });

  const updateClientName = (name) => {
    setClientName(name);
    localStorage.setItem('tanihr_client_name', name);
  };

  return (
    <SettingsContext.Provider value={{ clientName, updateClientName }}>
      {children}
    </SettingsContext.Provider>
  );
}
