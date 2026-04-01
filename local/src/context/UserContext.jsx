import React, { createContext, useContext, useState } from 'react';

const UserContext = createContext(null);

const STORAGE_KEY_USERNAME = 'c-projets-username';

export function UserProvider({ children }) {
  const [currentUsername, setCurrentUsername] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_USERNAME) || '';
  });

  const updateUsername = (username) => {
    setCurrentUsername(username);
    localStorage.setItem(STORAGE_KEY_USERNAME, username);
  };

  const value = {
    currentUsername,
    setCurrentUsername: updateUsername,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
