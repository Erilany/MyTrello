import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Check, RotateCcw } from 'lucide-react';

export function DataTable({
  title,
  data,
  onAdd,
  onUpdate,
  onDelete,
  columns = [{ key: 'label', label: 'Libellé' }],
  onReset,
  canReset = false,
  multiSelectOptions = {},
}) {
  const [items, setItems] = useState(data);
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [newValues, setNewValues] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setItems(data);
  }, [data]);

  const handleEdit = item => {
    setEditingId(item.id || item.code);
    setEditValues({
      ...item,
      functions: item.functions || [],
    });
    setError(null);
  };

  const handleSave = async () => {
    try {
      const updated = onUpdate(editingId, editValues);
      setItems(updated);
      setEditingId(null);
      setEditValues({});
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValues({});
    setError(null);
  };

  const handleAdd = async () => {
    try {
      const updated = onAdd(newValues);
      setItems(updated);
      setNewValues({});
      setShowAdd(false);
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDelete = async id => {
    if (!window.confirm('Voulez-vous vraiment supprimer cet élément ?')) return;
    try {
      const updated = onDelete(id);
      setItems(updated);
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleReset = () => {
    if (!window.confirm('Voulez-vous vraiment réinitialiser aux valeurs par défaut ?')) return;
    const reset = onReset();
    setItems(reset);
  };

  const toggleMultiSelectValue = (values, key, value) => {
    const currentValues = values[key] || [];
    if (currentValues.includes(value)) {
      return currentValues.filter(v => v !== value);
    } else {
      return [...currentValues, value];
    }
  };

  const renderCell = (col, item, values, setValues) => {
    if (col.isMultiSelect) {
      const options = multiSelectOptions[col.key] || [];
      const currentValues = values[col.key] || [];
      return (
        <div className="flex flex-wrap gap-1">
          {options.map(opt => {
            const isSelected = currentValues.includes(opt);
            const isEditing = editingId === (item.id || item.code);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  if (isEditing) {
                    setValues({
                      ...values,
                      [col.key]: toggleMultiSelectValue(values, col.key, opt),
                    });
                  }
                }}
                className={`px-2 py-0.5 text-xs rounded border ${
                  isSelected
                    ? 'bg-accent text-white border-accent'
                    : 'bg-card-hover text-secondary border-std hover:border-accent'
                } ${isEditing ? 'cursor-pointer' : 'cursor-default'}`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      );
    }

    if (col.isColor) {
      return (
        <div className="flex items-center gap-2">
          <span
            className="w-4 h-4 rounded border border-std"
            style={{ backgroundColor: item[col.key] }}
          />
          <span className="text-xs">{item[col.key]}</span>
        </div>
      );
    }

    return item[col.key];
  };

  return (
    <div className="bg-card rounded-lg border border-std p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-primary">{title}</h3>
        <div className="flex items-center gap-2">
          {canReset && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
              title="Réinitialiser"
            >
              <RotateCcw size={14} />
              Réinitialiser
            </button>
          )}
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-accent text-white rounded hover:opacity-90"
          >
            <Plus size={14} />
            Ajouter
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-std">
              {columns.map(col => (
                <th key={col.key} className="text-left py-2 px-3 text-muted font-medium">
                  {col.label}
                </th>
              ))}
              <th className="text-right py-2 px-3 text-muted font-medium w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {showAdd && (
              <tr key="add-row" className="bg-accent/10">
                {columns.map(col => (
                  <td key={col.key} className="py-2 px-3">
                    {col.isMultiSelect ? (
                      <div className="flex flex-wrap gap-1">
                        {(multiSelectOptions[col.key] || []).map(opt => {
                          const isSelected = (newValues[col.key] || []).includes(opt);
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => {
                                setNewValues({
                                  ...newValues,
                                  [col.key]: toggleMultiSelectValue(newValues, col.key, opt),
                                });
                              }}
                              className={`px-2 py-0.5 text-xs rounded border ${
                                isSelected
                                  ? 'bg-accent text-white border-accent'
                                  : 'bg-card-hover text-secondary border-std hover:border-accent'
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    ) : col.isColor ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={newValues[col.key] || '#6366f1'}
                          onChange={e => setNewValues({ ...newValues, [col.key]: e.target.value })}
                          className="w-8 h-8 rounded cursor-pointer border border-std"
                        />
                        <input
                          type="text"
                          value={newValues[col.key] || ''}
                          onChange={e => setNewValues({ ...newValues, [col.key]: e.target.value })}
                          placeholder="#hex"
                          maxLength={7}
                          className="flex-1 px-2 py-1 text-sm bg-input border border-std rounded text-primary focus:outline-none focus:border-accent"
                        />
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={newValues[col.key] || ''}
                        onChange={e => setNewValues({ ...newValues, [col.key]: e.target.value })}
                        placeholder={col.placeholder || col.label}
                        maxLength={col.maxLength}
                        className="w-full px-2 py-1 text-sm bg-input border border-std rounded text-primary focus:outline-none focus:border-accent"
                        autoFocus
                      />
                    )}
                  </td>
                ))}
                <td className="py-2 px-3 text-right">
                  <button
                    onClick={handleAdd}
                    className="p-1 text-green-500 hover:bg-green-50 rounded"
                    title="Confirmer"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={() => {
                      setShowAdd(false);
                      setNewValues({});
                      setError(null);
                    }}
                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                    title="Annuler"
                  >
                    <X size={16} />
                  </button>
                </td>
              </tr>
            )}
            {items.length === 0 && !showAdd ? (
              <tr>
                <td colSpan={columns.length + 1} className="py-4 text-center text-muted">
                  Aucun élément
                </td>
              </tr>
            ) : (
              items.map(item => {
                const itemId = item.id || item.code;
                const isEditing = editingId === itemId;
                return (
                  <tr key={itemId} className="border-b border-std hover:bg-card-hover">
                    {columns.map(col => (
                      <td key={col.key} className="py-2 px-3 text-primary">
                        {isEditing ? (
                          col.isMultiSelect ? (
                            <div className="flex flex-wrap gap-1">
                              {(multiSelectOptions[col.key] || []).map(opt => {
                                const isSelected = (editValues[col.key] || []).includes(opt);
                                return (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={e => {
                                      e.stopPropagation();
                                      setEditValues({
                                        ...editValues,
                                        [col.key]: toggleMultiSelectValue(editValues, col.key, opt),
                                      });
                                    }}
                                    className={`px-2 py-0.5 text-xs rounded border ${
                                      isSelected
                                        ? 'bg-accent text-white border-accent'
                                        : 'bg-card-hover text-secondary border-std hover:border-accent'
                                    }`}
                                  >
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>
                          ) : col.isColor ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={editValues[col.key] || '#6366f1'}
                                onChange={e =>
                                  setEditValues({ ...editValues, [col.key]: e.target.value })
                                }
                                className="w-8 h-8 rounded cursor-pointer border border-std"
                              />
                              <input
                                type="text"
                                value={editValues[col.key] || ''}
                                onChange={e =>
                                  setEditValues({ ...editValues, [key]: e.target.value })
                                }
                                maxLength={7}
                                className="flex-1 px-2 py-1 text-sm bg-input border border-std rounded text-primary focus:outline-none focus:border-accent"
                              />
                            </div>
                          ) : (
                            <input
                              type="text"
                              value={editValues[col.key] || ''}
                              onChange={e =>
                                setEditValues({ ...editValues, [col.key]: e.target.value })
                              }
                              maxLength={col.maxLength}
                              className="w-full px-2 py-1 text-sm bg-input border border-std rounded text-primary focus:outline-none focus:border-accent"
                            />
                          )
                        ) : (
                          renderCell(col, item, item, () => {})
                        )}
                      </td>
                    ))}
                    <td className="py-2 px-3 text-right">
                      {isEditing ? (
                        <>
                          <button
                            onClick={handleSave}
                            className="p-1 text-green-500 hover:bg-green-50 rounded"
                            title="Confirmer"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={handleCancel}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                            title="Annuler"
                          >
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-1 text-blue-500 hover:bg-blue-50 rounded"
                            title="Modifier"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(itemId)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                            title="Supprimer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
