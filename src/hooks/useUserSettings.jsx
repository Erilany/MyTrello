import { useState, useCallback } from 'react';

export function useUserSettings() {
  const [username, setUsername] = useState(() => localStorage.getItem('c-projets-username') || '');

  const [userRole, setUserRole] = useState(
    () => localStorage.getItem('c-projets-user-role') || 'user'
  );

  const updateUsername = useCallback(name => {
    setUsername(name);
    localStorage.setItem('c-projets-username', name);
  }, []);

  const updateUserRole = useCallback(role => {
    setUserRole(role);
    localStorage.setItem('c-projets-user-role', role);
  }, []);

  return {
    username,
    setUsername: updateUsername,
    userRole,
    setUserRole: updateUserRole,
  };
}

export default useUserSettings;
