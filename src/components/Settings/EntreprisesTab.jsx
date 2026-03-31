import React, { useState, useEffect, useMemo } from 'react';
import { Search, Building, Trash2 } from 'lucide-react';

const STORAGE_KEY = 'c-projets_entreprises';

function EntreprisesTab() {
  const [entreprises, setEntreprises] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadEntreprises();
  }, []);

  const loadEntreprises = () => {
    const allContacts = [];

    const savedDb = localStorage.getItem('c-projets_db');
    if (savedDb) {
      const db = JSON.parse(savedDb);
      if (db.boards && Array.isArray(db.boards)) {
        db.boards.forEach(board => {
          const boardContacts = localStorage.getItem(`board-${board.id}-externalContacts`);
          if (boardContacts) {
            try {
              const contacts = JSON.parse(boardContacts);
              if (Array.isArray(contacts)) {
                contacts.forEach(contact => {
                  allContacts.push({
                    ...contact,
                    boardId: board.id,
                    boardName: board.title,
                  });
                });
              }
            } catch (e) {
              console.error('Error parsing board contacts:', e);
            }
          }
        });
      }
    }

    const deduplicated = deduplicateEntreprises(allContacts);
    setEntreprises(deduplicated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(deduplicated));
  };

  const deduplicateEntreprises = contacts => {
    const seen = new Map();

    contacts.forEach(contact => {
      if (!contact.entreprise || !contact.nom) return;

      const key = `${(contact.entreprise || '').toLowerCase().trim()}-${(contact.nom || '').toLowerCase().trim()}-${(contact.prenom || '').toLowerCase().trim()}`;

      if (!seen.has(key)) {
        seen.set(key, contact);
      }
    });

    return Array.from(seen.values()).sort((a, b) => {
      const nameA = `${a.entreprise || ''} ${a.nom || ''}`.toLowerCase();
      const nameB = `${b.entreprise || ''} ${b.nom || ''}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });
  };

  const filteredEntreprises = useMemo(() => {
    if (!searchQuery.trim()) return entreprises;

    const query = searchQuery.toLowerCase();
    return entreprises.filter(
      ent =>
        (ent.entreprise || '').toLowerCase().includes(query) ||
        (ent.nom || '').toLowerCase().includes(query) ||
        (ent.prenom || '').toLowerCase().includes(query) ||
        (ent.fonction || '').toLowerCase().includes(query) ||
        (ent.email || '').toLowerCase().includes(query)
    );
  }, [entreprises, searchQuery]);

  const handleDelete = id => {
    const updated = entreprises.filter(e => e.id !== id);
    setEntreprises(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const columns = [
    { key: 'entreprise', label: 'Entreprise' },
    { key: 'fonction', label: 'Fonction' },
    { key: 'nom', label: 'Nom' },
    { key: 'prenom', label: 'Prénom' },
    { key: 'email', label: 'Email' },
    { key: 'telBureau', label: 'Tél. Bureau' },
    { key: 'telPortable', label: 'Portable' },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Building size={24} className="text-accent" />
        <h2 className="text-xl font-semibold text-primary">Annuaire Entreprises</h2>
      </div>

      <div className="mb-4 flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted"
          />
          <input
            type="text"
            placeholder="Rechercher une entreprise..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-input border border-std rounded-lg text-primary placeholder-muted focus:outline-none focus:border-accent"
          />
        </div>
        <span className="text-sm text-muted">
          {filteredEntreprises.length} / {entreprises.length} entreprises
        </span>
      </div>

      <div className="bg-card rounded-lg border border-std overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-std bg-card-hover">
                {columns.map(col => (
                  <th key={col.key} className="text-left py-3 px-4 text-muted font-medium">
                    {col.label}
                  </th>
                ))}
                <th className="text-left py-3 px-4 text-muted font-medium w-16"></th>
              </tr>
            </thead>
            <tbody>
              {filteredEntreprises.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="py-8 text-center text-muted">
                    {searchQuery
                      ? 'Aucun résultat pour cette recherche'
                      : 'Aucune entreprise trouvée'}
                  </td>
                </tr>
              ) : (
                filteredEntreprises.map((entreprise, idx) => (
                  <tr
                    key={entreprise.id || idx}
                    className="border-b border-std hover:bg-card-hover"
                  >
                    <td className="py-3 px-4 text-primary font-medium">
                      {entreprise.entreprise || '-'}
                    </td>
                    <td className="py-3 px-4 text-secondary">{entreprise.fonction || '-'}</td>
                    <td className="py-3 px-4 text-primary">{entreprise.nom || '-'}</td>
                    <td className="py-3 px-4 text-primary">{entreprise.prenom || '-'}</td>
                    <td className="py-3 px-4 text-accent">{entreprise.email || '-'}</td>
                    <td className="py-3 px-4 text-secondary">{entreprise.telBureau || '-'}</td>
                    <td className="py-3 px-4 text-secondary">{entreprise.telPortable || '-'}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleDelete(entreprise.id)}
                        className="text-muted hover:text-urgent"
                        title="Supprimer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default EntreprisesTab;
