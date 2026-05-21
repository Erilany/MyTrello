import React from 'react';
import {
  Plus,
  Trash2,
  Save,
  Download,
  RotateCcw,
  FolderOpen,
  Upload,
  FileText,
  List,
  CheckSquare,
  Folder,
  Layers,
} from 'lucide-react';
import { useLibraryTree } from '../../hooks/useLibraryTree';
import { TreeNode } from './TreeNode';

function LibraryEditor() {
  const {
    treeData,
    hasChanges,
    treeKey,
    draggedNode,
    dragOverNode,
    dropPosition,
    showXmlImportModal,
    setShowXmlImportModal,
    xmlItems,
    selectedXmlItems,
    handleXmlFileSelect,
    toggleXmlItem,
    selectAllXmlItems,
    deselectAllXmlItems,
    handleConfirmXmlImport,
    handleEdit,
    handleDelete,
    handleAddChild,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    handleAddRoot,
    handleSave,
    handleReset,
    expandAll,
    collapseAll,
    createCompleteChains,
    handleExport,
  } = useLibraryTree();

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <button
            onClick={createCompleteChains}
            className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded flex items-center gap-1"
            title="Crée automatiquement les catégories/sous-catégories manquantes pour compléter les chaînes"
          >
            <Layers size={14} />
            Créer chaînes complètes
          </button>
          <button
            onClick={expandAll}
            className="px-3 py-1.5 text-sm bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border)] rounded text-[var(--txt-secondary)]"
          >
            Tout déplier
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-1.5 text-sm bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border)] rounded text-[var(--txt-secondary)]"
          >
            Tout replier
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAddRoot}
            className="flex items-center px-3 py-1.5 text-sm bg-[var(--accent)] text-white rounded hover:opacity-90"
          >
            <Plus size={16} className="mr-1" /> Ajouter Chapitre
          </button>
          <button
            onClick={handleReset}
            className="p-2 text-[var(--txt-secondary)] hover:bg-[var(--bg-card-hover)] rounded"
            title="Réinitialiser"
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={handleExport}
            className="flex items-center px-3 py-1.5 text-sm bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border)] rounded text-[var(--txt-secondary)]"
          >
            <Download size={16} className="mr-1" /> Exporter
          </button>
          <label className="flex items-center px-3 py-1.5 text-sm bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border)] rounded text-[var(--txt-secondary)] cursor-pointer">
            <Upload size={16} className="mr-1" /> Importer XML
            <input type="file" accept=".xml" className="hidden" onChange={handleXmlFileSelect} />
          </label>
          <button
            onClick={handleSave}
            className={`flex items-center px-3 py-1.5 text-sm rounded ${hasChanges ? 'bg-[var(--accent)] text-white hover:opacity-90' : 'bg-[var(--border)] text-[var(--txt-muted)] cursor-not-allowed'}`}
            disabled={!hasChanges}
          >
            <Save size={16} className="mr-1" /> Enregistrer
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-2 text-xs font-medium text-[var(--txt-secondary)] pb-2 border-b border-[var(--border)]">
        <span className="w-[100px]">Type</span>
        <span className="flex-1">Titre</span>
        <span className="flex-[2]">Tâche</span>
        <span className="w-20 text-center">Temps repères</span>
        <span className="w-32 text-[var(--txt-muted)]">Tag Revue d&apos;activité</span>
        <span className="w-16"></span>
      </div>

      <div
        className="flex-1 overflow-auto"
        key={treeKey}
        style={{ maxHeight: 'calc(100vh - 280px)' }}
      >
        {treeData.map((node, idx) => (
          <TreeNode
            key={node.id + idx}
            node={node}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAddChild={handleAddChild}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
            onDragLeave={handleDragLeave}
            draggedNode={draggedNode}
            dragOverNode={dragOverNode}
            dropPosition={dropPosition}
          />
        ))}
      </div>

      {treeData.length === 0 && (
        <div className="text-center py-8 text-[var(--txt-muted)]">
          <FolderOpen size={48} className="mx-auto mb-4 opacity-50" />
          <p>Aucune donnée. Cliquez sur &quot;Ajouter Chapitre&quot; pour commencer.</p>
        </div>
      )}

      {showXmlImportModal && xmlItems.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--bg-card)] rounded-lg shadow-xl w-full max-w-4xl border border-[var(--border)] p-6 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[var(--txt-primary)]">
                Import XML MS Project - Sélection des éléments
              </h3>
              <button
                onClick={() => setShowXmlImportModal(false)}
                className="p-1 hover:bg-[var(--bg-card-hover)] rounded"
              >
                <Trash2 size={20} className="text-[var(--txt-muted)]" />
              </button>
            </div>

            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-[var(--txt-secondary)]">
                {selectedXmlItems.length} / {xmlItems.length} élément(s) sélectionné(s)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={selectAllXmlItems}
                  className="px-3 py-1 text-xs bg-[var(--bg-card-hover)] hover:bg-[var(--border)] rounded"
                >
                  Tout sélectionner
                </button>
                <button
                  onClick={deselectAllXmlItems}
                  className="px-3 py-1 text-xs bg-[var(--bg-card-hover)] hover:bg-[var(--border)] rounded"
                >
                  Tout désélectionner
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto border border-[var(--border)] rounded-lg mb-4">
              <table className="w-full text-sm">
                <thead className="bg-[var(--bg-card-hover)] sticky top-0">
                  <tr>
                    <th className="w-12 p-2 text-left"></th>
                    <th className="p-2 text-left text-[var(--txt-secondary)]">Niveau</th>
                    <th className="p-2 text-left text-[var(--txt-secondary)]">Nom</th>
                    <th className="w-24 p-2 text-right text-[var(--txt-secondary)]">Durée (j)</th>
                  </tr>
                </thead>
                <tbody>
                  {xmlItems.map(item => {
                    const LevelIcon =
                      item.outlineLevel === 1
                        ? Folder
                        : item.outlineLevel === 2
                          ? FileText
                          : item.outlineLevel === 3
                            ? List
                            : CheckSquare;
                    const levelLabel =
                      item.outlineLevel === 1
                        ? 'Chapitre'
                        : item.outlineLevel === 2
                          ? 'Carte'
                          : item.outlineLevel === 3
                            ? 'Catégorie'
                            : 'Tâche';
                    return (
                      <tr
                        key={item.id}
                        className={`border-b border-[var(--border)] hover:bg-[var(--bg-card-hover)] ${
                          selectedXmlItems.includes(item.id) ? 'bg-[var(--accent)]/10' : ''
                        }`}
                      >
                        <td className="p-2">
                          <input
                            type="checkbox"
                            checked={selectedXmlItems.includes(item.id)}
                            onChange={() => toggleXmlItem(item.id)}
                            className="w-4 h-4 accent-[var(--accent)]"
                          />
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <LevelIcon size={16} className="text-[var(--txt-muted)]" />
                            <span style={{ marginLeft: `${(item.outlineLevel - 1) * 16}px` }}>
                              {levelLabel}
                            </span>
                          </div>
                        </td>
                        <td
                          className="p-2 text-[var(--txt-primary)]"
                          style={{ paddingLeft: `${item.outlineLevel * 16 + 8}px` }}
                        >
                          {item.name}
                        </td>
                        <td className="p-2 text-right text-[var(--txt-secondary)]">
                          {item.duration > 0 ? `${item.duration}j` : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowXmlImportModal(false)}
                className="px-4 py-2 text-[var(--txt-secondary)] hover:bg-[var(--bg-card-hover)] rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmXmlImport}
                className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:opacity-90"
              >
                Importer la sélection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LibraryEditor;
