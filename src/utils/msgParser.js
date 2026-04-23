// Parser pour fichiers .msg (Outlook)
// Extrait les métadonnées: sujet, date d'envoi
// Le fichier complet est stocké pour ouverture ultérieure

export async function parseMsgFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = event => {
      try {
        const buffer = event.target.result;
        const view = new DataView(buffer);

        // Chercher la date d'envoi dans le fichier MSG (format OLE2)
        // PidTagSentRepresentingTime (0x0042) ou PidTagClientSubmitTime (0x0039)
        let emailDate = null;

        // Recherche du pattern de date OLE2 dans le buffer
        // Format FILETIME: 8 bytes (little-endian, 100-nanosecond intervals since 1601)
        const buffer8 = new Uint8Array(buffer);
        for (let i = 0; i < buffer8.length - 8; i++) {
          // Chercher le magic number pour FILETIME (0x00 0x00 0x00 0x00 0x00 0x00 0x00 0x00 à 0xD0 0xC1 0x00 0x00 environ)
          const low = view.getUint32(i, true);
          const high = view.getUint32(i + 4, true);

          // FILETIME valide: doit être après 1990 et avant 2100
          if (low > 0 && high > 0 && high < 1500000) {
            try {
              const filetime = BigInt(low) + (BigInt(high) << 32n);
              const windowsTicks = filetime - 116444736000000000n;
              const unixMs = windowsTicks / 10000n;
              const date = new Date(Number(unixMs));

              if (date.getFullYear() >= 1990 && date.getFullYear() <= 2100) {
                emailDate = date;
                break;
              }
            } catch (e) {
              // Continue searching
            }
          }
        }

        // Fallback: extraire la date du nom de fichier si pattern non trouvé
        if (!emailDate) {
          // Essayer d'extraire date du format YYYY-MM-DD du nom de fichier
          const dateMatch = file.name.match(/(\d{4})[_-](\d{2})[_-](\d{2})/);
          if (dateMatch) {
            emailDate = new Date(`${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`);
          }
        }

        // Fallback final: date actuelle
        if (!emailDate || isNaN(emailDate.getTime())) {
          emailDate = new Date();
        }

        resolve({
          subject: file.name.replace(/\.msg$/i, ''),
          date: emailDate.toISOString().split('T')[0],
          filename: file.name,
          size: file.size,
        });
      } catch (error) {
        console.error('[msgParser] Error parsing MSG file:', error);
        // Fallback en cas d'erreur
        resolve({
          subject: file.name.replace(/\.msg$/i, ''),
          date: new Date().toISOString().split('T')[0],
          filename: file.name,
          size: file.size,
        });
      }
    };
    reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
    reader.readAsArrayBuffer(file);
  });
}

// Valide que le fichier est bien un .msg
export function isValidMsgFile(file) {
  return file.name.toLowerCase().endsWith('.msg');
}
