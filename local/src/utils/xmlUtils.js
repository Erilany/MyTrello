export function calculateDuration(start, end) {
  if (!start || !end) return 0;
  const s = new Date(start);
  const e = new Date(end);
  let days = 0;
  const current = new Date(s);
  while (current <= e) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) days++;
    current.setDate(current.getDate() + 1);
  }
  return days;
}

export function formatDuration(days) {
  if (days === 0) return '0j';
  if (days === 1) return '1j';
  return `${days}j`;
}

export function formatMSProjectDuration(days) {
  return `P${days}D`;
}

export function formatDateForMSP(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().replace('T', 'T').split('.')[0];
}

export function generateMSProjectXML(tasks, projectName) {
  if (!tasks || tasks.length === 0) {
    return null;
  }

  const today = new Date().toISOString().split('T')[0];
  const startDate = tasks.length > 0 && tasks[0].start_date ? tasks[0].start_date : today;
  const endDate =
    tasks.length > 0 && tasks[tasks.length - 1].due_date ? tasks[tasks.length - 1].due_date : today;

  let tasksXML = '';
  tasks.forEach((task, index) => {
    const uid = index + 1;
    const taskStart = task.start_date ? formatDateForMSP(task.start_date) : formatDateForMSP(today);
    const taskFinish = task.due_date ? formatDateForMSP(task.due_date) : formatDateForMSP(today);
    const duration = task.duration_days || calculateDuration(task.start_date, task.due_date);
    const durationStr = formatMSProjectDuration(duration);

    const percentComplete =
      task.status === 'done'
        ? 100
        : task.status === 'in_progress'
          ? 50
          : task.status === 'waiting'
            ? 75
            : 0;

    let predecessorLinks = '';
    if (task.predecessors && task.predecessors.length > 0) {
      task.predecessors.forEach(pred => {
        const predIndex = tasks.findIndex(t => t.id === pred.taskId);
        if (predIndex !== -1) {
          predecessorLinks += `
		<PredecessorLink>
			<Project>${predIndex + 1}</Project>
			<TaskUID>${predIndex + 1}</TaskUID>
			<Type>${pred.type === 'FS' ? 0 : pred.type === 'SS' ? 1 : pred.type === 'FF' ? 2 : 3}</Type>
			<LinkLag>0</LinkLag>
		</PredecessorLink>`;
        }
      });
    }

    tasksXML += `
		<Task>
			<UID>${uid}</UID>
			<ID>${uid}</ID>
			<Name>${task.title}</Name>
			<Manual>0</Manual>
			<Type>1</Type>
			<IsNull>0</IsNull>
			<CreateDate>${today}T09:00:00</CreateDate>
			<WBS>${uid}</WBS>
			<OutlineNumber>${uid}</OutlineNumber>
			<OutlineLevel>1</OutlineLevel>
			<Priority>500</Priority>
			<Start>${taskStart}</Start>
			<Finish>${taskFinish}</Finish>
			<Duration>${durationStr}</Duration>
			<ManualStart>${taskStart}</ManualStart>
			<ManualFinish>${taskFinish}</ManualFinish>
			<ManualDuration>${durationStr}</ManualDuration>
			<DurationFormat>7</DurationFormat>
			<Work>${durationStr}</Work>
			<PercentComplete>${percentComplete}</PercentComplete>
			<ActualDuration>${Math.floor((duration * percentComplete) / 100)}</ActualDuration>
			<FreeformDurationFormat>7</FreeformDurationFormat>
			<FreeSlack>0</FreeSlack>
			<TotalSlack>0</TotalSlack>
			<FixedCost>0</FixedCost>
			<FixedCostAccrual>3</FixedCostAccrual>
			<PercentWorkComplete>${percentComplete}</PercentWorkComplete>
			<PhysicalPercentComplete>${percentComplete}</PhysicalPercentComplete>${predecessorLinks}
			<Milestone>0</Milestone>
			<Summary>0</Summary>
			<Critical>0</Critical>
		</Task>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Project xmlns="http://schemas.microsoft.com/project">
	<SaveVersion>14</SaveVersion>
	<BuildNumber>16.0.19127.20532</BuildNumber>
	<Name>${projectName}</Name>
	<GUID>${'{'}${Date.now().toString(16).toUpperCase()}-1320-F011-9752-D4F32D378D80{'}'}</GUID>
	<Title>${projectName}</Title>
	<CreationDate>${today}T09:00:00</CreationDate>
	<LastSaved>${today}T${new Date().toTimeString().split(' ')[0]}</LastSaved>
	<ScheduleFromStart>1</ScheduleFromStart>
	<StartDate>${startDate}T09:00:00</StartDate>
	<FinishDate>${endDate}T18:00:00</FinishDate>
	<DurationFormat>7</DurationFormat>
	<WorkFormat>2</WorkFormat>
	<DefaultStartTime>09:00:00</DefaultStartTime>
	<DefaultFinishTime>18:00:00</DefaultFinishTime>
	<MinutesPerDay>480</MinutesPerDay>
	<MinutesPerWeek>2400</MinutesPerWeek>
	<DaysPerMonth>21</DaysPerMonth>
	<DefaultTaskType>1</DefaultTaskType>
	<Tasks>${tasksXML}
	</Tasks>
</Project>`;

  return xml;
}
