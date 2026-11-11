export type ActivityType =
  | 'bulk_assign'
  | 'add_course'
  | 'delete_course'
  | 'bulk_delete'
  | 'import_csv'
  | 'load_curriculum'
  | 'edit_course'
  | 'register_dept'
  | 'add_staff'
  | 'create_report'
  | 'undo';

export interface AppActivity {
  id: string;
  type: ActivityType;
  title: string; // e.g. "Bulk Assign", "Added Course", "Imported CSV"
  description: string;
  timestamp: string; // ISO date string
  actor?: string; // e.g. "Super Admin" or user name
  badgeColor?: string;
}
