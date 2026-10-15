export const ROLES = ['ADMIN', 'MANAGER', 'DEVELOPER', 'TESTER'];
export const ISSUE_TYPES = ['TASK', 'STORY', 'BUG', 'EPIC', 'SUBTASK'];
export const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
// Spellings match the backend enums exactly (IN_RIVIEW, CMPLETED).
export const STATUSES = ['OPEN', 'TODO', 'IN_PROGRESS', 'IN_RIVIEW', 'DONE', 'REOPEN', 'CLOSED', 'BLOCKED'];
export const BOARD_STATUSES = ['OPEN', 'TODO', 'IN_PROGRESS', 'IN_RIVIEW', 'DONE'];
export const SPRINT_STATES = ['PLANNED', 'ACTIVE', 'CMPLETED', 'ABORTED'];

export const STATUS_LABEL = {
  OPEN: 'Open',
  TODO: 'To do',
  IN_PROGRESS: 'In progress',
  IN_RIVIEW: 'In review',
  DONE: 'Done',
  REOPEN: 'Reopened',
  CLOSED: 'Closed',
  BLOCKED: 'Blocked',
  PLANNED: 'Planned',
  ACTIVE: 'Active',
  CMPLETED: 'Completed',
  ABORTED: 'Aborted',
};

export const STATUS_TONE = {
  OPEN: 'slate',
  TODO: 'blue',
  IN_PROGRESS: 'amber',
  IN_RIVIEW: 'violet',
  DONE: 'green',
  REOPEN: 'orange',
  CLOSED: 'slate',
  BLOCKED: 'red',
  PLANNED: 'blue',
  ACTIVE: 'green',
  CMPLETED: 'slate',
  ABORTED: 'red',
};

export const PRIORITY_TONE = { LOW: 'slate', MEDIUM: 'blue', HIGH: 'orange', CRITICAL: 'red' };
export const TYPE_ICON = { TASK: '✓', STORY: '★', BUG: '●', EPIC: '⚡', SUBTASK: '↳' };
export const TYPE_TONE = { TASK: 'blue', STORY: 'green', BUG: 'red', EPIC: 'violet', SUBTASK: 'slate' };
