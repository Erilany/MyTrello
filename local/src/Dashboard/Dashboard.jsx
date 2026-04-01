import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import SubCategoryModal from '../SubCategory/SubCategoryModal';
import ActivityReview from './ActivityReview';
import { Clock, CheckCircle, Circle, ListTodo, Activity, Flag } from 'lucide-react';
import { getWeekNumberISO as getWeekNumber, getWeekRange } from '../shared/utils';
import {
  TimeTab,
  MilestoneList,
  TaskTable,
  CompletedTaskTable,
  getUpcomingTasks,
  getMyMilestones,
} from './components';

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    boards,
    cards,
    categories,
    subcategories,
    currentUsername,
    getProjectTime,
    getAllProjectTime,
    loadProjectTime,
    setSelectedCard,
    loadBoard,
    db,
    toggleMilestone,
    hiddenMilestones,
    addHiddenMilestone,
  } = useApp();

  const [selectedWeek, setSelectedWeek] = useState(() => getWeekNumber(new Date()));
  const [timeRange, setTimeRange] = useState('week');
  const [showOtherTasks, setShowOtherTasks] = useState(false);
  const [selectedTaskDashboard, setSelectedTaskDashboard] = useState(null);
  const [activeTab, setActiveTab] = useState('time');
  const [refreshKey, setRefreshKey] = useState(0);
  const [recentlyCompletedMilestones, setRecentlyCompletedMilestones] = useState([]);
  const [milestoneNotification, setMilestoneNotification] = useState(null);

  const handleMilestoneToggle = (e, milestone) => {
    e.stopPropagation();
    toggleMilestone(milestone.subcategoryId, milestone.id);
    setRecentlyCompletedMilestones(prev => [...prev, milestone.id]);
    setTimeout(() => {
      setRecentlyCompletedMilestones(prev => prev.filter(id => id !== milestone.id));
      addHiddenMilestone(milestone.id);
      setMilestoneNotification('Jalon terminé !');
      setTimeout(() => setMilestoneNotification(null), 2000);
    }, 1000);
  };

  const handleTaskClick = task => setSelectedTaskDashboard(task);
  const handleCloseTask = () => setSelectedTaskDashboard(null);

  const handleDueDateClick = (e, task) => {
    e.stopPropagation();
    if (task.board?.id) {
      localStorage.setItem('c-projets_open_tab', 'planning');
      loadBoard(task.board.id);
      navigate('/board');
    }
  };

  const allBoards = db?.boards || boards;
  const allCards = db?.cards || cards;
  const allCategories = db?.categories || categories;
  const allSubcategories = db?.subcategories || subcategories;
  const allColumns = db?.columns || [];

  const resetProjectTime = projectId => {
    if (!window.confirm('Réinitialiser le temps pour ce projet cette semaine ?')) return;
    const timeData = loadProjectTime();
    const currentWeek = getWeekNumber(new Date());
    if (timeData[currentWeek] && timeData[currentWeek][projectId] !== undefined) {
      timeData[currentWeek][projectId] = 0;
      localStorage.setItem('c-projets_project_time', JSON.stringify(timeData));
      setRefreshKey(k => k + 1);
    }
  };

  const weekOptions = useMemo(() => {
    const timeData = loadProjectTime();
    let weeks = Object.keys(timeData).sort();
    const currentWeek = getWeekNumber(new Date());
    if (!weeks.includes(currentWeek)) {
      weeks.push(currentWeek);
      weeks.sort();
    }
    return weeks.map(week => {
      const range = getWeekRange(week);
      const year = range.start.getFullYear();
      const startStr = range.start.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
      });
      const endStr = range.end.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      return {
        value: week,
        label: `${year} - S${week.split('-W')[1]} (${startStr} - ${endStr})`,
      };
    });
  }, [refreshKey]);

  const projectTimeData = useMemo(() => {
    const allTimes = getAllProjectTime(selectedWeek);
    const totalTime = Object.values(allTimes).reduce((sum, val) => sum + val, 0);
    return boards
      .map(board => {
        const time = allTimes[String(board.id)] || 0;
        const percentage = totalTime > 0 ? (time / totalTime) * 100 : 0;
        const eotpData = JSON.parse(localStorage.getItem(`board-${board.id}-eotp`) || '[]');
        const eotp = eotpData.length > 0
          ? eotpData.map(l => l.ruo).filter(Boolean).join(', ')
          : '';
        return { board, time, percentage, eotp };
      })
      .filter(item => item.time > 0)
      .sort((a, b) => b.percentage - a.percentage);
  }, [boards, selectedWeek, refreshKey]);

  const tabs = [
    { id: 'time', label: 'Temps passé', icon: Clock },
    { id: 'tasks', label: 'Mes tâches', icon: ListTodo },
    { id: 'activity', label: "Revue d'activité", icon: Activity },
  ];

  const myTasks = useMemo(() => {
    const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 180;
    return getUpcomingTasks(
      allSubcategories, allCategories, allCards, allBoards, allColumns,
      currentUsername, days
    ).filter(task => task.assignee === currentUsername);
  }, [allSubcategories, allCategories, allCards, allBoards, allColumns, currentUsername, timeRange]);

  const myMilestones = useMemo(() => {
    return getMyMilestones(
      allSubcategories, allCategories, allCards, allBoards, allColumns, currentUsername
    ).filter(m =>
      !m.milestone.done &&
      !hiddenMilestones.has(m.milestone.id) &&
      !recentlyCompletedMilestones.includes(m.milestone.id)
    );
  }, [allSubcategories, allCategories, allCards, allBoards, allColumns, currentUsername, hiddenMilestones, recentlyCompletedMilestones]);

  const incompleteTasks = myTasks.filter(task => task.status !== 'done');
  const completedTasks = myTasks.filter(task => task.status === 'done');

  return (
    <div className="p-6 max-w-full">
      <h1 className="text-2xl font-display font-bold text-primary mb-6">Dashboard</h1>

      {milestoneNotification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-green-500 text-white rounded-lg shadow-lg">
          {milestoneNotification}
        </div>
      )}

      <div className="flex border-b border-std">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-2 text-sm font-medium border-b-2 transition-std ${
                activeTab === tab.id
                  ? 'border-accent text-accent'
                  : 'border-transparent text-secondary hover:text-primary hover:border-std'
              }`}
            >
              <Icon size={16} className="mr-2" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'time' && (
        <TimeTab
          projectTimeData={projectTimeData}
          selectedWeek={selectedWeek}
          setSelectedWeek={setSelectedWeek}
          weekOptions={weekOptions}
          onResetTime={resetProjectTime}
        />
      )}

      {activeTab === 'tasks' && (
        <div className="flex flex-col gap-4">
          <div className="bg-card rounded-lg border border-std p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
                <CheckCircle size={20} className="text-green-500" />
                Mes tâches à terminer
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTimeRange('week')}
                  className={`px-3 py-1.5 text-sm rounded ${timeRange === 'week' ? 'bg-accent text-white' : 'bg-card-hover text-secondary'}`}
                >
                  7 jours
                </button>
                <button
                  onClick={() => setTimeRange('month')}
                  className={`px-3 py-1.5 text-sm rounded ${timeRange === 'month' ? 'bg-accent text-white' : 'bg-card-hover text-secondary'}`}
                >
                  30 jours
                </button>
                <button
                  onClick={() => setTimeRange('semester')}
                  className={`px-3 py-1.5 text-sm rounded ${timeRange === 'semester' ? 'bg-accent text-white' : 'bg-card-hover text-secondary'}`}
                >
                  6 mois
                </button>
                {!showOtherTasks && (
                  <button
                    onClick={() => setShowOtherTasks(true)}
                    className="px-3 py-1.5 text-sm rounded bg-orange-500 text-white hover:opacity-90"
                  >
                    Afficher autres
                  </button>
                )}
              </div>
            </div>
            <p className="text-sm text-muted mb-4">
              Liste des tâches qui vous sont assignées et qui doivent être terminées dans les{' '}
              {timeRange === 'week' ? '7' : timeRange === 'month' ? '30' : '180'} prochains jours.
              <br />
              <span className="text-xs">
                Cliquez sur une tâche pour voir ses détails ci-dessous
              </span>
            </p>

            <MilestoneList
              milestones={myMilestones}
              allSubcategories={allSubcategories}
              onToggle={handleMilestoneToggle}
              onTaskClick={handleTaskClick}
            />

            <TaskTable
              tasks={incompleteTasks}
              title="Tâches à terminer"
              icon={Circle}
              iconColor="blue"
              onTaskClick={handleTaskClick}
              onDueDateClick={handleDueDateClick}
            />

            <CompletedTaskTable
              tasks={completedTasks}
              onTaskClick={handleTaskClick}
            />

            {selectedTaskDashboard && (
              <div className="mt-4 p-4 bg-card-hover rounded-lg border border-std">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-primary">Tâche sélectionnée</h3>
                  <button onClick={handleCloseTask} className="text-muted hover:text-primary">
                    ✕
                  </button>
                </div>
                <SubCategoryModal subcategory={selectedTaskDashboard} onClose={handleCloseTask} />
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="bg-card rounded-lg border border-std p-4">
          <ActivityReview
            boards={allBoards}
            categories={allCategories}
            subcategories={allSubcategories}
            columns={allColumns}
            cards={allCards}
            currentUsername={currentUsername}
          />
        </div>
      )}
    </div>
  );
}
