import axios from 'axios';
import type {
  Project,
  Task,
  Brief,
  DoD,
  DecisionLog,
  Review,
  Sample,
  KPIData,
  Notification,
  NotificationSettings,
  NotificationStats,
  NotificationStatus,
  UnifiedSearchResponse,
  SimilarProject,
  DecisionPattern,
  ContentSummary,
  Template,
  TemplateRecommendation,
  BestPractice,
  TemplateStats,
  TemplateCategory,
  TemplateType,
  CreateProjectForm,
  CreateTaskForm,
  UpdateTaskStateForm,
  CreateBriefForm,
  User,
  ProjectMember,
  ProjectInvite,
  ApprovalWorkflow,
  ApprovalResponse,
  TeamDecision,
  DecisionVote,
  DecisionComment,
  DecisionStats,
  UserWorkload,
  UserRole,
  SharePermission,
  ApprovalStatus
} from '@/types';

// API 클라이언트 설정
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 에러 핸들링
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// Projects API
export const projectsApi = {
  getAll: () => apiClient.get<Project[]>('/projects'),
  getById: (id: number) => apiClient.get<Project>(`/projects/${id}`),
  create: (data: CreateProjectForm) => apiClient.post<Project>('/projects', data),
  update: (id: number, data: Partial<Project>) => 
    apiClient.patch<Project>(`/projects/${id}`, data),
  delete: (id: number) => apiClient.delete(`/projects/${id}`),
};

// Tasks API  
export const tasksApi = {
  getAll: () => apiClient.get<Task[]>('/tasks'),
  getById: (id: number) => apiClient.get<Task>(`/tasks/${id}`),
  create: (data: CreateTaskForm) => apiClient.post<Task>('/tasks', data),
  updateState: (id: number, data: UpdateTaskStateForm) =>
    apiClient.patch<Task>(`/tasks/${id}/state`, data),
  update: (id: number, data: Partial<Task>) =>
    apiClient.patch<Task>(`/tasks/${id}`, data),
  delete: (id: number) => apiClient.delete(`/tasks/${id}`),
};

// Briefs API
export const briefsApi = {
  getAll: () => apiClient.get<Brief[]>('/briefs'),
  getByTaskId: (taskId: number) => apiClient.get<Brief>(`/briefs/task/${taskId}`),
  create: (data: CreateBriefForm) => apiClient.post<Brief>('/briefs', data),
  update: (id: number, data: Partial<Brief>) =>
    apiClient.patch<Brief>(`/briefs/${id}`, data),
  delete: (id: number) => apiClient.delete(`/briefs/${id}`),
};

// DoD API
export const dodApi = {
  getAll: () => apiClient.get<DoD[]>('/dod'),
  getByTaskId: (taskId: number) => apiClient.get<DoD>(`/dod/task/${taskId}`),
  create: (data: Partial<DoD>) => apiClient.post<DoD>('/dod', data),
  update: (id: number, data: Partial<DoD>) =>
    apiClient.patch<DoD>(`/dod/${id}`, data),
  delete: (id: number) => apiClient.delete(`/dod/${id}`),
};

// Decisions API
export const decisionsApi = {
  getAll: () => apiClient.get<DecisionLog[]>('/decisions'),
  getByTaskId: (taskId: number) => apiClient.get<DecisionLog[]>(`/decisions/task/${taskId}`),
  create: (data: Partial<DecisionLog>) => apiClient.post<DecisionLog>('/decisions', data),
  updateDPlus7: (id: number, review: string) =>
    apiClient.patch<DecisionLog>(`/decisions/${id}/dplus7`, { d_plus_7_review: review }),
  delete: (id: number) => apiClient.delete(`/decisions/${id}`),
};

// Reviews API
export const reviewsApi = {
  getAll: () => apiClient.get<Review[]>('/reviews'),
  getByTaskId: (taskId: number) => apiClient.get<Review[]>(`/reviews/task/${taskId}`),
  create: (data: Partial<Review>) => apiClient.post<Review>('/reviews', data),
  update: (id: number, data: Partial<Review>) =>
    apiClient.patch<Review>(`/reviews/${id}`, data),
  delete: (id: number) => apiClient.delete(`/reviews/${id}`),
};

// Samples API
export const samplesApi = {
  getAll: () => apiClient.get<Sample[]>('/samples'),
  getByTaskId: (taskId: number) => apiClient.get<Sample[]>(`/samples/task/${taskId}`),
  create: (data: Partial<Sample>) => apiClient.post<Sample>('/samples', data),
  update: (id: number, data: Partial<Sample>) =>
    apiClient.patch<Sample>(`/samples/${id}`, data),
  delete: (id: number) => apiClient.delete(`/samples/${id}`),
};

