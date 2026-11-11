import {
  UserProfile,
  UserRole,
  DepartmentRecord,
  FacultyRecord,
  WorkloadProgressReport,
  AdminDashboardStats,
} from '../types/rbac';

const CURRENT_USER_KEY = 'kvcet_current_user_v1';

export const DEFAULT_USERS: UserProfile[] = [
  {
    id: 'u-superadmin',
    name: 'Dr. Principal (Super Admin)',
    email: 'superadmin@kvcet.edu.in',
    role: 'super_admin',
    roleLabel: 'Super Admin',
  },
  {
    id: 'u-admin',
    name: 'Academic Dean / Admin',
    email: 'admin@kvcet.edu.in',
    role: 'admin',
    roleLabel: 'Admin',
  },
  {
    id: 'u-normal',
    name: 'Faculty Staff User',
    email: 'faculty.user@kvcet.edu.in',
    role: 'user',
    roleLabel: 'Normal User',
  },
];

export function getStoredUser(): UserProfile {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // fallback
  }
  return DEFAULT_USERS[0]; // Super Admin by default
}

export function setStoredUser(user: UserProfile): void {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}

function getAuthHeaders(): HeadersInit {
  const user = getStoredUser();
  return {
    'Content-Type': 'application/json',
    'x-user-role': user.role,
    'x-user-name': user.name,
    'x-user-email': user.email,
  };
}

const CACHE_PREFIX = 'kvcet_api_cache_';

function getCacheKey(endpoint: string): string {
  const clean = endpoint.split('?')[0].replace(/[^a-zA-Z0-9]/g, '_');
  return `${CACHE_PREFIX}${clean}`;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const isGet = !options.method || options.method.toUpperCase() === 'GET';
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {}),
  };

  let lastError: any = null;
  const maxAttempts = 3;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch(endpoint, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let errorMsg = `Server error ${response.status}`;
        try {
          const errJson = await response.json();
          errorMsg = errJson.error || errorMsg;
        } catch {
          // not json
        }
        throw new Error(errorMsg);
      }

      const data: T = await response.json();

      // Cache successful GET responses in localStorage for seamless resilience
      if (isGet && data) {
        try {
          localStorage.setItem(getCacheKey(endpoint), JSON.stringify(data));
        } catch {
          // ignore localStorage quota errors
        }
      }

      return data;
    } catch (err: any) {
      lastError = err;
      if (attempt < maxAttempts - 1) {
        await new Promise((res) => setTimeout(res, 300 * (attempt + 1)));
      }
    }
  }

  // Graceful fallback from cache for GET requests when network or server is briefly restarting
  if (isGet) {
    try {
      const cached = localStorage.getItem(getCacheKey(endpoint));
      if (cached) {
        return JSON.parse(cached) as T;
      }
    } catch {
      // ignore
    }

    // Default empty fallbacks for primary GET endpoints
    if (endpoint.includes('/api/admin/stats')) {
      return {
        totalDepartments: 0,
        totalHods: 0,
        totalFaculty: 0,
        departmentWiseFacultyCount: [],
        totalWorkloadReports: 0,
        completedWorkloadReports: 0,
        pendingWorkloadReports: 0,
        inProgressWorkloadReports: 0,
      } as unknown as T;
    }

    if (
      endpoint.includes('/api/departments') ||
      endpoint.includes('/api/faculty') ||
      endpoint.includes('/api/workload-reports')
    ) {
      return [] as unknown as T;
    }
  }

  throw lastError || new Error(`Failed to fetch ${endpoint}`);
}

// ======================= API CLIENT METHODS =======================

export const apiClient = {
  // Stats
  async getAdminStats(): Promise<AdminDashboardStats> {
    return request<AdminDashboardStats>('/api/admin/stats');
  },

  // Departments
  async getDepartments(): Promise<DepartmentRecord[]> {
    return request<DepartmentRecord[]>('/api/departments');
  },

  async createDepartment(
    dept: Omit<DepartmentRecord, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<DepartmentRecord> {
    return request<DepartmentRecord>('/api/departments', {
      method: 'POST',
      body: JSON.stringify(dept),
    });
  },

  async updateDepartment(
    id: string,
    updates: Partial<Omit<DepartmentRecord, 'id' | 'createdAt'>>
  ): Promise<DepartmentRecord> {
    return request<DepartmentRecord>(`/api/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteDepartment(id: string): Promise<{ success: boolean; deletedFacultyCount: number }> {
    return request<{ success: boolean; deletedFacultyCount: number }>(`/api/departments/${id}`, {
      method: 'DELETE',
    });
  },

  // Faculty
  async getFaculty(departmentId?: string): Promise<FacultyRecord[]> {
    const url = departmentId ? `/api/faculty?departmentId=${encodeURIComponent(departmentId)}` : '/api/faculty';
    return request<FacultyRecord[]>(url);
  },

  async createFaculty(
    faculty: Omit<FacultyRecord, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<FacultyRecord> {
    return request<FacultyRecord>('/api/faculty', {
      method: 'POST',
      body: JSON.stringify(faculty),
    });
  },

  async updateFaculty(
    id: string,
    updates: Partial<Omit<FacultyRecord, 'id' | 'createdAt'>>
  ): Promise<FacultyRecord> {
    return request<FacultyRecord>(`/api/faculty/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteFaculty(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/api/faculty/${id}`, {
      method: 'DELETE',
    });
  },

  // Workload Progress Reports
  async getWorkloadReports(departmentId?: string): Promise<WorkloadProgressReport[]> {
    const url = departmentId
      ? `/api/workload-reports?departmentId=${encodeURIComponent(departmentId)}`
      : '/api/workload-reports';
    return request<WorkloadProgressReport[]>(url);
  },

  async createWorkloadReport(
    report: Omit<WorkloadProgressReport, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<WorkloadProgressReport> {
    return request<WorkloadProgressReport>('/api/workload-reports', {
      method: 'POST',
      body: JSON.stringify(report),
    });
  },

  async updateWorkloadReport(
    id: string,
    updates: Partial<Omit<WorkloadProgressReport, 'id' | 'createdAt'>>
  ): Promise<WorkloadProgressReport> {
    return request<WorkloadProgressReport>(`/api/workload-reports/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteWorkloadReport(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/api/workload-reports/${id}`, {
      method: 'DELETE',
    });
  },
};
