// Export localStorage - Ouvrez ce fichier dans la console du navigateur (F12 > Console)
// Copiez-collez le contenu dans la console

(function exportLocalStorage() {
  const data = {};
  const prefix = 'c-projets_';

  Object.keys(localStorage).forEach(key => {
    if (key.startsWith(prefix) || key.startsWith('board-')) {
      try {
        data[key] = JSON.parse(localStorage.getItem(key));
      } catch {
        data[key] = localStorage.getItem(key);
      }
    }
  });

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `c-projets-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);

  console.log('✅ Export créé! Fichier téléchargé.');
  console.log('Total clés exportées:', Object.keys(data).length);
})();
