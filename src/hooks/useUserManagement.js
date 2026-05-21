import { useState, useCallback } from 'react';
import { formatUserName as formatUserNameUtil } from '../utils/nameUtils';

const USERS_STORAGE_KEY = 'c-projets-users';

export function useUserManagement(db, getInternalContacts) {
  const [usersList, setUsersList] = useState(() => {
    const saved = localStorage.getItem(USERS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const formatUserName = useCallback(name => formatUserNameUtil(name), []);

  const addNewUser = useCallback(
    name => {
      if (!name.trim()) return null;
      const formattedName = formatUserName(name);
      const existing = usersList.find(u => u.name.toLowerCase() === formattedName.toLowerCase());
      if (existing) return existing;
      const newUser = { id: Date.now(), name: formattedName };
      const newList = [...(usersList || []), newUser].sort((a, b) => a.name.localeCompare(b.name));
      setUsersList(newList);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(newList));
      return newUser;
    },
    [usersList, formatUserName]
  );

  const getUsers = useCallback(
    () => [...usersList].sort((a, b) => a.name.localeCompare(b.name)),
    [usersList]
  );

  const searchUsers = useCallback(
    query => {
      if (!query) return getUsers();
      const lowerQuery = query.toLowerCase();
      return usersList.filter(u => u.name.toLowerCase().includes(lowerQuery));
    },
    [usersList, getUsers]
  );

  const migrateUsersFromBoards = useCallback(() => {
    const existingUsers = new Set(usersList.map(u => u.name));
    const allBoards = db.boards || [];
    let migrated = 0;
    const newUsers = [...usersList];
    allBoards.forEach(board => {
      const contacts = getInternalContacts(board.id) || [];
      contacts.forEach(contact => {
        if (contact.name && contact.name.trim()) {
          const formatted = formatUserName(contact.name);
          if (!existingUsers.has(formatted)) {
            newUsers.push({ id: Date.now() + Math.random(), name: formatted });
            existingUsers.add(formatted);
            migrated++;
          }
        }
      });
    });
    if (migrated > 0) {
      const newList = newUsers.sort((a, b) => a.name.localeCompare(b.name));
      setUsersList(newList);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(newList));
    }
  }, [db.boards, usersList, getInternalContacts, formatUserName]);

  return {
    usersList,
    setUsersList,
    formatUserName,
    addNewUser,
    getUsers,
    searchUsers,
    migrateUsersFromBoards,
  };
}
