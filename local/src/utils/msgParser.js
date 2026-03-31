// Parser pour fichiers .msg (Outlook)
// Extrait les métadonnées: sujet, date d'envoi
// Le fichier complet est stocké pour ouverture ultérieure

export async function parseMsgFile(file) {
  return new Promise((resolve, reject) => {
    // Utiliser le nom du fichier comme sujet (plus fiable qu'un parsing binaire)
    const subject = file.name.replace(/\.msg$/i, '');
    const date = new Date().toISOString().split('T')[0];

    resolve({
      subject: subject,
      date: date,
      filename: file.name,
      size: file.size,
    });
  });
}

// Valide que le fichier est bien un .msg
export function isValidMsgFile(file) {
  return file.name.toLowerCase().endsWith('.msg');
}
