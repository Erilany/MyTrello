// Clear IndexedDB and localStorage - Run in browser console (F12)
(async () => {
  // Clear IndexedDB
  const req = indexedDB.deleteDatabase('c-projets-db');
  req.onsuccess = () => console.log('✅ IndexedDB cleared');
  req.onerror = () => console.log('❌ IndexedDB error');

  // Clear localStorage
  localStorage.clear();
  console.log('✅ localStorage cleared');

  console.log('🔄 Please refresh the page');
})();
