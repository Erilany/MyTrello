import React, { useMemo } from 'react';
import { X, Calendar, Clock, User } from 'lucide-react';

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

  const formatDate = dateStr => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR');
  };

  const getPriorityBadge = priority => {
    if (priority === 'urgent') return { class: 'bg-red-500/20 text-red-400', label: 'U' };
    if (priority === 'high') return { class: 'bg-orange-500/20 text-orange-400', label: 'H' };
    if (priority === 'low') return { class: 'bg-blue-500/20 text-blue-400', label: 'B' };
    if (priority === 'done') return { class: 'bg-green-500/20 text-green-400', label: '✓' };
    return null;
  };

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
              <div className="font-medium text-sm text-primary mb-2 flex items-center gap-2">
                <span className="bg-accent/20 text-accent px-2 py-0.5 rounded text-xs">
                  {group.card}
                </span>
                <span className="text-muted">→</span>
                <span className="bg-accent-soft text-accent px-2 py-0.5 rounded text-xs">
                  {group.category}
                </span>
              </div>
              <div className="space-y-1 ml-4">
                {group.tasks.map(task => {
                  const priorityBadge = getPriorityBadge(task.priority);
                  const isSelected = selectedTaskIds.some(id => Number(id) === Number(task.id));

                  return (
                    <label
                      key={task.id}
                      className={`flex items-center gap-2 p-2 rounded cursor-pointer border transition-std ${
                        isSelected
                          ? 'bg-accent/10 border-accent'
                          : 'hover:bg-card-hover border-transparent border'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleTask(task.id, task)}
                        className="w-4 h-4 rounded border-std text-accent"
                      />
                      <div className="flex-1 min-w-0 flex items-center gap-2">
                        <span
                          className="text-sm text-primary hover:underline cursor-pointer truncate"
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

                        <div className="flex items-center gap-1.5 ml-auto shrink-0">
                          {priorityBadge && (
                            <span
                              className={`text-xs px-1.5 py-0.5 rounded ${priorityBadge.class}`}
                            >
                              {priorityBadge.label}
                            </span>
                          )}

                          {task.start_date && (
                            <span className="text-xs text-muted flex items-center gap-1">
                              <Calendar size={10} />
                              {formatDate(task.start_date)}
                            </span>
                          )}

                          {task.due_date && (
                            <span className="text-xs text-muted flex items-center gap-1">
                              <Calendar size={10} />
                              {formatDate(task.due_date)}
                            </span>
                          )}

                          {task.duration_days > 0 && (
                            <span className="text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded flex items-center gap-1">
                              <Clock size={10} />
                              {task.duration_days}j
                            </span>
                          )}

                          {task.assignee && (
                            <span className="text-xs bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded flex items-center gap-1">
                              <User size={10} />
                              {task.assignee}
                            </span>
                          )}
                        </div>
                      </div>
                    </label>
                  );
                })}
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
