import React, { useMemo } from 'react';
import { X } from 'lucide-react';

export default function PlanningTaskSelector({
  tasks,
  selectedTaskIds,
  onToggleTask,
  onSelectAll,
  onDeselectAll,
  onClose,
  onCenterTask,
  onEditTask,
}) {
  const groupedTasks = useMemo(() => {
    const grouped = {};

    tasks.forEach(task => {
      const cardTitle = task.card?.title || 'Sans carte';
      const catTitle = task.category?.title || 'Sans action';
      const key = `${cardTitle}|||${catTitle}`;
      if (!grouped[key]) {
        grouped[key] = {
          card: task.card?.title,
          category: task.category?.title,
          tasks: [],
        };
      }
      grouped[key].tasks.push(task);
    });

    return grouped;
  }, [tasks]);

  const allTaskIds = useMemo(() => tasks.map(t => t.id), [tasks]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg border border-std w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-std flex items-center justify-between">
          <h3 className="font-bold text-primary">Sélectionner les tâches</h3>
          <button onClick={onClose} className="p-2 hover:bg-card-hover rounded">
            <X size={20} className="text-secondary" />
          </button>
        </div>
        <div className="p-4 border-b border-std flex gap-2">
          <button
            onClick={() => onSelectAll(allTaskIds)}
            className="px-3 py-1.5 text-sm bg-accent-soft text-accent rounded hover:bg-accent/20"
          >
            Tout sélectionner
          </button>
          <button
            onClick={onDeselectAll}
            className="px-3 py-1.5 text-sm bg-card-hover rounded hover:bg-std"
          >
            Tout désélectionner
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {Object.entries(groupedTasks).map(([key, group]) => (
            <div key={key} className="mb-4">
              <div className="font-medium text-sm text-primary mb-2">
                {group.card} → {group.category}
              </div>
              <div className="space-y-1 ml-4">
                {group.tasks.map(task => (
                  <label
                    key={task.id}
                    className="flex items-center gap-2 p-2 hover:bg-card-hover rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTaskIds.includes(task.id)}
                      onChange={() => onToggleTask(task.id)}
                      className="w-4 h-4 rounded border-std text-accent"
                    />
                    <span
                      className="text-sm text-primary hover:underline cursor-pointer"
                      onClick={e => {
                        e.stopPropagation();
                        onCenterTask(task);
                      }}
                      onDoubleClick={e => {
                        e.stopPropagation();
                        onEditTask(task);
                      }}
                    >
                      {task.title}
                    </span>
                    {task.start_date && (
                      <span className="text-xs text-muted ml-auto">{task.start_date}</span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-std">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-accent text-white rounded-lg hover:opacity-90"
          >
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}