// Dashboard API
export const dashboardApi = {
  getKPIs: () => apiClient.get<KPIData>('/dashboard/kpi'),
};

// Exports API
export const exportsApi = {
  exportProjectMd: (projectId: number) =>
    apiClient.get<string>(`/exports/project/${projectId}/md`),
};

// Notifications API
export const notificationsApi = {
  getAll: (status?: NotificationStatus, limit?: number) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (limit) params.append('limit', limit.toString());
    return apiClient.get<Notification[]>(`/notifications?${params.toString()}`);
  },
  getPending: () => apiClient.get<Notification[]>('/notifications/pending'),
  generate: () => apiClient.post<{message: string; count: number}>('/notifications/generate'),
  markRead: (id: number) => apiClient.patch<{message: string}>(`/notifications/${id}/mark-read`),
  dismiss: (id: number) => apiClient.patch<{message: string}>(`/notifications/${id}/dismiss`),
  getSettings: () => apiClient.get<NotificationSettings>('/notifications/settings'),
  updateSettings: (settings: Partial<NotificationSettings>) => 
    apiClient.patch<{message: string; settings: NotificationSettings}>('/notifications/settings', settings),
  getStats: () => apiClient.get<NotificationStats>('/notifications/stats'),
};

// Search API
export const searchApi = {
  unified: (query: string, types?: string[], limit?: number) => {
    const params = new URLSearchParams({ q: query });
    if (types && types.length > 0) {
      types.forEach(type => params.append('types', type));
    }
    if (limit) params.append('limit', limit.toString());
    return apiClient.get<UnifiedSearchResponse>(`/search?${params.toString()}`);
  },
  similarProjects: (projectId: number, limit?: number) => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    return apiClient.get<{project_id: number; similar_projects: SimilarProject[]}>
      (`/search/similar-projects/${projectId}?${params.toString()}`);
  },
  decisionPatterns: (query: string, limit?: number) => {
    const params = new URLSearchParams({ q: query });
    if (limit) params.append('limit', limit.toString());
    return apiClient.get<{query: string; decision_patterns: DecisionPattern[]}>
      (`/search/decision-patterns?${params.toString()}`);
  },
  projectSuggestions: (projectId: number) => 
    apiClient.get(`/search/suggestions/${projectId}`),
  stats: () => apiClient.get<{
    content_summary: ContentSummary;
    search_capabilities: Record<string, string>;
    supported_content_types: Array<{type: string; description: string}>;
  }>('/search/stats'),
};

// Templates API
export const templatesApi = {
  getAll: (category?: TemplateCategory, templateType?: TemplateType, includeSystem?: boolean, includeAI?: boolean, limit?: number) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (templateType) params.append('template_type', templateType);
    if (includeSystem !== undefined) params.append('include_system', includeSystem.toString());
    if (includeAI !== undefined) params.append('include_ai', includeAI.toString());
    if (limit) params.append('limit', limit.toString());
    return apiClient.get<{templates: Template[]; total: number}>(`/templates?${params.toString()}`);
  },
  getById: (id: number) => apiClient.get<Template>(`/templates/${id}`),
  getRecommended: (keywords: string, limit?: number) => {
    const params = new URLSearchParams({ keywords });
    if (limit) params.append('limit', limit.toString());
    return apiClient.get<{keywords: string[]; recommendations: TemplateRecommendation[]}>
      (`/templates/recommend?${params.toString()}`);
  },
  generateFromProject: (projectId: number) => 
    apiClient.post<{message: string; generated_templates: Template[]}>(`/templates/generate-from-project/${projectId}`),
  recordUsage: (templateId: number, usageData: {used_for: string; was_helpful?: boolean; feedback_notes?: string}) => 
    apiClient.post(`/templates/${templateId}/use`, usageData),
  getCategories: () => apiClient.get<{categories: Array<{value: TemplateCategory; label: string; description: string}>}>
    ('/templates/categories/stats'),
  getBestPractices: (category?: TemplateCategory, limit?: number) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (limit) params.append('limit', limit.toString());
    return apiClient.get<{best_practices: BestPractice[]; total: number}>
      (`/templates/best-practices/?${params.toString()}`);
  },
  getStats: () => apiClient.get<{template_stats: TemplateStats; summary: Record<string, unknown>}>('/templates/stats/overview'),
  initSystemTemplates: () => apiClient.post<{message: string}>('/templates/init-system-templates'),
};

