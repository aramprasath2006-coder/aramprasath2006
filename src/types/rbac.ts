export type UserRole = 'super_admin' | 'admin' | 'user';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleLabel: string;
  department?: string;
}

export interface DepartmentRecord {
  id: string;
  name: string; // e.g. "Computer Science and Engineering"
  code: string; // e.g. "CSE" (Unique)
  hodName: string; // e.g. "Dr. M. Shanmugasundaram"
  hodEmployeeId: string; // e.g. "KVCET-HOD-01"
  hodDesignation: string; // e.g. "Professor & Head"
  description: string;
  createdAt: string;
  updatedAt: string;
}

export type FacultyDesignation =
  | 'Professor'
  | 'Associate Professor'
  | 'Assistant Professor'
  | 'Other Faculty Members';

export interface FacultyRecord {
  id: string;
  fullName: string;
  employeeId: string; // Unique
  designation: FacultyDesignation;
  departmentId: string; // Foreign key to Department
  departmentCode: string;
  departmentName: string;
  email: string;
  contactNumber: string;
  createdAt: string;
  updatedAt: string;
}

export interface FacultyWorkloadDetail {
  facultyId?: string;
  facultyName: string;
  designation: string;
  theoryHours: number; // L + T
  labHours: number; // P
  totalHours: number; // L + T + P
  assignedCourses: string;
  progressPercentage: number; // 0 - 100%
  progressNotes: string;
  complianceStatus: 'Optimal' | 'Overloaded' | 'Under Capacity';
}

export interface WorkloadProgressReport {
  id: string;
  reportTitle: string;
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  hodName: string;
  facultyCount: number;
  facultyNames: string[];
  individualWorkloadDetails: FacultyWorkloadDetail[];
  workloadProgress: number; // 0 - 100%
  progressStatus: 'Pending' | 'In Progress' | 'Completed';
  submissionDate: string; // YYYY-MM-DD
  academicYear: string;
  semester: string;
  submittedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminDashboardStats {
  totalDepartments: number;
  totalHods: number;
  totalFaculty: number;
  departmentWiseFacultyCount: Array<{
    departmentId: string;
    departmentName: string;
    departmentCode: string;
    count: number;
  }>;
  totalWorkloadReports: number;
  completedWorkloadReports: number;
  pendingWorkloadReports: number;
  inProgressWorkloadReports: number;
}
