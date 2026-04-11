import { parseMsgFile, isValidMsgFile } from '../../utils/msgParser';

export const addWorkingDays = (startDateStr, days) => {
  if (!startDateStr || days < 0) return '';
  if (days === 0) return startDateStr;
  const date = new Date(startDateStr);
  let daysAdded = 0;
  while (daysAdded < days) {
    date.setDate(date.getDate() + 1);
    const dayOfWeek = date.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      daysAdded++;
    }
  }
  return date.toISOString().split('T')[0];
};

export const subtractWorkingDays = (endDateStr, days) => {
  if (!endDateStr || days < 0) return '';
  if (days === 0) return endDateStr;
  const date = new Date(endDateStr);
  let daysSubtracted = 0;
  while (daysSubtracted < days) {
    date.setDate(date.getDate() - 1);
    const dayOfWeek = date.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      daysSubtracted++;
    }
  }
  return date.toISOString().split('T')[0];
};

export const sortEmails = (emailsToSort, sortMode) => {
  if (sortMode === 'date') {
    return [...emailsToSort].sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  if (sortMode === 'object-date') {
    const objectMaxDates = {};
    emailsToSort.forEach(email => {
      const date = new Date(email.date);
      if (!objectMaxDates[email.subject] || date > objectMaxDates[email.subject]) {
        objectMaxDates[email.subject] = date;
      }
    });

    const sortedSubjects = Object.keys(objectMaxDates).sort((a, b) => {
      const dateDiff = objectMaxDates[b] - objectMaxDates[a];
      if (dateDiff !== 0) return dateDiff;
      return a.localeCompare(b);
    });

    const sorted = [];
    sortedSubjects.forEach(subject => {
      const subjectEmails = emailsToSort
        .filter(e => e.subject === subject)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      sorted.push(...subjectEmails);
    });

    return sorted;
  }

  return emailsToSort;
};

export const handleDrop = async (files, subcategoryId, addEmailToSubcategory) => {
  const msgFiles = files.filter(f => isValidMsgFile(f));

  if (msgFiles.length === 0) {
    alert('Seuls les fichiers .msg sont acceptés');
    return [];
  }

  const newEmails = [];

  for (const file of msgFiles) {
    try {
      const metadata = await parseMsgFile(file);

      const reader = new FileReader();
      const emailData = await new Promise((resolve, reject) => {
        reader.onload = event => {
          const base64Data = event.target.result;
          resolve({
            date: metadata.date,
            subject: metadata.subject,
            filepath: base64Data,
            filename: metadata.filename,
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const emailId = addEmailToSubcategory(subcategoryId, emailData);
      newEmails.push({
        id: emailId,
        subcategory_id: subcategoryId,
        ...emailData,
      });
    } catch (error) {
      console.error('Error processing MSG file:', error);
      alert('Erreur lors du traitement du fichier');
    }
  }

  return newEmails;
};

export const handleOpenEmail = async email => {
  const fileData = email.filepath;
  if (!fileData) {
    console.error('[handleOpenEmail] No filepath in email:', email);
    alert('Fichier email non disponible');
    return;
  }

  console.log('[handleOpenEmail] Opening email:', email.filename);

  try {
    const base64Response = fileData.includes(',') ? fileData.split(',')[1] : fileData;
    const binaryString = atob(base64Response);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const blob = new Blob([bytes], { type: 'application/vnd.ms-outlook' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = email.filename || 'email.msg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => URL.revokeObjectURL(url), 60000);

    console.log('[handleOpenEmail] File downloaded:', email.filename);
  } catch (error) {
    console.error('[handleOpenEmail] Error:', error);
    alert("Erreur lors de l'ouverture du fichier: " + error.message);
  }
};

export const sortMilestones = ms => {
  const withoutDate = ms.filter(m => !m.date).sort((a, b) => (a.position || 0) - (b.position || 0));
  const withDate = ms.filter(m => m.date).sort((a, b) => new Date(a.date) - new Date(b.date));
  return [...withoutDate, ...withDate];
};

export const createMilestone = (title, date, position) => ({
  id: Date.now(),
  title: title.trim(),
  done: false,
  date: date || null,
  position,
});

export const getMaxPositionWithoutDate = milestones => {
  return milestones.filter(m => !m.date).reduce((max, m) => Math.max(max, m.position || 0), 0);
};

export const priorities = [
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'Haute' },
  { value: 'normal', label: 'Normale' },
  { value: 'low', label: 'Basse' },
];

export const statuses = [
  { value: 'todo', label: 'À faire' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'waiting', label: 'En attente' },
  { value: 'done', label: 'Terminé' },
];

export const getStatusBadgeClass = s => {
  switch (s) {
    case 'done':
      return 'bg-green-100 text-green-700 border-green-300';
    case 'in_progress':
      return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    case 'waiting':
      return 'bg-blue-100 text-blue-700 border-blue-300';
    default:
      return 'bg-orange-100 text-orange-700 border-orange-300';
  }
};

export const quillModules = {
  toolbar: [['bold', 'underline'], [{ color: ['#000000', '#ef4444', '#3b82f6', '#22c55e'] }]],
};

export const quillFormats = ['bold', 'underline', 'color'];
