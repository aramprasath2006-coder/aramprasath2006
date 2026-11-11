export type CourseCategory = 'Theory' | 'LIT' | 'Lab' | 'Other';

export type ValidationStatus = 'MATCH' | 'REVIEW' | 'MISMATCH';

export interface AllocationRecord {
  id: string;
  department: string;
  sem: string; // e.g. "IV", "VI", "VIII"
  reg: string; // e.g. "2025", "2021"
  code: string;
  name: string;
  faculty: string;
  credits: number | null;
  type: CourseCategory;
  L: number | null; // Lecture periods
  T: number | null; // Tutorial periods
  P: number | null; // Practical periods
  planL?: number | null;
  planT?: number | null;
  planP?: number | null;
  syllabusCredits: number | null;
  source: string;
  status: ValidationStatus;
  note: string;
}

export interface WorkspaceConfig {
  institution: string; // "Karpaga Vinayaga Deemed to be University"
  institutionShort: string; // "KVCET / KVELL"
  department: string; // "Civil Engineering" or "All Departments"
  year: string; // "2026–2027"
  label: string; // "Institutional Workload Intelligence"
  campusAddress: string;
  approvalHead: string;
}

export interface SyllabusItem {
  code: string;
  name: string;
  reg: string;
  sem?: string;
  credits: number | null;
  L: number | null;
  T: number | null;
  P: number | null;
  type: CourseCategory;
}

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

export interface TimetableEntry {
  id: string;
  day: DayOfWeek;
  period: number; // 1 to 7
  timeString: string;
  courseCode: string;
  courseName: string;
  facultyName: string;
  department: string;
  roomOrLab: string;
  sem: string;
}

export interface FacultyStats {
  department: string;
  facultyName: string;
  totalCourses: number;
  theoryCoursesCount: number; // Theory + LIT
  labCoursesCount: number;
  otherCoursesCount: number;
  totalCredits: number;
  lecturePeriods: number; // L
  tutorialPeriods: number; // T
  practicalPeriods: number; // P
  theoryContactPeriods: number; // L + T
  totalContactPeriods: number; // L + T + P
  incompleteRows: number;
  reviewFlags: number;
  prescribedLimit: number;
  loadPercentage: number;
  loadStatus: 'compliant' | 'overloaded' | 'underloaded';
  loadDeviation: number;
  coursesList: AllocationRecord[];
}
