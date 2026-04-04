import { useCallback } from 'react';

export function useSubcategoryEmails(db, saveDb) {
  const addEmailToSubcategory = useCallback(
    (subcategoryId, emailData) => {
      const emailId = db.nextIds.email++;
      const newEmail = {
        id: emailId,
        subcategory_id: Number(subcategoryId),
        date: emailData.date,
        subject: emailData.subject,
        filepath: emailData.filepath,
        filename: emailData.filename,
        created_at: new Date().toISOString(),
      };
      const newDb = {
        ...db,
        subcategoryEmails: [...(db.subcategoryEmails || []), newEmail],
        nextIds: { ...db.nextIds },
      };
      saveDb(newDb);
      return emailId;
    },
    [db, saveDb]
  );

  const removeEmailFromSubcategory = useCallback(
    emailId => {
      const email = db.subcategoryEmails?.find(e => Number(e.id) === Number(emailId));
      if (email && email.filepath) {
        localStorage.removeItem(`c-projets_email_${emailId}`);
      }
      const newDb = {
        ...db,
        subcategoryEmails: (db.subcategoryEmails || []).filter(
          e => Number(e.id) !== Number(emailId)
        ),
      };
      saveDb(newDb);
    },
    [db, saveDb]
  );

  const updateEmailSubject = useCallback(
    (emailId, newSubject) => {
      const newDb = {
        ...db,
        subcategoryEmails: (db.subcategoryEmails || []).map(e =>
          Number(e.id) === Number(emailId) ? { ...e, subject: newSubject } : e
        ),
      };
      saveDb(newDb);
    },
    [db, saveDb]
  );

  const getEmailsForSubcategory = useCallback(
    subcategoryId => {
      return (db.subcategoryEmails || []).filter(
        e => Number(e.subcategory_id) === Number(subcategoryId)
      );
    },
    [db.subcategoryEmails]
  );

  const saveEmailFile = useCallback((emailId, fileData) => {
    localStorage.setItem(`c-projets_email_${emailId}`, JSON.stringify(fileData));
  }, []);

  const getEmailFile = useCallback(emailId => {
    const stored = localStorage.getItem(`c-projets_email_${emailId}`);
    return stored ? JSON.parse(stored) : null;
  }, []);

  return {
    addEmailToSubcategory,
    removeEmailFromSubcategory,
    updateEmailSubject,
    getEmailsForSubcategory,
    saveEmailFile,
    getEmailFile,
  };
}

export default useSubcategoryEmails;
