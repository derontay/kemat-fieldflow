export type ProjectStatus = "planning" | "active" | "on_hold" | "complete";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskStatus = "not_started" | "in_progress" | "blocked" | "done";

export interface Organization {
  id: string;
  name: string;
  slug: string;
}

export interface Project {
  id: string;
  organization_id: string;
  name: string;
  address: string | null;
  status: ProjectStatus;
  start_date: string | null;
  target_completion_date: string | null;
  planned_budget: number;
  actual_spend: number;
  notes: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  organization_id: string;
  project_id: string;
  assignee_id: string | null;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  created_at: string;
}

export interface TaskTemplate {
  id: string;
  organization_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface TaskTemplateItem {
  id: string;
  organization_id: string;
  template_id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface FieldUpdate {
  id: string;
  organization_id: string;
  project_id: string;
  created_by: string | null;
  title: string;
  description: string | null;
  created_at: string;
}

export interface Expense {
  id: string;
  organization_id: string;
  project_id: string;
  vendor_id: string | null;
  category: string;
  amount: number;
  expense_date: string;
  notes: string | null;
  created_at: string;
}

export interface Vendor {
  id: string;
  organization_id: string;
  name: string;
  trade: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  created_at: string;
}

export type SavedViewType = "tasks" | "expenses";

export interface SavedViewQueryState {
  filter?: string;
  sort?: string;
  q?: string;
  projectId?: string;
  vendorId?: string;
  category?: string;
}

export interface SavedView {
  id: string;
  organization_id: string;
  user_id: string | null;
  name: string;
  type: SavedViewType;
  is_pinned: boolean;
  is_default: boolean;
  query_state: SavedViewQueryState;
  created_at: string;
}

export interface TaskSavedViewShortcut {
  key: "due_today" | "overdue" | "blocked";
  baseName: string;
  name: string;
  description: string;
  filter: string;
  sort: string;
  href: string;
  fallbackHref: string;
  matchedView: SavedView | null;
  label: "Open saved view" | "Open command view";
}

export interface ExpenseSavedViewShortcut {
  key: "recent" | "with_vendor" | "high_cost";
  baseName: string;
  name: string;
  description: string;
  filter: string;
  sort: string;
  href: string;
  fallbackHref: string;
  matchedView: SavedView | null;
  label: "Open saved view" | "Open command view";
}

export interface PinnedSavedViewLink {
  id: string;
  type: SavedViewType;
  name: string;
  href: string;
  is_default: boolean;
  scope: "personal" | "team";
}
