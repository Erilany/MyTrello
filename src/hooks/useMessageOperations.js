import { useCallback } from 'react';

export function useMessageOperations(db, saveDb, username, setMessages, unreadMentions, setUnreadMentions) {
  const getMessages = useCallback(
    boardId => {
      return (db.messages || []).filter(m => Number(m.board_id) === Number(boardId));
    },
    [db.messages]
  );

  const addMessage = useCallback(
    (boardId, content, attachments = []) => {
      const mentions = content.match(/@(\w+)/g)?.map(m => m.slice(1)) || [];
      const newMessage = {
        id: db.nextIds.message++,
        board_id: boardId,
        author: username,
        content,
        mentions,
        attachments: attachments.map(att => ({
          name: att.name,
          type: att.type,
          data: att.data,
          size: att.size,
        })),
        created_at: new Date().toISOString(),
        read_by: [username],
      };
      const newDb = {
        ...db,
        messages: [...(db.messages || []), newMessage],
      };
      saveDb(newDb);
      setMessages(newDb.messages);

      if (mentions.length > 0) {
        const newUnread = { ...unreadMentions };
        mentions.forEach(user => {
          if (user !== username) {
            if (!newUnread[user]) newUnread[user] = [];
            newUnread[user].push(newMessage.id);
          }
        });
        setUnreadMentions(newUnread);
      }
      return newMessage;
    },
    [db, username, saveDb, setMessages, unreadMentions, setUnreadMentions]
  );

  const markMessagesAsRead = useCallback(
    boardId => {
      const boardMessages = (db.messages || []).filter(m => Number(m.board_id) === Number(boardId));
      const updatedMessages = boardMessages.map(msg => {
        if (!msg.read_by.includes(username)) {
          return { ...msg, read_by: [...msg.read_by, username] };
        }
        return msg;
      });

      const newDb = {
        ...db,
        messages: (db.messages || []).map(msg => {
          const updated = updatedMessages.find(u => u.id === msg.id);
          return updated || msg;
        }),
      };
      saveDb(newDb);
      setMessages(newDb.messages);

      if (unreadMentions[username]) {
        const newUnread = { ...unreadMentions };
        delete newUnread[username];
        setUnreadMentions(newUnread);
      }
    },
    [db, username, saveDb, setMessages, unreadMentions, setUnreadMentions]
  );

  const getUnreadCount = useCallback(
    boardId => {
      if (!username) return 0;
      const boardMessages = (db.messages || []).filter(m => Number(m.board_id) === Number(boardId));
      return boardMessages.filter(
        msg => !msg.read_by.includes(username) && msg.author !== username
      ).length;
    },
    [db.messages, username]
  );

  return { getMessages, addMessage, markMessagesAsRead, getUnreadCount };
}
