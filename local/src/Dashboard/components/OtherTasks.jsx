import React, { useState } from 'react';
import { Users, ChevronDown, ChevronRight, CheckCircle, PlayCircle, Circle } from 'lucide-react';
import { getStatusColor, getStatusLabel, getPriorityColor, getPriorityLabel } from '../../shared/utils';

export default function OtherTasks({
  allBoards,
  selectedProject,
  setSelectedProject,
  onTaskClick,
  onDueDateClick,
}) {
  const [expandedProjects, setExpandedProjects] = useState({});

  const toggleProject = boardId => {
    setExpandedProjects(prev => ({
      ...prev,
      [boardId]: !prev[boardId],
    }));
  };

  const getTasksByProject = () => {
    const groups = {};
    allBoards.forEach(board => {
      if (board.tasks && board.tasks.length > 0) {
        groups[board.id] = {
          board,
          tasks: board.tasks.sort((a, b) => {
            const dateA = a.due_date ? new Date(a.due_date) : new Date('9999-12-31');
            const dateB = b.due_date ? new Date(b.due_date) : new Date('9999-12-31');
            return dateA - dateB;
          }),
        };
      }
    });

    return Object.values(groups).sort((a, b) => {
      const firstTaskA = a.tasks[0];
      const firstTaskB = b.tasks[0];
      const dateA = firstTaskA?.due_date ? new Date(firstTaskA.due_date) : new Date('9999-12-31');
      const dateB = firstTaskB?.due_date ? new Date(firstTaskB.due_date) : new Date('9999-12-31');
      return dateA - dateB;
    });
  };

  const groups = getTasksByProject();

  return (
    <div className="bg-card rounded-lg border border-std p-6 flex-1">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
          <Users size={20} className="text-orange-500" />
          Autres tâches des projets
        </h2>
        <button
          onClick={() => setSelectedProject(null)}
          className="px-3 py-1.5 text-sm rounded bg-card-hover text-secondary hover:bg-std"
        >
          Masquer
        </button>
      </div>
      {selectedProject && (
        <p className="text-sm text-muted mb-2">
          Projet: {allBoards.find(b => Number(b.id) === Number(selectedProject))?.title}
          <button
            onClick={() => setSelectedProject(null)}
            className="ml-2 text-accent hover:underline text-xs"
          >
            Voir tous les projets
          </button>
        </p>
      )}
      <p className="text-sm text-muted mb-4">
        Liste des tâches non assignées ou assignées à d'autres utilisateurs
      </p>

      {groups.length === 0 ? (
        <p className="text-secondary text-sm py-4">Aucune tâche trouvée</p>
      ) : (
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-std">
                <th className="text-left py-2 px-3 text-muted font-medium">Projet</th>
                <th className="text-left py-2 px-3 text-muted font-medium">Action</th>
                <th className="text-left py-2 px-3 text-muted font-medium">Tâche</th>
                <th className="text-left py-2 px-3 text-muted font-medium">Assigné à</th>
                <th className="text-left py-2 px-3 text-muted font-medium">État</th>
                <th className="text-left py-2 px-3 text-muted font-medium">Priorité</th>
                <th className="text-left py-2 px-3 text-muted font-medium">Échéance</th>
              </tr>
            </thead>
            <tbody>
              {groups.map(group => {
                const boardId = group.board?.id || 'unassigned';
                const isExpanded = expandedProjects[boardId] !== false;
                const taskCount = group.tasks.length;

                return (
                  <React.Fragment key={boardId}>
                    <tr
                      className="border-b border-std bg-card-hover cursor-pointer hover:bg-std"
                      onClick={() => toggleProject(boardId)}
                    >
                      <td colSpan={7} className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <ChevronDown size={16} className="text-muted" />
                          ) : (
                            <ChevronRight size={16} className="text-muted" />
                          )}
                          <span className="font-semibold text-primary">
                            {group.board?.title || 'Projet non identifié'}
                          </span>
                          <span className="text-xs text-muted">
                            ({taskCount} tâche{taskCount > 1 ? 's' : ''})
                          </span>
                        </div>
                      </td>
                    </tr>
                    {isExpanded &&
                      group.tasks.map(task => (
                        <tr
                          key={task.id}
                          className="border-b border-std hover:bg-card-hover cursor-pointer pl-8"
                          onClick={() => onTaskClick(task)}
                        >
                          <td className="py-2 px-3 pl-12 text-secondary">
                            {task.category?.title}
                          </td>
                          <td className="py-2 px-3 text-primary font-medium">
                            {task.title}
                          </td>
                          <td className="py-2 px-3 text-muted">
                            {task.assignee || 'Non assigné'}
                          </td>
                          <td className="py-2 px-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs text-white ${getStatusColor(task.status)}`}
                            >
                              {task.status === 'done' ? (
                                <CheckCircle size={12} />
                              ) : task.status === 'in_progress' ? (
                                <PlayCircle size={12} />
                              ) : (
                                <Circle size={12} />
                              )}
                              {getStatusLabel(task.status)}
                            </span>
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
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
