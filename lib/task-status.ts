/**
 * Task Status Helpers
 *
 * Handles task countdown timers, overdue calculations, and alert logic
 */

export interface TaskStatus {
  status: 'upcoming' | 'due_soon' | 'overdue' | 'critical' | 'completed' | 'no_due_date';
  daysRemaining: number | null;
  displayText: string;
  needsAlert: boolean;
  needsDirectorAlert: boolean;
}

/**
 * Calculate business days between two dates (excludes weekends)
 */
function getBusinessDays(startDate: Date, endDate: Date): number {
  let count = 0;
  const current = new Date(startDate);

  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}

/**
 * Calculate task status and countdown timer
 */
export function calculateTaskStatus(
  dueDate: string | null,
  completed: boolean,
  completedAt: string | null
): TaskStatus {
  if (completed) {
    return {
      status: 'completed',
      daysRemaining: null,
      displayText: completedAt
        ? `Completed ${new Date(completedAt).toLocaleDateString()}`
        : 'Completed',
      needsAlert: false,
      needsDirectorAlert: false,
    };
  }

  if (!dueDate) {
    return {
      status: 'no_due_date',
      daysRemaining: null,
      displayText: 'No due date',
      needsAlert: false,
      needsDirectorAlert: false,
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(dueDate + 'T00:00:00Z');
  due.setHours(0, 0, 0, 0);

  const diffMs = due.getTime() - today.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const businessDaysRemaining = diffDays >= 0
    ? getBusinessDays(today, due)
    : -getBusinessDays(due, today);

  // Overdue by more than 2 business days → critical, needs director alert
  if (businessDaysRemaining < -2) {
    return {
      status: 'critical',
      daysRemaining: businessDaysRemaining,
      displayText: `${Math.abs(businessDaysRemaining)} business days overdue`,
      needsAlert: true,
      needsDirectorAlert: true,
    };
  }

  // Overdue by 1-2 business days → needs alert
  if (businessDaysRemaining < 0) {
    return {
      status: 'overdue',
      daysRemaining: businessDaysRemaining,
      displayText: `${Math.abs(businessDaysRemaining)} business days overdue`,
      needsAlert: true,
      needsDirectorAlert: false,
    };
  }

  // Due within 2 business days → due soon
  if (businessDaysRemaining <= 2) {
    return {
      status: 'due_soon',
      daysRemaining: businessDaysRemaining,
      displayText: businessDaysRemaining === 0
        ? 'Due today'
        : `Due in ${businessDaysRemaining} business ${businessDaysRemaining === 1 ? 'day' : 'days'}`,
      needsAlert: false,
      needsDirectorAlert: false,
    };
  }

  // Upcoming (more than 2 days away)
  return {
    status: 'upcoming',
    daysRemaining: businessDaysRemaining,
    displayText: `Due in ${businessDaysRemaining} business days`,
    needsAlert: false,
    needsDirectorAlert: false,
  };
}

/**
 * Get responsible person for a task based on owner role and deal assignments
 */
export interface ResponsiblePerson {
  name: string;
  email: string;
  role: string;
}

export function getTaskResponsiblePerson(
  taskOwner: string,
  assignments: Record<string, { name: string; email: string; role: string }>
): ResponsiblePerson | null {
  // Map task owner to assignment role
  const roleMapping: Record<string, string> = {
    'AXM': 'AXM',
    'AXA': 'AXA',
    'CTM': 'CTM',
    'CTA': 'CTA',
    'CXM': 'CXM',
    'Recruiter': 'Recruiter',
    'Director': 'Director',
    'IT': 'IT',
    'HR': 'HR',
    'Finance': 'Finance',
    'Marketing': 'Marketing',
    'Compliance': 'Compliance',
    'Investment Team': 'Investment Team',
    'FP Team': 'FP Team',
    'FIG Team': 'FIG Team',
    'Biz Ops': 'Biz Ops',
    'RIA Leadership': 'RIA Leadership',
    'Advisor': 'Advisor',
  };

  const mappedRole = roleMapping[taskOwner];
  if (!mappedRole) {
    return null;
  }

  return assignments[mappedRole] || null;
}

/**
 * Format task alert for email or notification
 */
export interface TaskAlert {
  dealId: string;
  dealName: string;
  taskId: string;
  taskLabel: string;
  dueDate: string;
  status: TaskStatus;
  responsiblePerson: ResponsiblePerson;
  priority: 'normal' | 'high' | 'critical';
}

export function formatTaskAlert(alert: TaskAlert): {
  subject: string;
  body: string;
  priority: 'normal' | 'high' | 'critical';
} {
  const { dealName, taskLabel, status, responsiblePerson, dueDate } = alert;

  if (status.status === 'critical') {
    return {
      subject: `🚨 CRITICAL: Task Overdue - ${dealName}`,
      body: `
The following task is critically overdue:

Advisor: ${dealName}
Task: ${taskLabel}
Due Date: ${new Date(dueDate).toLocaleDateString()}
Status: ${status.displayText}
Assigned To: ${responsiblePerson.name} (${responsiblePerson.role})

This task is overdue by more than 2 business days and requires immediate attention.

Please complete this task as soon as possible.
      `.trim(),
      priority: 'critical',
    };
  }

  if (status.status === 'overdue') {
    return {
      subject: `⚠️ Task Overdue - ${dealName}`,
      body: `
The following task is overdue:

Advisor: ${dealName}
Task: ${taskLabel}
Due Date: ${new Date(dueDate).toLocaleDateString()}
Status: ${status.displayText}
Assigned To: ${responsiblePerson.name} (${responsiblePerson.role})

Please complete this task as soon as possible to stay on track with the onboarding timeline.
      `.trim(),
      priority: 'high',
    };
  }

  return {
    subject: `Task Due Soon - ${dealName}`,
    body: `
The following task is due soon:

Advisor: ${dealName}
Task: ${taskLabel}
Due Date: ${new Date(dueDate).toLocaleDateString()}
Status: ${status.displayText}
Assigned To: ${responsiblePerson.name} (${responsiblePerson.role})

Please plan to complete this task before the due date.
    `.trim(),
    priority: 'normal',
  };
}