// Collaboration API
export const collaborationApi = {
  // 사용자 관리
  createUser: (userData: {username: string; email: string; full_name?: string}) =>
    apiClient.post<{user: User}>('/collaboration/users', userData),
  
  getUserProjects: (userId: number, includeShared: boolean = true) =>
    apiClient.get<{user_id: number; projects: Project[]; total: number}>
      (`/collaboration/users/${userId}/projects?include_shared=${includeShared}`),
  
  getUserWorkload: (userId: number, projectId?: number) => {
    const params = new URLSearchParams();
    if (projectId) params.append('project_id', projectId.toString());
    return apiClient.get<{user_id: number; project_id?: number; workload: UserWorkload}>
      (`/collaboration/users/${userId}/workload?${params.toString()}`);
  },

  // 프로젝트 공유
  shareProject: (projectId: number, shareData: {
    target_user_id?: number;
    target_email?: string;
    role: UserRole;
    permissions: SharePermission;
  }, ownerId: number) =>
    apiClient.post<{message: string; invite: ProjectInvite}>
      (`/collaboration/projects/${projectId}/share?owner_id=${ownerId}`, shareData),

  acceptInvite: (inviteToken: string, userId: number) =>
    apiClient.post<{message: string; membership: ProjectMember}>
      (`/collaboration/invites/${inviteToken}/accept?user_id=${userId}`),

  getProjectMembers: (projectId: number) =>
    apiClient.get<{project_id: number; members: ProjectMember[]; total: number}>
      (`/collaboration/projects/${projectId}/members`),

  // 태스크 할당
  assignTask: (taskId: number, assigneeId: number, assignerId: number) =>
    apiClient.patch<{message: string; task: Task}>
      (`/collaboration/tasks/${taskId}/assign?assigner_id=${assignerId}`, {assignee_id: assigneeId}),

  // 승인 워크플로우
  createApprovalWorkflow: (projectId: number, approvalData: {
    title: string;
    description: string;
    approver_user_ids: number[];
    required_approvers: number;
    task_id?: number;
    decision_id?: number;
  }, requestedById: number) =>
    apiClient.post<{message: string; workflow: ApprovalWorkflow}>
      (`/collaboration/projects/${projectId}/approvals?requested_by_id=${requestedById}`, approvalData),

  respondToApproval: (workflowId: number, responseData: {
    is_approved: boolean;
    comment?: string;
  }, approverId: number) =>
    apiClient.post<{message: string; response: ApprovalResponse}>
      (`/collaboration/approvals/${workflowId}/respond?approver_id=${approverId}`, responseData),

  getApprovalWorkflow: (workflowId: number) =>
    apiClient.get<{workflow: ApprovalWorkflow; responses: ApprovalResponse[]}>
      (`/collaboration/approvals/${workflowId}`),

  // 팀 의사결정
  createTeamDecision: (projectId: number, decisionData: {
    title: string;
    description: string;
    options: string[];
    task_id?: number;
    is_voting_enabled: boolean;
    voting_deadline?: string;
    allow_multiple_votes: boolean;
  }, createdById: number) =>
    apiClient.post<{message: string; decision: TeamDecision}>
      (`/collaboration/projects/${projectId}/decisions?created_by_id=${createdById}`, decisionData),

  castVote: (decisionId: number, voteData: {
    selected_options: string[];
    reasoning?: string;
  }, voterId: number) =>
    apiClient.post<{message: string; vote: DecisionVote}>
      (`/collaboration/decisions/${decisionId}/vote?voter_id=${voterId}`, voteData),

  concludeDecision: (decisionId: number, conclusionData: {
    final_decision: string;
    decision_rationale?: string;
  }, concluderId: number) =>
    apiClient.patch<{message: string; decision: TeamDecision}>
      (`/collaboration/decisions/${decisionId}/conclude?concluder_id=${concluderId}`, conclusionData),

  addDecisionComment: (decisionId: number, commentData: {
    content: string;
    parent_comment_id?: number;
  }, authorId: number) =>
    apiClient.post<{message: string; comment: DecisionComment}>
      (`/collaboration/decisions/${decisionId}/comments?author_id=${authorId}`, commentData),

  getTeamDecision: (decisionId: number) =>
    apiClient.get<{
      decision: TeamDecision;
      votes: DecisionVote[];
      comments: DecisionComment[];
      stats: DecisionStats;
    }>(`/collaboration/decisions/${decisionId}`),

  getDecisionStats: (decisionId: number) =>
    apiClient.get<{decision_id: number; stats: DecisionStats}>
      (`/collaboration/decisions/${decisionId}/stats`),
};

export default apiClient;