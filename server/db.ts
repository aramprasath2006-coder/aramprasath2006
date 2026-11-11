import fs from 'fs';
import path from 'path';
import {
  DepartmentRecord,
  FacultyRecord,
  WorkloadProgressReport,
  AdminDashboardStats,
} from '../src/types/rbac';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'workload_db.json');

interface DatabaseSchema {
  departments: DepartmentRecord[];
  faculty: FacultyRecord[];
  workloadReports: WorkloadProgressReport[];
  version: number;
}

function ensureDbFile(): DatabaseSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const initial: DatabaseSchema = {
        departments: [],
        faculty: [],
        workloadReports: [],
        version: 1,
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      departments: Array.isArray(parsed.departments) ? parsed.departments : [],
      faculty: Array.isArray(parsed.faculty) ? parsed.faculty : [],
      workloadReports: Array.isArray(parsed.workloadReports) ? parsed.workloadReports : [],
      version: parsed.version || 1,
    };
  } catch (err) {
    console.error('Error reading workload_db.json, recreating clean state', err);
    return {
      departments: [],
      faculty: [],
      workloadReports: [],
      version: 1,
    };
  }
}

function writeDbFile(db: DatabaseSchema): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing to workload_db.json', err);
    throw new Error('Database persistence write failure');
  }
}

// ======================= DEPARTMENTS =======================

export function getAllDepartments(): DepartmentRecord[] {
  const db = ensureDbFile();
  return db.departments;
}

export function getDepartmentById(id: string): DepartmentRecord | undefined {
  const db = ensureDbFile();
  return db.departments.find((d) => d.id === id);
}

export function createDepartment(
  data: Omit<DepartmentRecord, 'id' | 'createdAt' | 'updatedAt'>
): DepartmentRecord {
  const db = ensureDbFile();
  const trimmedCode = data.code.trim().toUpperCase();
  const trimmedName = data.name.trim();

  // Validate required
  if (!trimmedName || !trimmedCode) {
    throw new Error('Department name and code are required.');
  }

  // Check unique code
  const existing = db.departments.find(
    (d) => d.code.toUpperCase() === trimmedCode
  );
  if (existing) {
    throw new Error(`Department code "${trimmedCode}" already exists. Each department must have a unique code.`);
  }

  const now = new Date().toISOString();
  const newDept: DepartmentRecord = {
    id: `dept-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: trimmedName,
    code: trimmedCode,
    hodName: data.hodName?.trim() || '',
    hodEmployeeId: data.hodEmployeeId?.trim() || '',
    hodDesignation: data.hodDesignation?.trim() || 'Professor & Head',
    description: data.description?.trim() || '',
    createdAt: now,
    updatedAt: now,
  };

  db.departments.push(newDept);
  writeDbFile(db);
  return newDept;
}

export function updateDepartment(
  id: string,
  data: Partial<Omit<DepartmentRecord, 'id' | 'createdAt'>>
): DepartmentRecord {
  const db = ensureDbFile();
  const idx = db.departments.findIndex((d) => d.id === id);
  if (idx === -1) {
    throw new Error('Department not found.');
  }

  // If code is changing, check unique
  if (data.code) {
    const trimmedCode = data.code.trim().toUpperCase();
    const conflict = db.departments.find(
      (d) => d.id !== id && d.code.toUpperCase() === trimmedCode
    );
    if (conflict) {
      throw new Error(`Department code "${trimmedCode}" is already in use by another department.`);
    }
    data.code = trimmedCode;
  }

  const updated: DepartmentRecord = {
    ...db.departments[idx],
    ...data,
    updatedAt: new Date().toISOString(),
  };

  db.departments[idx] = updated;

  // If department name or code changed, cascade update to faculty
  if (data.name || data.code) {
    db.faculty = db.faculty.map((f) => {
      if (f.departmentId === id) {
        return {
          ...f,
          departmentCode: updated.code,
          departmentName: updated.name,
          updatedAt: new Date().toISOString(),
        };
      }
      return f;
    });
  }

  writeDbFile(db);
  return updated;
}

export function deleteDepartment(id: string): { success: boolean; deletedFacultyCount: number } {
  const db = ensureDbFile();
  const idx = db.departments.findIndex((d) => d.id === id);
  if (idx === -1) {
    throw new Error('Department not found.');
  }

  // Count related faculty
  const relatedFaculty = db.faculty.filter((f) => f.departmentId === id);
  // Delete department
  db.departments.splice(idx, 1);
  // Also delete faculty in that department to maintain referential integrity
  db.faculty = db.faculty.filter((f) => f.departmentId !== id);

  writeDbFile(db);
  return { success: true, deletedFacultyCount: relatedFaculty.length };
}

// ======================= FACULTY =======================

export function getAllFaculty(departmentId?: string): FacultyRecord[] {
  const db = ensureDbFile();
  if (departmentId) {
    return db.faculty.filter((f) => f.departmentId === departmentId);
  }
  return db.faculty;
}

export function getFacultyById(id: string): FacultyRecord | undefined {
  const db = ensureDbFile();
  return db.faculty.find((f) => f.id === id);
}

export function createFaculty(
  data: Omit<FacultyRecord, 'id' | 'createdAt' | 'updatedAt'>
): FacultyRecord {
  const db = ensureDbFile();
  const trimmedEmpId = data.employeeId.trim().toUpperCase();
  const trimmedName = data.fullName.trim();

  if (!trimmedName || !trimmedEmpId || !data.departmentId) {
    throw new Error('Full name, Employee ID, and Department are required.');
  }

  // Enforce unique Employee ID across the entire institution
  const existingEmp = db.faculty.find(
    (f) => f.employeeId.toUpperCase() === trimmedEmpId
  );
  if (existingEmp) {
    throw new Error(`Employee ID "${trimmedEmpId}" already belongs to ${existingEmp.fullName}. Duplicate Employee IDs are not permitted.`);
  }

  // Ensure department exists
  const dept = db.departments.find((d) => d.id === data.departmentId);
  if (!dept) {
    throw new Error('Selected department does not exist in master records.');
  }

  const now = new Date().toISOString();
  const newFaculty: FacultyRecord = {
    id: `fac-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    fullName: trimmedName,
    employeeId: trimmedEmpId,
    designation: data.designation || 'Assistant Professor',
    departmentId: dept.id,
    departmentCode: dept.code,
    departmentName: dept.name,
    email: data.email?.trim() || '',
    contactNumber: data.contactNumber?.trim() || '',
    createdAt: now,
    updatedAt: now,
  };

  db.faculty.push(newFaculty);
  writeDbFile(db);
  return newFaculty;
}

