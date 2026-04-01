export function getStatusColor(status) {
  switch (status) {
    case 'done':
      return 'bg-green-500';
    case 'waiting':
      return 'bg-blue-500';
    case 'todo':
      return 'bg-red-500';
    case 'in_progress':
      return 'bg-yellow-500';
    case 'blocked':
      return 'bg-red-500';
    default:
      return 'bg-gray-400';
  }
}

export function getStatusLabel(status) {
  switch (status) {
    case 'done':
      return 'Terminé';
    case 'in_progress':
      return 'En cours';
    case 'waiting':
      return 'En attente';
    case 'todo':
      return 'À faire';
    default:
      return 'Pas encore';
  }
}

export function getPriorityColor(priority) {
  switch (priority) {
    case 'urgent':
      return 'text-red-500';
    case 'high':
      return 'text-orange-500';
    default:
      return 'text-blue-500';
  }
}

export function getPriorityLabel(priority) {
  switch (priority) {
    case 'urgent':
      return 'Urgent';
    case 'high':
      return 'Haute';
    default:
      return 'Normale';
  }
}

export function getTaskProgress(status) {
  switch (status) {
    case 'done':
      return 100;
    case 'in_progress':
      return 50;
    case 'waiting':
      return 25;
    case 'todo':
      return 0;
    default:
      return 0;
  }
}
