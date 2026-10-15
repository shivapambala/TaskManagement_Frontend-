import { request } from './client';

export const authApi = {
  login: (userOfficialEmail, password) =>
    request('/api/auth/login', { method: 'POST', auth: false, body: { userOfficialEmail, password } }),
  register: (payload) => request('/api/auth/register', { method: 'POST', auth: false, body: payload }),
  logout: () => request('/api/auth/logOut', { method: 'POST' }),
  forgotPassword: (userOfficialEmail) =>
    request('/api/auth/forgot_password', { method: 'POST', auth: false, params: { userOfficialEmail } }),
  resetPassword: (token, newPassword) =>
    request('/api/auth/reset-password', { method: 'POST', auth: false, params: { token, newPassword } }),
};

export const issueApi = {
  search: (filters = {}) => request('/api/issues/search', { method: 'POST', body: filters }),
  get: (id) => request(`/api/issues/${id}`),
  create: (issue, labels) => request('/api/issues/create', { method: 'POST', body: issue, params: { labels } }),
  updateStatus: (id, issueStatus) =>
    request(`/api/issues/${id}/status`, { method: 'PUT', params: { issueStatus } }),
  addComment: (id, authoremail, body) =>
    request(`/api/issues/comment/${id}`, { method: 'POST', params: { authoremail }, body }),
};

export const sprintApi = {
  create: (sprint) => request('/api/sprints/createSprint', { method: 'POST', body: sprint }),
  start: (id) => request(`/api/sprints/${id}/start`, { method: 'PUT' }),
  end: (id) => request(`/api/sprints/${id}/end`, { method: 'PUT' }),
  assign: (sprintId, issueId) => request(`/api/sprints/assign/${sprintId}/${issueId}`, { method: 'PUT' }),
};

export const reportApi = {
  burnDown: (sprintId) => request(`/api/reports/burnDownData/${sprintId}`),
  sprint: (sprintId) => request(`/api/reports/sprint/${sprintId}`),
  workLoad: (sprintId) => request(`/api/reports/workLoad/${sprintId}`),
  flow: (sprintId) => request(`/api/reports/flowChat/${sprintId}`),
  velocity: (projectId) => request(`/api/reports/velocity/${projectId}`),
  epic: (epicId) => request(`/api/reports/epicReport/${epicId}`),
};

export const attachmentApi = {
  list: (issueId) => request(`/api/attachments/issue/${issueId}`),
  upload: (issueId, file, uploadedBy) => {
    const form = new FormData();
    form.append('file', file);
    form.append('uploadedBy', uploadedBy);
    return request(`/api/attachments/upload/${issueId}`, { method: 'POST', form });
  },
  remove: (id) => request(`/api/attachments/delete/${id}`, { method: 'DELETE' }),
  downloadUrl: (id) => `/api/attachments/download/${id}`,
};

export const profileApi = {
  all: () => request('/api/user_profile_update/all'),
  get: (email) => request(`/api/user_profile_update/${encodeURIComponent(email)}`),
  update: (email, dto) =>
    request(`/api/user_profile_update/updateUserProfile/${encodeURIComponent(email)}`, { method: 'PUT', body: dto }),
};

export const workflowApi = {
  all: () => request('/all'),
  create: (wf) => request('/create', { method: 'POST', body: wf }),
  remove: (id) => request(`/${id}`, { method: 'DELETE' }),
};

export const boardApi = {
  get: (id) => request(`/api/boards/${id}`),
  create: (board) => request('/api/boards/createBoard', { method: 'POST', body: board }),
};
