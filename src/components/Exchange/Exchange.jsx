import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Send, Paperclip, X, File, Image, FileText } from 'lucide-react';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function getFileIcon(type) {
  if (type.startsWith('image/')) return <Image size={16} className="text-blue-400" />;
  if (type.includes('pdf')) return <FileText size={16} className="text-red-400" />;
  return <File size={16} className="text-muted" />;
}

function formatTime(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Aujourd'hui";
  if (date.toDateString() === yesterday.toDateString()) return 'Hier';
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function Exchange({ boardId }) {
  const { getMessages, addMessage, markMessagesAsRead, currentUsername } = useApp();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (boardId) {
      const msgs = getMessages(boardId);
      setMessages(msgs);
      markMessagesAsRead(boardId);
    }
  }, [boardId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (boardId) {
        setMessages(getMessages(boardId));
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [boardId]);

  const handleFileSelect = e => {
    const files = Array.from(e.target.files);
    processFiles(files);
    e.target.value = '';
  };

  const processFiles = files => {
    const validFiles = files.filter(file => {
      if (file.size > MAX_FILE_SIZE) {
        alert(`Le fichier ${file.name} dépasse la limite de 10MB`);
        return false;
      }
      return true;
    });

    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachments(prev => [
          ...prev,
          {
            name: file.name,
            type: file.type,
            size: file.size,
            data: reader.result,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = index => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = () => {
    if (!inputValue.trim() && attachments.length === 0) return;
    if (!currentUsername) {
      alert('Veuillez entrer votre nom dans les paramètres');
      return;
    }

    addMessage(boardId, inputValue.trim(), attachments);
    setInputValue('');
    setAttachments([]);
    setMessages(getMessages(boardId));
  };

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDrop = e => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const handleDragOver = e => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const renderAttachments = attachments => {
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {attachments.map((att, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2 px-3 py-2 bg-card-hover rounded-lg border border-std"
          >
            {getFileIcon(att.type)}
            <span className="text-xs text-primary max-w-[150px] truncate">{att.name}</span>
            <span className="text-xs text-muted">{Math.round(att.size / 1024)}KB</span>
          </div>
        ))}
      </div>
    );
  };

  const renderContent = content => {
    const parts = content.split(/(@\w+)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('@')) {
        const isMentioned = part.slice(1).toLowerCase() === currentUsername?.toLowerCase();
        return (
          <span
            key={idx}
            className={
              isMentioned ? 'font-bold text-accent bg-accent/20 px-1 rounded' : 'text-blue-400'
            }
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const groupedMessages = messages.reduce((groups, msg) => {
    const date = new Date(msg.created_at).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(msg);
    return groups;
  }, {});

  if (!currentUsername) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center bg-card p-6 rounded-lg border border-std max-w-md">
          <h3 className="text-lg font-semibold text-primary mb-2">Bienvenue dans les Échanges</h3>
          <p className="text-secondary mb-4">
            Veuillez configurer votre profil pour commencer à discuter.
          </p>
          <p className="text-sm text-muted">Allez dans Paramètres pour entrer votre nom.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 flex flex-col min-h-0"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {isDragging && (
        <div className="absolute inset-0 bg-accent/20 border-2 border-dashed border-accent z-50 flex items-center justify-center">
          <span className="text-lg font-semibold text-accent">Déposez vos fichiers ici</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="text-center text-muted py-8">
            <p>Aucun message pour ce projet.</p>
            <p className="text-sm mt-2">Soyez le premier à envoyer un message !</p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date}>
              <div className="flex items-center justify-center my-4">
                <span className="px-3 py-1 bg-card-hover text-xs text-muted rounded-full border border-std">
                  {formatDate(msgs[0].created_at)}
                </span>
              </div>
              {msgs.map((msg, idx) => {
                const isOwn = msg.author === currentUsername;
                const showAvatar = idx === 0 || msgs[idx - 1].author !== msg.author;
                return (
                  <div
                    key={msg.id}
                    className={`flex mb-3 ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isOwn && showAvatar && (
                      <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white text-sm font-bold mr-2 flex-shrink-0">
                        {msg.author.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {!isOwn && !showAvatar && <div className="w-8 mr-2" />}
                    <div
                      className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}
                      style={{ display: 'flex', flexDirection: 'column' }}
                    >
                      {showAvatar && !isOwn && (
                        <span className="text-xs text-muted mb-1 ml-1">{msg.author}</span>
                      )}
                      <div
                        className={`px-4 py-2 rounded-2xl ${
                          isOwn
                            ? 'bg-accent text-white rounded-br-md'
                            : 'bg-card border border-std text-primary rounded-bl-md'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{renderContent(msg.content)}</p>
                        {msg.attachments &&
                          msg.attachments.length > 0 &&
                          renderAttachments(msg.attachments)}
                      </div>
                      <span className="text-xs text-muted mt-1 mx-1">
                        {formatTime(msg.created_at)}
                      </span>
                    </div>
                    {isOwn && showAvatar && (
                      <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-bold ml-2 flex-shrink-0">
                        {msg.author.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {isOwn && !showAvatar && <div className="w-8 ml-2" />}
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-std p-4 bg-card">
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {attachments.map((att, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 px-3 py-2 bg-card-hover rounded-lg border border-std"
              >
                {getFileIcon(att.type)}
                <span className="text-xs text-primary max-w-[120px] truncate">{att.name}</span>
                <button
                  onClick={() => removeAttachment(idx)}
                  className="text-muted hover:text-urgent"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-end gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-muted hover:text-primary hover:bg-card-hover rounded-lg transition-std"
            title="Joindre un fichier"
          >
            <Paperclip size={20} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
          <textarea
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tapez votre message... (Utilisez @ pour mentionner)"
            className="flex-1 px-4 py-2 bg-input border border-std rounded-lg text-primary placeholder-muted focus:outline-none focus:border-accent resize-none"
            rows={1}
            style={{ minHeight: '42px', maxHeight: '120px' }}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() && attachments.length === 0}
            className="p-2 bg-accent text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-std"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Exchange;
