import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getAllFaculty,
  getFacultyById,
  createFaculty,
  updateFaculty,
  deleteFaculty,
  getAllWorkloadReports,
  getWorkloadReportById,
  createWorkloadReport,
  updateWorkloadReport,
  deleteWorkloadReport,
  getAdminStats,
} from './server/db.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ======================= CORS & SECURITY HEADERS =======================
// Support AI Studio preview environment iframes, reverse proxies, and preflight OPTIONS
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-user-role, x-user-name, x-user-email'
  );
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(express.json());

// ======================= RBAC AUTH & PERMISSION MIDDLEWARE =======================

interface AuthRequest extends Request {
  userRole?: 'super_admin' | 'admin' | 'user';
  userName?: string;
  userEmail?: string;
}

const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  // Read role from header or fallback to current session
  const roleHeader = req.headers['x-user-role'] as string;
  if (roleHeader === 'super_admin' || roleHeader === 'admin' || roleHeader === 'user') {
    req.userRole = roleHeader;
  } else {
    // Default session role: super_admin in local dev environment
    req.userRole = 'super_admin';
  }
  req.userName = (req.headers['x-user-name'] as string) || 'Administrator';
  req.userEmail = (req.headers['x-user-email'] as string) || 'admin@kvcet.edu.in';
  next();
};

const requireAdminOrSuperAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.userRole !== 'super_admin' && req.userRole !== 'admin') {
    return res.status(403).json({
      error: 'Permission Denied: Only Super Admin and Admin can add, edit, or delete department and staff records.',
      requiredRoles: ['super_admin', 'admin'],
      currentRole: req.userRole,
    });
  }
  next();
};

app.use('/api', authMiddleware);

// ======================= API ROUTES =======================

// 1. Auth info endpoint
app.get('/api/auth/me', (req: AuthRequest, res: Response) => {
  res.json({
    role: req.userRole,
    name: req.userName,
    email: req.userEmail,
    canManageMasterRecords: req.userRole === 'super_admin' || req.userRole === 'admin',
  });
});

// 2. Admin Dashboard Stats
app.get('/api/admin/stats', (req: Request, res: Response) => {
  try {
    const stats = getAdminStats();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch admin stats' });
  }
});

// 3. Departments Endpoints
app.get('/api/departments', (req: Request, res: Response) => {
  try {
    const depts = getAllDepartments();
    res.json(depts);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/departments/:id', (req: Request, res: Response) => {
  try {
    const dept = getDepartmentById(req.params.id);
    if (!dept) return res.status(404).json({ error: 'Department not found' });
    res.json(dept);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/departments', requireAdminOrSuperAdmin, (req: AuthRequest, res: Response) => {
  try {
    const created = createDepartment(req.body);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/departments/:id', requireAdminOrSuperAdmin, (req: AuthRequest, res: Response) => {
  try {
    const updated = updateDepartment(req.params.id, req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/departments/:id', requireAdminOrSuperAdmin, (req: AuthRequest, res: Response) => {
  try {
    const result = deleteDepartment(req.params.id);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 4. Faculty Endpoints
app.get('/api/faculty', (req: Request, res: Response) => {
  try {
    const departmentId = req.query.departmentId as string | undefined;
    const list = getAllFaculty(departmentId);
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/faculty/:id', (req: Request, res: Response) => {
  try {
    const faculty = getFacultyById(req.params.id);
    if (!faculty) return res.status(404).json({ error: 'Faculty member not found' });
    res.json(faculty);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/faculty', requireAdminOrSuperAdmin, (req: AuthRequest, res: Response) => {
  try {
    const created = createFaculty(req.body);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/faculty/:id', requireAdminOrSuperAdmin, (req: AuthRequest, res: Response) => {
  try {
    const updated = updateFaculty(req.params.id, req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/faculty/:id', requireAdminOrSuperAdmin, (req: AuthRequest, res: Response) => {
  try {
    const success = deleteFaculty(req.params.id);
    res.json({ success });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 5. Workload Progress Reports Endpoints
app.get('/api/workload-reports', (req: Request, res: Response) => {
  try {
    const departmentId = req.query.departmentId as string | undefined;
    const reports = getAllWorkloadReports(departmentId);
    res.json(reports);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/workload-reports/:id', (req: Request, res: Response) => {
  try {
    const report = getWorkloadReportById(req.params.id);
    if (!report) return res.status(404).json({ error: 'Workload report not found' });
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/workload-reports', (req: AuthRequest, res: Response) => {
  try {
    const reportData = {
      ...req.body,
      submittedBy: req.body.submittedBy || req.userName || 'Administrator',
    };
    const created = createWorkloadReport(reportData);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/workload-reports/:id', (req: AuthRequest, res: Response) => {
  try {
    const updated = updateWorkloadReport(req.params.id, req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/workload-reports/:id', requireAdminOrSuperAdmin, (req: AuthRequest, res: Response) => {
  try {
    const success = deleteWorkloadReport(req.params.id);
    res.json({ success });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ======================= VITE & STATIC HANDLING =======================

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';
  const PORT = Number(process.env.PORT) || 3000;

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[KVCET Workload Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
});
