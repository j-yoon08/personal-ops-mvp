// Backend 모델들과 동일한 구조의 TypeScript 타입들

export enum TaskState {
  BACKLOG = "BACKLOG",
  IN_PROGRESS = "IN_PROGRESS", 
  DONE = "DONE",
  PAUSED = "PAUSED",
  CANCELED = "CANCELED"
}

export enum ReviewType {
  PREMORTEM = "PREMORTEM",
  MIDMORTEM = "MIDMORTEM", 
  RETRO = "RETRO"
}

export enum NotificationType {
  DUE_DATE_REMINDER = "DUE_DATE_REMINDER",
  OVERDUE_TASK = "OVERDUE_TASK",
  MISSING_BRIEF = "MISSING_BRIEF",
  MISSING_DOD = "MISSING_DOD",
  STALE_TASK = "STALE_TASK",
  REVIEW_SCHEDULE = "REVIEW_SCHEDULE"
}

export enum NotificationStatus {
  PENDING = "PENDING",
  SENT = "SENT",
  READ = "READ",
  DISMISSED = "DISMISSED"
}

export interface Project {
  id?: number;
  name: string;
  description?: string;
  owner_id: number;
  is_private: boolean;
  created_at: string;
  task_count?: number;
  tasks?: Task[];
  owner?: User;
  members?: ProjectMember[];
}

export interface Task {
  id?: number;
  project_id: number;
  title: string;
  state: TaskState;
  priority: number; // 1 high - 5 low
  due_date?: string;
  assignee_id?: number;
  created_at: string;
  updated_at: string;
  // metrics
  context_switch_count: number;
  rework_count: number;
  dod_checked: boolean;
  
  project?: Project;
  assignee?: User;
  brief?: Brief;
  dod?: DoD;
  reviews?: Review[];
  decision_logs?: DecisionLog[];
  samples?: Sample[];
}

export interface Brief {
  id?: number;
  task_id: number;
  // 5SB
  purpose: string;
  success_criteria: string;
  constraints: string;
  priority: string;
  validation: string;
  created_at: string;
  task?: Task;
}

export interface DoD {
  id?: number;
  task_id: number;
  deliverable_formats: string; // e.g., "MD,PDF,PPTX"
  mandatory_checks: string;    // JSON-encoded list of 5 checks
  quality_bar: string;         // e.g., typo rate, length, examples, etc.
  verification: string;        // e.g., sample n, review count
  deadline?: string;
  version_tag: string;
  created_at: string;
  task?: Task;
}

export interface DecisionLog {
  id?: number;
  task_id: number;
  date: string;
  problem: string;
  options: string;
  decision_reason: string;
  assumptions_risks: string;
  d_plus_7_review?: string;
  created_at: string;
  task?: Task;
}

export interface Review {
  id?: number;
  task_id: number;
  review_type: ReviewType;
  positives: string;
  negatives: string;
  changes_next: string;
  created_at: string;
  task?: Task;
}

export interface Sample {
  id?: number;
  task_id: number;
  proportion: number; // 10% rule
  notes?: string;
  approved: boolean;
  created_at: string;
  task?: Task;
}

// API Response 타입들
export interface KPIData {
  // Core KPIs
  rework_rate: number;
  context_switches_per_day: number;
  dod_adherence: number;
  sample_validation_rate: number;
  brief_completion_rate: number;
  
  // Additional metrics
  dod_definition_rate: number;
  avg_project_completion: number;
  
  // Counts
  total_projects: number;
  total_tasks: number;
  total_reviews: number;
  total_decisions: number;
  
  // Task state distribution
  task_states: {
    backlog: number;
    in_progress: number;
    done: number;
    paused: number;
    canceled: number;
  };
  
  // Recent activity (last 7 days)
  recent_tasks: number;
  recent_reviews: number;
  recent_decisions: number;
}

export interface Notification {
  id?: number;
  type: NotificationType;
  title: string;
  message: string;
  status: NotificationStatus;
  task_id?: number;
  project_id?: number;
  scheduled_for: string;
  sent_at?: string;
  read_at?: string;
  dismissed_at?: string;
  created_at: string;
}

export interface NotificationSettings {
  id?: number;
  due_date_reminder_days: number;
  enable_due_date_reminders: boolean;
  enable_missing_brief_alerts: boolean;
  enable_missing_dod_alerts: boolean;
  stale_task_days: number;
  enable_stale_task_alerts: boolean;
  enable_review_reminders: boolean;
  review_reminder_frequency_days: number;
}

export interface NotificationStats {
  pending: number;
  sent: number;
  read: number;
  dismissed: number;
  total: number;
}

export interface SearchResult {
  id: number;
  type: string;
  title: string;
  content: string;
  task_id?: number;
  project_id?: number;
  created_at: string;
  relevance_score: number;
}

export interface UnifiedSearchResponse {
  results: {
    projects?: SearchResult[];
    tasks?: SearchResult[];
    briefs?: SearchResult[];
    dod?: SearchResult[];
    decisions?: SearchResult[];
    reviews?: SearchResult[];
  };
  query: string;
  total_results: number;
}

export interface SimilarProject {
  id: number;
  name: string;
  description: string;
  similarity_score: number;
  created_at: string;
}

