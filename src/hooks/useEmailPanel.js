import { useState, useEffect } from 'react';
import { handleDrop } from '../components/SubCategory/subCategoryUtils';

export function useEmailPanel(subcategoryId, addEmailToSubcategory, removeEmailFromSubcategory, updateEmailSubject, getEmailsForSubcategory) {
  const [emailPanelOpen, setEmailPanelOpen] = useState(false);
  const [emails, setEmails] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [editingEmailId, setEditingEmailId] = useState(null);
  const [editingSubject, setEditingSubject] = useState('');
  const [sortMode, setSortMode] = useState('date');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  useEffect(() => {
    const loadedEmails = getEmailsForSubcategory(subcategoryId);
    setEmails(loadedEmails);
  }, [subcategoryId]);

  const handleDragOver = e => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = e => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const onDrop = async e => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    const newEmails = await handleDrop(files, subcategoryId, addEmailToSubcategory);
    setEmails(prev => [...prev, ...newEmails]);
  };

  const handleDeleteEmail = emailId => {
    if (window.confirm('Supprimer cet email ?')) {
      removeEmailFromSubcategory(emailId);
      setEmails(prev => prev.filter(e => e.id !== emailId));
    }
  };

  const handleStartEditSubject = email => {
    setEditingEmailId(email.id);
    setEditingSubject(email.customSubject || email.subject);
  };

  const handleSaveSubject = emailId => {
    updateEmailSubject(emailId, editingSubject);
    setEmails(prev => prev.map(e => (e.id === emailId ? { ...e, subject: editingSubject } : e)));
    setEditingEmailId(null);
    setEditingSubject('');
  };

  return {
    emailPanelOpen,
    setEmailPanelOpen,
    emails,
    setEmails,
    isDragOver,
    editingEmailId,
    editingSubject,
    setEditingSubject,
    sortMode,
    setSortMode,
    sortDropdownOpen,
    setSortDropdownOpen,
    handleDragOver,
    handleDragLeave,
    onDrop,
    handleDeleteEmail,
    handleStartEditSubject,
    handleSaveSubject,
  };
}
