import { useCallback } from 'react';

export function useMessages(db, saveDb, username) {
  const getMessages = useCallback(
    boardId => {
      return (db.messages || []).filter(m => Number(m.board_id) === Number(boardId));
    },
    [db.messages]
  );

  const addMessage = useCallback(
    (boardId, content, author) => {
      const newMessage = {
        id: db.nextIds.message++,
        board_id: boardId,
        content,
        author,
        read_by: [author],
        created_at: new Date().toISOString(),
      };
      const newDb = {
        ...db,
        messages: [...(db.messages || []), newMessage],
        nextIds: { ...db.nextIds },
      };
      saveDb(newDb);
      return newMessage;
    },
    [db, saveDb]
  );

  const markMessagesAsRead = useCallback(
    (boardId, user) => {
      const messages = (db.messages || []).filter(m => Number(m.board_id) === Number(boardId));
      const updatedMessages = messages.map(msg => {
        if (!msg.read_by.includes(user)) {
          return { ...msg, read_by: [...msg.read_by, user] };
        }
        return msg;
      });
      const newDb = {
        ...db,
        messages: [
          ...(db.messages || []).filter(m => Number(m.board_id) !== Number(boardId)),
          ...updatedMessages,
        ],
      };
      saveDb(newDb);
    },
    [db, saveDb]
  );

  const getUnreadCount = useCallback(
    boardId => {
      if (!username) return 0;
      const boardMessages = (db.messages || []).filter(m => Number(m.board_id) === Number(boardId));
      return boardMessages.filter(msg => !msg.read_by.includes(username) && msg.author !== username)
        .length;
    },
    [db.messages, username]
  );

  return {
    getMessages,
    addMessage,
    markMessagesAsRead,
    getUnreadCount,
  };
}

export default useMessages;