export interface DecisionPattern {
  id: number;
  problem: string;
  options: string;
  decision: string;
  risks: string;
  d_plus_7_review?: string;
  has_review: boolean;
  task_id: number;
  created_at: string;
  relevance_score: number;
}

export interface ContentSummary {
  projects: number;
  tasks: number;
  briefs: number;
  dod: number;
  decisions: number;
  reviews: number;
  total: number;
}

export enum TemplateCategory {
  WEB_DEVELOPMENT = "WEB_DEVELOPMENT",
  MOBILE_APP = "MOBILE_APP",
  DATA_ANALYSIS = "DATA_ANALYSIS",
  RESEARCH = "RESEARCH",
  MARKETING = "MARKETING",
  DESIGN = "DESIGN",
  INFRASTRUCTURE = "INFRASTRUCTURE",
  AUTOMATION = "AUTOMATION",
  CONTENT_CREATION = "CONTENT_CREATION",
  BUSINESS_STRATEGY = "BUSINESS_STRATEGY",
  GENERAL = "GENERAL"
}

export enum TemplateType {
  BRIEF = "BRIEF",
  DOD = "DOD",
  PROJECT = "PROJECT"
}

export interface Template {
  id: number;
  name: string;
  description?: string;
  category: TemplateCategory;
  template_type: TemplateType;
  content: Record<string, unknown>;
  is_system_template: boolean;
  is_ai_generated: boolean;
  usage_count: number;
  success_rate?: number;
  tags: string[];
  created_at: string;
  source_project_id?: number;
}

export interface TemplateRecommendation {
  template: Template;
  relevance_score: number;
  match_reasons: string[];
}

export interface BestPractice {
  id: number;
  title: string;
  description: string;
  category: TemplateCategory;
  principles: string[];
  do_list: string[];
  dont_list: string[];
  examples: string[];
  source: string;
  confidence_score: number;
  tags: string[];
  created_at: string;
}

export interface TemplateStats {
  total_templates: number;
  system_templates: number;
  ai_generated_templates: number;
  user_templates: number;
  category_distribution: Record<string, number>;
  most_used_templates: Array<{
    id: number;
    name: string;
    category: string;
    usage_count: number;
    success_rate?: number;
  }>;
}

// 협업 관련 타입들
export enum UserRole {
  OWNER = "OWNER",
  ADMIN = "ADMIN", 
  MEMBER = "MEMBER",
  VIEWER = "VIEWER"
}

export enum SharePermission {
  READ = "READ",
  WRITE = "WRITE",
  ADMIN = "ADMIN"
}

export enum InviteStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
  EXPIRED = "EXPIRED"
}

export enum ApprovalStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED"
}

export interface User {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  is_active: boolean;
  created_at: string;
}

export interface ProjectMember {
  user: User;
  role: UserRole;
  permissions: SharePermission;
  joined_at: string;
  is_owner: boolean;
}

export interface ProjectInvite {
  id: number;
  project_id: number;
  invited_by_id: number;
  invited_user_id?: number;
  invited_email?: string;
  role: UserRole;
  permissions: SharePermission;
  status: InviteStatus;
  invite_token: string;
  expires_at: string;
  created_at: string;
  responded_at?: string;
}

export interface ApprovalWorkflow {
  id: number;
  project_id: number;
  task_id?: number;
  decision_id?: number;
  title: string;
  description: string;
  requested_by_id: number;
  required_approvers: number;
  approver_user_ids: number[];
  status: ApprovalStatus;
  created_at: string;
  completed_at?: string;
}

export interface ApprovalResponse {
  id: number;
  workflow_id: number;
  approver: User;
  is_approved: boolean;
  comment?: string;
  created_at: string;
}

export interface TeamDecision {
  id: number;
  project_id: number;
  task_id?: number;
  title: string;
  description: string;
  options: string[];
  is_voting_enabled: boolean;
  voting_deadline?: string;
  allow_multiple_votes: boolean;
  is_concluded: boolean;
  final_decision?: string;
  decision_rationale?: string;
  created_by_id: number;
  created_at: string;
  concluded_at?: string;
}

export interface DecisionVote {
  id: number;
  decision_id: number;
  voter: User;
  selected_options: string[];
  reasoning?: string;
  created_at: string;
}

export interface DecisionComment {
  id: number;
  decision_id: number;
  author: User;
  content: string;
  parent_comment_id?: number;
  created_at: string;
}

export interface DecisionStats {
  total_votes: number;
  option_counts: Record<string, number>;
  participation_rate: number;
}

export interface UserWorkload {
  total_tasks: number;
  by_state: {
    BACKLOG: number;
    IN_PROGRESS: number;
    DONE: number;
    PAUSED: number;
    CANCELED: number;
  };
  overdue_tasks: number;
  high_priority_tasks: number;
}

// Error handling types
export interface ApiError {
  response?: {
    data?: {
      detail?: string;
    };
  };
}

// Form 타입들
export interface CreateProjectForm {
  name: string;
  description?: string;
}

export interface CreateTaskForm {
  project_id: number;
  title: string;
  priority: number;
  due_date?: string;
}

export interface UpdateTaskStateForm {
  state: TaskState;
}

export interface CreateBriefForm {
  task_id: number;
  purpose: string;
  success_criteria: string;
  constraints: string;
  priorities: string;
  validation_method: string;
}