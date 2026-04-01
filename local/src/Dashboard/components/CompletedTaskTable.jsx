import React from 'react';
import { CheckCircle } from 'lucide-react';
import { getPriorityColor, getPriorityLabel } from '../../shared/utils';

export default function CompletedTaskTable({ tasks, onTaskClick }) {
  if (tasks.length === 0) return null;

  return (
    <div className="bg-card rounded-lg border border-std p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
          <CheckCircle size={20} className="text-green-500" />
          Tâches terminées
        </h2>
        <span className="text-xs text-muted">{tasks.length} tâches</span>
      </div>
      <div className="overflow-x-auto max-h-64">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-std">
              <th className="text-left py-2 px-3 text-muted font-medium">Projet</th>
              <th className="text-left py-2 px-3 text-muted font-medium">Action</th>
              <th className="text-left py-2 px-3 text-muted font-medium">Tâche</th>
              <th className="text-left py-2 px-3 text-muted font-medium">Avancement</th>
              <th className="text-left py-2 px-3 text-muted font-medium">Priorité</th>
              <th className="text-left py-2 px-3 text-muted font-medium">Échéance</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(task => (
              <tr
                key={task.id}
                className="border-b border-std hover:bg-card-hover cursor-pointer opacity-75"
                onClick={() => onTaskClick(task)}
              >
                <td className="py-2 px-3 text-primary">{task.board?.title}</td>
                <td className="py-2 px-3 text-secondary">{task.category?.title}</td>
                <td className="py-2 px-3 text-primary font-medium line-through">
                  {task.title}
                </td>
                <td className="py-2 px-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-green-500 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: '100%' }}
                      />
                    </div>
                    <span className="text-xs text-muted w-8">100%</span>
                  </div>
                </td>
                <td
                  className={`py-2 px-3 font-medium ${getPriorityColor(task.priority)}`}
                >
                  {getPriorityLabel(task.priority)}
                </td>
                <td className="py-2 px-3 text-muted">{task.due_date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