export function updateFaculty(
  id: string,
  data: Partial<Omit<FacultyRecord, 'id' | 'createdAt'>>
): FacultyRecord {
  const db = ensureDbFile();
  const idx = db.faculty.findIndex((f) => f.id === id);
  if (idx === -1) {
    throw new Error('Faculty member not found.');
  }

  // If employeeId is changing, ensure unique
  if (data.employeeId) {
    const trimmedEmpId = data.employeeId.trim().toUpperCase();
    const conflict = db.faculty.find(
      (f) => f.id !== id && f.employeeId.toUpperCase() === trimmedEmpId
    );
    if (conflict) {
      throw new Error(`Employee ID "${trimmedEmpId}" is already used by ${conflict.fullName}.`);
    }
    data.employeeId = trimmedEmpId;
  }

  // If departmentId is changing, update cached departmentName and departmentCode
  let deptCode = db.faculty[idx].departmentCode;
  let deptName = db.faculty[idx].departmentName;
  if (data.departmentId && data.departmentId !== db.faculty[idx].departmentId) {
    const dept = db.departments.find((d) => d.id === data.departmentId);
    if (!dept) throw new Error('Selected department does not exist.');
    deptCode = dept.code;
    deptName = dept.name;
  }

  const updated: FacultyRecord = {
    ...db.faculty[idx],
    ...data,
    departmentCode: deptCode,
    departmentName: deptName,
    updatedAt: new Date().toISOString(),
  };

  db.faculty[idx] = updated;
  writeDbFile(db);
  return updated;
}

export function deleteFaculty(id: string): boolean {
  const db = ensureDbFile();
  const idx = db.faculty.findIndex((f) => f.id === id);
  if (idx === -1) {
    throw new Error('Faculty member not found.');
  }
  db.faculty.splice(idx, 1);
  writeDbFile(db);
  return true;
}

