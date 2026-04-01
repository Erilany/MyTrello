import React from 'react';
import { Circle, PlayCircle } from 'lucide-react';
import { getStatusColor, getStatusLabel, getPriorityColor, getPriorityLabel } from '../../shared/utils';

export default function TaskTable({ tasks, title, icon: Icon, iconColor, onTaskClick, onDueDateClick }) {
  return (
    <div className="bg-card rounded-lg border border-std p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
          <Icon size={20} className={`text-${iconColor}-500`} />
          {title}
        </h2>
        <span className="text-xs text-muted">{tasks.length} tâches</span>
      </div>
      {tasks.length === 0 ? (
        <p className="text-secondary text-sm py-4">
          Aucune tâche à terminer dans cette période
        </p>
      ) : (
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-std">
                <th className="text-left py-2 px-3 text-muted font-medium">Projet</th>
                <th className="text-left py-2 px-3 text-muted font-medium">Action</th>
                <th className="text-left py-2 px-3 text-muted font-medium">Tâche</th>
                <th className="text-left py-2 px-3 text-muted font-medium">État</th>
                <th className="text-left py-2 px-3 text-muted font-medium">Avancement</th>
                <th className="text-left py-2 px-3 text-muted font-medium">Priorité</th>
                <th className="text-left py-2 px-3 text-muted font-medium">Échéance</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(task => (
                <tr
                  key={task.id}
                  className="border-b border-std hover:bg-card-hover cursor-pointer"
                  onClick={() => onTaskClick(task)}
                >
                  <td className="py-2 px-3 text-primary">{task.board?.title}</td>
                  <td className="py-2 px-3 text-secondary">{task.category?.title}</td>
                  <td className="py-2 px-3 text-primary font-medium">{task.title}</td>
                  <td className="py-2 px-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs text-white ${getStatusColor(task.status)}`}
                    >
                      {task.status === 'in_progress' ? (
                        <PlayCircle size={12} />
                      ) : (
                        <Circle size={12} />
                      )}
                      {getStatusLabel(task.status)}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-card-hover rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            task.status === 'in_progress'
                              ? 'bg-blue-500'
                              : task.status === 'waiting'
                                ? 'bg-yellow-500'
                                : 'bg-gray-400'
                          }`}
                          style={{ width: `${task.progress || 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted w-8">{task.progress || 0}%</span>
                    </div>
                  </td>
                  <td
                    className={`py-2 px-3 font-medium ${getPriorityColor(task.priority)}`}
                  >
                    {getPriorityLabel(task.priority)}
                  </td>
                  <td
                    className="py-2 px-3 text-muted cursor-pointer hover:text-accent"
                    onClick={e => onDueDateClick(e, task)}
                    title="Cliquez pour ouvrir le planning"
                  >
                    {task.due_date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
