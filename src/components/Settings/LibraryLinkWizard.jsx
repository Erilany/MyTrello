import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle, Link, ChevronDown } from 'lucide-react';

function SearchableSelect({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase()) ||
    (o.systemTag && o.systemTag.toLowerCase().includes(search.toLowerCase()))
  );

  const selected = options.find(o => o.value === value);

  return (
    <div ref={ref} className="relative flex-1">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full px-2 py-1 bg-[var(--bg-input)] border border-[var(--border)] rounded text-[var(--txt-primary)] text-xs text-left flex items-center justify-between gap-1"
      >
        <span className="truncate">
          {selected
            ? selected.label + (selected.systemTag ? ` [${selected.systemTag}]` : '')
            : '— Ne pas lier —'}
        </span>
        <ChevronDown size={12} className="shrink-0 opacity-50" />
      </button>
      {open && (
        <div className="absolute z-[9999] top-full left-0 mt-1 bg-[var(--bg-card)] border border-[var(--border)] rounded shadow-xl"
          style={{ minWidth: '320px', maxWidth: '480px' }}>
          <div className="p-1.5 border-b border-[var(--border)]">
            <input
              autoFocus
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher…"
              className="w-full px-2 py-1 text-xs bg-[var(--bg-input)] border border-[var(--border)] rounded text-[var(--txt-primary)] outline-none"
            />
          </div>
          <div className="max-h-52 overflow-auto">
            <div
              className="px-2 py-1.5 text-xs text-[var(--txt-muted)] cursor-pointer hover:bg-[var(--bg-card-hover)]"
              onClick={() => { onChange(''); setOpen(false); setSearch(''); }}
            >
              — Ne pas lier —
            </div>
            {filtered.map(o => (
              <div
                key={o.value}
                onClick={() => { onChange(o.value); setOpen(false); setSearch(''); }}
                className={`px-2 py-1.5 text-xs cursor-pointer hover:bg-[var(--bg-card-hover)] ${o.value === value ? 'text-blue-400 font-medium' : 'text-[var(--txt-primary)]'}`}
              >
                {o.label}{o.systemTag ? <span className="text-[var(--txt-muted)]"> [{o.systemTag}]</span> : ''}
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="px-2 py-2 text-xs text-[var(--txt-muted)] italic">Aucun résultat</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function LibraryLinkWizard({ onClose, onApplied }) {
  const [groups, setGroups] = useState([]);
  const [librarySubs, setLibrarySubs] = useState([]);
  const [selections, setSelections] = useState({});
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(null);

  useEffect(() => {
    const dbRaw = localStorage.getItem('c-projets_db');
    if (!dbRaw) return;
    const db = JSON.parse(dbRaw);

    // Build lookup tables for board traversal
    const boardById = {};
    (db.boards || []).forEach(b => { boardById[String(b.id)] = b.title || `Projet ${b.id}`; });
    const boardByColumn = {};
    (db.columns || []).forEach(c => { boardByColumn[String(c.id)] = String(c.board_id); });
    const cardById = {};
    (db.cards || []).forEach(c => { cardById[String(c.id)] = c; });
    const columnByCard = {};
    (db.cards || []).forEach(c => { columnByCard[String(c.id)] = String(c.column_id); });
    const categoryById = {};
    (db.categories || []).forEach(c => { categoryById[String(c.id)] = c; });
    const cardByCategory = {};
    (db.categories || []).forEach(c => { cardByCategory[String(c.id)] = String(c.card_id); });

    // Group unlinked subcategories by title, collecting full paths
    const groupMap = {};
    (db.subcategories || []).forEach(sub => {
      if (sub.library_item_id) return;
      if (!sub.title) return;
      const cat = categoryById[String(sub.category_id)];
      const cardId = cardByCategory[String(sub.category_id)];
      const card = cardById[cardId];
      const colId = columnByCard[cardId];
      const boardId = boardByColumn[colId];
      const boardTitle = boardById[boardId] || '?';
      const cardTitle = card?.title || '?';
      const catTitle = cat?.title || '';
      // Build readable path: Projet › Carte › Catégorie
      const path = [boardTitle, cardTitle, catTitle].filter(Boolean).join(' › ');

      if (!groupMap[sub.title]) {
        groupMap[sub.title] = { title: sub.title, ids: [], paths: [] };
      }
      groupMap[sub.title].ids.push(sub.id);
      // Only add unique paths to avoid duplicates
      if (!groupMap[sub.title].paths.includes(path)) {
        groupMap[sub.title].paths.push(path);
      }
    });

    setGroups(
      Object.values(groupMap)
        .map(g => ({ ...g }))
        .sort((a, b) => a.title.localeCompare(b.title))
    );

    // Load library subcategory options with full path context
    const treeRaw = localStorage.getItem('c-projets_library_editor');
    if (!treeRaw) return;
    const treeData = JSON.parse(treeRaw);
    const nodes = Array.isArray(treeData) ? treeData : treeData.children || [];
    const subs = [];

    const traverse = (node, ch = '', ca = '', cat = '') => {
      const curCh = node.type === 'chapitre' ? node.data?.chapitre || node.titre || '' : ch;
      const curCa = node.type === 'carte' ? node.data?.carte || node.titre || '' : ca;
      const curCat = node.type === 'categorie' ? node.data?.categorie || node.titre || '' : cat;
      if (node.type === 'souscategorie' && node.data?.sousCat1) {
        const parts = [curCh, curCa, curCat, node.data.sousCat1].filter(Boolean);
        subs.push({
          nodeId: String(node.id),
          title: node.data.sousCat1,
          label: parts.join(' › '),
          systemTag: node.data.systemTag?.trim() || '',
        });
      }
      (node.children || []).forEach(child => traverse(child, curCh, curCa, curCat));
    };
    nodes.forEach(n => traverse(n));
    setLibrarySubs(subs);

    // Pre-select: if a library sub has the exact same title, suggest it
    const initialSelections = {};
    Object.keys(groupMap).forEach(title => {
      const exact = subs.filter(s => s.title === title);
      if (exact.length === 1) initialSelections[title] = exact[0].nodeId;
    });
    setSelections(initialSelections);
  }, []);

  const applyLinks = () => {
    setApplying(true);
    const dbRaw = localStorage.getItem('c-projets_db');
    if (!dbRaw) { setApplying(false); return; }
    const db = JSON.parse(dbRaw);

    const tagByNodeId = {};
    librarySubs.forEach(s => { tagByNodeId[s.nodeId] = s.systemTag; });

    let count = 0;
    db.subcategories = db.subcategories.map(sub => {
      if (sub.library_item_id) return sub;
      const nodeId = selections[sub.title];
      if (!nodeId) return sub;
      count++;
      return { ...sub, library_item_id: nodeId, tag: tagByNodeId[nodeId] || sub.tag };
    });

    localStorage.setItem('c-projets_db', JSON.stringify(db));
    window.dispatchEvent(new Event('project-updated'));
    window.dispatchEvent(new Event('library-updated'));
    setApplied(count);
    setApplying(false);
    setTimeout(() => onApplied?.(), 800);
  };

  const selectedCount = Object.values(selections).filter(Boolean).length;
  const autoCount = Object.values(selections).filter(Boolean).length;

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-[var(--bg-card)] rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col border border-[var(--border)]">

        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-[var(--border)]">
          <div>
            <div className="flex items-center gap-2">
              <Link size={18} className="text-blue-400" />
              <h3 className="text-base font-semibold text-[var(--txt-primary)]">
                Liaison des tâches aux modèles bibliothèque
              </h3>
            </div>
            <p className="text-xs text-[var(--txt-muted)] mt-1">
              Les tâches non liées ne reçoivent pas les mises à jour de tags depuis la bibliothèque.
              Sélectionnez le modèle correspondant pour chaque titre — la liaison persiste même si le titre est modifié ensuite.
            </p>
          </div>
          <button onClick={onClose} className="icon-btn ml-4 shrink-0"><X size={16} /></button>
        </div>

        {/* Body */}
        {groups.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-[var(--txt-muted)] py-12">
            <CheckCircle size={36} className="text-green-500" />
            <span className="text-sm">Toutes les tâches sont déjà liées à la bibliothèque.</span>
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            <div className="p-4 bg-blue-500/10 border-b border-blue-500/20 text-xs text-blue-300">
              {autoCount > 0
                ? `${autoCount} correspondance(s) exacte(s) pré-sélectionnée(s) automatiquement — vérifiez et ajustez si besoin.`
                : 'Aucune correspondance automatique trouvée — sélectionnez manuellement le modèle pour chaque titre.'}
            </div>
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-[var(--bg-card-hover)]">
                <tr className="text-left text-[var(--txt-secondary)]">
                  <th className="px-3 py-2 font-medium">Titre dans le(s) projet(s)</th>
                  <th className="px-3 py-2 font-medium">Chemin dans les projets</th>
                  <th className="px-3 py-2 font-medium text-center">Nb</th>
                  <th className="px-3 py-2 font-medium">→ Modèle bibliothèque</th>
                </tr>
              </thead>
              <tbody>
                {groups.map(group => {
                  const sel = selections[group.title] || '';
                  const selSub = librarySubs.find(s => s.nodeId === sel);
                  const exactMatches = librarySubs.filter(s => s.title === group.title);
                  const isAutoMatch = exactMatches.length === 1 && sel === exactMatches[0]?.nodeId;
                  return (
                    <tr
                      key={group.title}
                      className="border-t border-[var(--border)] hover:bg-[var(--bg-card-hover)]"
                    >
                      <td className="px-3 py-2 text-[var(--txt-primary)] font-medium max-w-[200px]">
                        <div className="truncate" title={group.title}>{group.title}</div>
                      </td>
                      <td className="px-3 py-2 text-[var(--txt-muted)] w-[280px]">
                        <div className="flex flex-col gap-1">
                          {group.paths.slice(0, 3).map((p, i) => (
                            <div key={i} className="text-[10px] leading-snug break-words">{p}</div>
                          ))}
                          {group.paths.length > 3 && (
                            <div className="text-[10px] text-[var(--txt-muted)] italic">
                              +{group.paths.length - 3} autre(s)…
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center text-[var(--txt-muted)]">
                        {group.ids.length}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <SearchableSelect
                            value={sel}
                            onChange={v => setSelections(prev => ({ ...prev, [group.title]: v }))}
                            options={librarySubs.map(s => ({ value: s.nodeId, label: s.label, systemTag: s.systemTag }))}
                          />
                          {isAutoMatch && (
                            <span className="text-[10px] text-green-400 whitespace-nowrap">auto ✓</span>
                          )}
                          {sel && selSub?.systemTag && !isAutoMatch && (
                            <span
                              className="text-[10px] text-blue-400 whitespace-nowrap"
                              title={`Tag: ${selSub.systemTag}`}
                            >
                              [{selSub.systemTag}]
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        {groups.length > 0 && (
          <div className="p-4 border-t border-[var(--border)] flex justify-between items-center">
            <span className="text-xs text-[var(--txt-muted)]">
              {selectedCount} / {groups.length} liaison(s) sélectionnée(s)
              {applied !== null && (
                <span className="ml-3 text-green-400 font-medium">
                  ✓ {applied} tâche(s) liée(s) et synchronisées
                </span>
              )}
            </span>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-3 py-1.5 text-xs border border-[var(--border)] rounded text-[var(--txt-primary)] hover:bg-[var(--bg-card-hover)]"
              >
                Fermer
              </button>
              <button
                onClick={applyLinks}
                disabled={selectedCount === 0 || applying}
                className="px-4 py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {applying
                  ? 'Application en cours…'
                  : `Lier et synchroniser (${selectedCount})`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