// ======================= WORKLOAD PROGRESS REPORTS =======================

export function getAllWorkloadReports(departmentId?: string): WorkloadProgressReport[] {
  const db = ensureDbFile();
  if (departmentId) {
    return db.workloadReports.filter((r) => r.departmentId === departmentId);
  }
  return db.workloadReports.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getWorkloadReportById(id: string): WorkloadProgressReport | undefined {
  const db = ensureDbFile();
  return db.workloadReports.find((r) => r.id === id);
}

export function createWorkloadReport(
  data: Omit<WorkloadProgressReport, 'id' | 'createdAt' | 'updatedAt'>
): WorkloadProgressReport {
  const db = ensureDbFile();

  if (!data.departmentName || !data.hodName) {
    throw new Error('Department name and HOD name are required for a workload report.');
  }

  const now = new Date().toISOString();
  const newReport: WorkloadProgressReport = {
    id: `rep-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    reportTitle: data.reportTitle?.trim() || `${data.departmentName} Workload Progress Report`,
    departmentId: data.departmentId,
    departmentName: data.departmentName,
    departmentCode: data.departmentCode,
    hodName: data.hodName,
    facultyCount: data.facultyNames?.length || 0,
    facultyNames: data.facultyNames || [],
    individualWorkloadDetails: data.individualWorkloadDetails || [],
    workloadProgress: Math.min(100, Math.max(0, Number(data.workloadProgress) || 0)),
    progressStatus: data.progressStatus || 'Pending',
    submissionDate: data.submissionDate || now.slice(0, 10),
    academicYear: data.academicYear || '2026–2027',
    semester: data.semester || 'Odd',
    submittedBy: data.submittedBy || 'Administrator',
    createdAt: now,
    updatedAt: now,
  };

  db.workloadReports.unshift(newReport);
  writeDbFile(db);
  return newReport;
}

export function updateWorkloadReport(
  id: string,
  data: Partial<Omit<WorkloadProgressReport, 'id' | 'createdAt'>>
): WorkloadProgressReport {
  const db = ensureDbFile();
  const idx = db.workloadReports.findIndex((r) => r.id === id);
  if (idx === -1) {
    throw new Error('Workload report not found.');
  }

  const updated: WorkloadProgressReport = {
    ...db.workloadReports[idx],
    ...data,
    updatedAt: new Date().toISOString(),
  };

  db.workloadReports[idx] = updated;
  writeDbFile(db);
  return updated;
}

export function deleteWorkloadReport(id: string): boolean {
  const db = ensureDbFile();
  const idx = db.workloadReports.findIndex((r) => r.id === id);
  if (idx === -1) {
    throw new Error('Workload report not found.');
  }
  db.workloadReports.splice(idx, 1);
  writeDbFile(db);
  return true;
}

// ======================= ADMIN DASHBOARD METRICS =======================

export function getAdminStats(): AdminDashboardStats {
  const db = ensureDbFile();

  const totalDepartments = db.departments.length;
  // HOD count: distinct departments with HOD assigned
  const totalHods = db.departments.filter(
    (d) => d.hodName && d.hodName.trim().length > 0
  ).length;

  const totalFaculty = db.faculty.length;

  // Department-wise faculty count
  const departmentWiseFacultyCount = db.departments.map((d) => {
    const count = db.faculty.filter((f) => f.departmentId === d.id).length;
    return {
      departmentId: d.id,
      departmentName: d.name,
      departmentCode: d.code,
      count,
    };
  });

  const totalWorkloadReports = db.workloadReports.length;
  const completedWorkloadReports = db.workloadReports.filter(
    (r) => r.progressStatus === 'Completed'
  ).length;
  const pendingWorkloadReports = db.workloadReports.filter(
    (r) => r.progressStatus === 'Pending'
  ).length;
  const inProgressWorkloadReports = db.workloadReports.filter(
    (r) => r.progressStatus === 'In Progress'
  ).length;

  return {
    totalDepartments,
    totalHods,
    totalFaculty,
    departmentWiseFacultyCount,
    totalWorkloadReports,
    completedWorkloadReports,
    pendingWorkloadReports,
    inProgressWorkloadReports,
  };
}
