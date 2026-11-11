import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  FileCheck2,
  Users,
  Layers,
  FileSpreadsheet,
  Calendar,
  Upload,
  Settings,
  Printer,
  RotateCcw,
  Download,
  Menu,
  X,
  Building2,
  Users2,
  PlusCircle,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { AllocationRecord, WorkspaceConfig, TimetableEntry } from './types/workload';
import { UserProfile, DepartmentRecord } from './types/rbac';
import {
  initialWorkspaceConfig,
  initialKvcetAllocations,
  initialTimetableEntries,
  demoSyllabusAllocations,
} from './data/kvcetData';
import { apiClient, getStoredUser } from './api/client';
import { KvellLogo } from './components/KvellLogo';
import { OverviewPage } from './components/kvcet/OverviewPage';
import { AnalysisPage } from './components/kvcet/AnalysisPage';
import { FacultyPage } from './components/kvcet/FacultyPage';
import { TheoryGroupsPage } from './components/kvcet/TheoryGroupsPage';
import { SubjectRegisterPage } from './components/kvcet/SubjectRegisterPage';
import { TimetablePage } from './components/kvcet/TimetablePage';
import { UploadSourcesPage } from './components/kvcet/UploadSourcesPage';
import { SettingsPage } from './components/kvcet/SettingsPage';
import { PrintStatementModal } from './components/kvcet/PrintStatementModal';
import { RoleSelector } from './components/rbac/RoleSelector';
import { DepartmentManagementView } from './components/rbac/DepartmentManagementView';
import { StaffManagementView } from './components/rbac/StaffManagementView';
import { WorkloadWorkflowModal } from './components/rbac/WorkloadWorkflowModal';
import { WorkloadReportsView } from './components/rbac/WorkloadReportsView';
import { logAppActivity } from './utils/activityTracker';

const STORAGE_KEY = 'kvcet_workload_intelligence_v5';

export default function App() {
  const [activePage, setActivePage] = useState<string>('overview');
  const [data, setData] = useState<AllocationRecord[]>([]);
  const [workspace, setWorkspace] = useState<WorkspaceConfig>(initialWorkspaceConfig);
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>(initialTimetableEntries);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [saveStatus, setSaveStatus] = useState<string>('DATABASE SYNCED');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // RBAC & Workflow State
  const [currentUser, setCurrentUser] = useState<UserProfile>(getStoredUser());
  const [registeredDepartments, setRegisteredDepartments] = useState<DepartmentRecord[]>([]);
  const [selectedStaffDeptId, setSelectedStaffDeptId] = useState<string | undefined>(undefined);
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState<boolean>(false);
  const [statsRefreshKey, setStatsRefreshKey] = useState<number>(0);

  // Fetch registered departments from permanent DB
  const loadRegisteredDepartments = async () => {
    try {
      const depts = await apiClient.getDepartments();
      setRegisteredDepartments(depts);
      if (depts.length > 0 && (!workspace.department || workspace.department === 'Civil Engineering' || workspace.department === 'Academic Directorate')) {
        setWorkspace((prev) => ({
          ...prev,
          department: `${depts[0].code} – ${depts[0].name}`,
        }));
      }
    } catch (e) {
      console.error('Failed to load registered departments', e);
    }
  };

  useEffect(() => {
    loadRegisteredDepartments();
  }, [statsRefreshKey]);

  // Initialize and load saved state from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.data)) {
          setData(parsed.data);
          if (parsed.workspace) setWorkspace(parsed.workspace);
          if (parsed.timetableEntries) setTimetableEntries(parsed.timetableEntries);
          return;
        }
      }
    } catch (e) {
      console.error('Failed to load local state', e);
    }
    // Clean initial starter without fake hardcoded staff
    setData(initialKvcetAllocations);
    setWorkspace(initialWorkspaceConfig);
    setTimetableEntries(initialTimetableEntries);
  }, []);

  // Save changes to localStorage
  const saveState = (
    nextData: AllocationRecord[],
    nextWorkspace: WorkspaceConfig,
    nextTimetable: TimetableEntry[]
  ) => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          version: 5,
          savedAt: new Date().toISOString(),
          data: nextData,
          workspace: nextWorkspace,
          timetableEntries: nextTimetable,
        })
      );
      setSaveStatus('SAVED LOCALLY');
    } catch (e) {
      setSaveStatus('STORAGE FULL');
    }
  };

  const pushUndo = () => {
    setUndoStack((prev) => [
      ...prev.slice(-20),
      JSON.stringify({ data, workspace, timetableEntries }),
    ]);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) {
      alert('No recent actions to undo in this session.');
      return;
    }
    const last = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    try {
      const parsed = JSON.parse(last);
      setData(parsed.data);
      setWorkspace(parsed.workspace);
      setTimetableEntries(parsed.timetableEntries);
      saveState(parsed.data, parsed.workspace, parsed.timetableEntries);
      logAppActivity('undo', 'Undo Action', 'Reverted previous register modification', currentUser.name);
    } catch (e) {
      console.error('Failed to undo', e);
    }
  };

  // Row update in Subject Register
  const handleUpdateRow = (index: number, key: keyof AllocationRecord, value: any) => {
    pushUndo();
    const updated = [...data];
    updated[index] = {
      ...updated[index],
      [key]: value,
      status: 'REVIEW',
      note: 'Manually edited; recheck against source curriculum.',
    };
    setData(updated);
    saveState(updated, workspace, timetableEntries);
  };

  const handleRemoveRow = (index: number) => {
    pushUndo();
    const target = data[index];
    const updated = data.filter((_, i) => i !== index);
    setData(updated);
    saveState(updated, workspace, timetableEntries);
    logAppActivity(
      'delete_course',
      'Removed Course',
      `Removed allocation: ${target?.code ? target.code + ' – ' : ''}${target?.name || 'Subject'}`,
      currentUser.name
    );
  };

  const handleBulkAssignFaculty = (selectedIds: string[], facultyName: string) => {
    pushUndo();
    const idSet = new Set(selectedIds);
    const updated = data.map((item) =>
      idSet.has(item.id)
        ? {
            ...item,
            faculty: facultyName,
            status: 'REVIEW' as const,
            note: `Bulk assigned to ${facultyName}.`,
          }
        : item
    );
    setData(updated);
    saveState(updated, workspace, timetableEntries);
    logAppActivity(
      'bulk_assign',
      'Bulk Assign',
      `Assigned faculty "${facultyName}" to ${selectedIds.length} course allocations`,
      currentUser.name
    );
  };

  const handleBulkDelete = (selectedIds: string[]) => {
    pushUndo();
    const idSet = new Set(selectedIds);
    const updated = data.filter((item) => !idSet.has(item.id));
    setData(updated);
    saveState(updated, workspace, timetableEntries);
    logAppActivity(
      'bulk_delete',
      'Bulk Delete',
      `Deleted ${selectedIds.length} course allocations from register`,
      currentUser.name
    );
  };

  const handleAddRow = () => {
    pushUndo();
    const newRecord: AllocationRecord = {
      id: `alloc-${Date.now()}`,
      department: workspace.department || 'Computer Science and Engineering',
      sem: 'IV',
      reg: '2025',
      code: '',
      name: 'New Academic Subject',
      faculty: 'Faculty to Assign',
      credits: 3,
      type: 'Theory',
      L: 3,
      T: 0,
      P: 0,
      syllabusCredits: 3,
      source: 'Manual Entry',
      status: 'REVIEW',
      note: 'Newly added allocation: cross-check with syllabus catalogue.',
    };
    const updated = [newRecord, ...data];
    setData(updated);
    saveState(updated, workspace, timetableEntries);
    logAppActivity(
      'add_course',
      'Added Course',
      'Created new course allocation record in register',
      currentUser.name
    );
  };

  const handleImportRecords = (newRecords: AllocationRecord[]) => {
    pushUndo();
    const updated = [...newRecords, ...data];
    setData(updated);
    saveState(updated, workspace, timetableEntries);
    logAppActivity(
      'import_csv',
      'Imported CSV',
      `Imported ${newRecords.length} curriculum allocation records from file`,
      currentUser.name
    );
  };

  const handleLoadCivilDemo = () => {
    if (window.confirm('Load sample curriculum demonstration courses (Syllabus reference codes)?')) {
      pushUndo();
      setData(demoSyllabusAllocations);
      setWorkspace((prev) => ({ ...prev, department: 'Civil Engineering' }));
      saveState(demoSyllabusAllocations, { ...workspace, department: 'Civil Engineering' }, timetableEntries);
      logAppActivity(
        'load_curriculum',
        'Loaded Curriculum',
        'Loaded Civil Engineering demonstration curriculum',
        currentUser.name
      );
    }
  };

  const handleUpdateWorkspace = (updated: Partial<WorkspaceConfig>) => {
    pushUndo();
    const next = { ...workspace, ...updated };
    setWorkspace(next);
    saveState(data, next, timetableEntries);
  };

  const handleExportBackup = () => {
    const payload = {
      app: 'KVCET Institutional Workload Intelligence',
      institution: 'Karpaga Vinayaga Deemed to be University',
      exportedAt: new Date().toISOString(),
      workspace,
      data,
      timetableEntries,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kvcet_workload_backup_${workspace.department.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRestoreBackup = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        if (Array.isArray(parsed.data)) {
          pushUndo();
          setData(parsed.data);
          if (parsed.workspace) setWorkspace(parsed.workspace);
          if (parsed.timetableEntries) setTimetableEntries(parsed.timetableEntries);
          saveState(parsed.data, parsed.workspace || workspace, parsed.timetableEntries || timetableEntries);
          alert('Backup restored successfully!');
        } else {
          alert('Invalid backup file format.');
        }
      } catch (err) {
        alert('Could not parse backup file.');
      }
    };
    reader.readAsText(file);
  };

  const handleClearWorkspace = () => {
    if (window.confirm('Clear all allocation records from local browser session? (Master DB departments & staff will remain safe in permanent database).')) {
      pushUndo();
      setData([]);
      localStorage.removeItem(STORAGE_KEY);
      saveState([], workspace, timetableEntries);
    }
  };

  const handleAddTimetableEntry = (entry: Omit<TimetableEntry, 'id'>) => {
    const newEntry: TimetableEntry = {
      ...entry,
      id: `tt-${Date.now()}`,
    };
    const updated = [...timetableEntries, newEntry];
    setTimetableEntries(updated);
    saveState(data, workspace, updated);
  };

  const handleDeleteTimetableEntry = (id: string) => {
    const updated = timetableEntries.filter((e) => e.id !== id);
    setTimetableEntries(updated);
    saveState(data, workspace, updated);
  };

  // Callback after department modified
  const handleDeptModified = () => {
    setStatsRefreshKey((k) => k + 1);
    loadRegisteredDepartments();
  };

  // Callback after faculty modified
  const handleFacultyModified = () => {
    setStatsRefreshKey((k) => k + 1);
  };

  // Navigation Items
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'departments', label: 'Department Management', icon: Building2 },
    { id: 'staff', label: 'Staff & Faculty', icon: Users2 },
    { id: 'reports', label: 'Workload Reports', icon: FileSpreadsheet },
    { id: 'analysis', label: 'Workload Analysis', icon: FileCheck2 },
    { id: 'faculty', label: 'Faculty Workload', icon: Users },
    { id: 'theorygroups', label: 'Theory Allocation Lists', icon: Layers },
    { id: 'subjects', label: 'Subject Register', icon: FileSpreadsheet },
    { id: 'timetable', label: 'Weekly Timetable', icon: Calendar },
    { id: 'sources', label: 'Upload & Sources', icon: Upload },
    { id: 'settings', label: 'Rules & Settings', icon: Settings },
  ];

  const pageTitles: Record<string, string> = {
    overview: 'Institutional Workload Overview',
    departments: 'Academic Department Management',
    staff: 'Staff & Faculty Master Directory',
    reports: 'Department Workload Progress Reports',
    analysis: 'Workload Analysis & Validation Engine',
    faculty: 'Faculty-Wise Workload Ledger',
    theorygroups: 'Faculty Grouped by Theory Papers',
    subjects: 'Subject Allocation Register',
    timetable: 'Master Weekly Contact Schedule',
    sources: 'Document Intake & Syllabi Upload',
    settings: 'Rules, Policies & University Settings',
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-800 flex font-sans antialiased">
      {/* Sidebar Desktop */}
      <aside className="no-print hidden lg:flex flex-col w-64 bg-[#0a192f] text-slate-200 border-r border-slate-800/80 sticky top-0 h-screen shrink-0 z-30">
        {/* Brand Lockup */}
        <div className="p-5 border-b border-slate-800/80">
          <KvellLogo variant="compact" />
        </div>

        {/* Dynamic Department Quick Switcher */}
        <div className="p-3 mx-3 my-2 bg-slate-900/80 rounded-xl border border-slate-800/90 text-xs">
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Active Department:
            </label>
            <span className="text-[9px] font-mono text-blue-400 font-bold">
              {registeredDepartments.length} Registered
            </span>
          </div>

          <select
            value={workspace.department}
            onChange={(e) => handleUpdateWorkspace({ department: e.target.value })}
            className="w-full bg-[#112240] text-slate-200 font-bold border border-slate-700/60 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer"
          >
            {registeredDepartments.length === 0 ? (
              <option value="No Registered Departments">No Registered Depts (Add in Dept Mgr)</option>
            ) : (
              registeredDepartments.map((dept) => (
                <option key={dept.id} value={`${dept.code} – ${dept.name}`}>
                  {dept.code} – {dept.name}
                </option>
              ))
            )}
            <option value="All Departments">All Departments (Institutional)</option>
          </select>
        </div>

        {/* Navigation Links */}
        <div className="p-3 flex-1 overflow-y-auto space-y-1">
          <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 px-3 py-1">
            WORKSPACE NAVIGATION
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer with Live DB indicator */}
        <div className="p-4 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
          <div className="font-bold text-slate-200 uppercase tracking-wide">
            {workspace.institutionShort}
          </div>
          <div className="text-[10px]">Academic Year {workspace.year}</div>
          <div className="text-[9px] text-emerald-400 font-mono mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Permanent Database Engine Active</span>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-20 shadow-2xs">
          <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
            {/* Left: Mobile Toggle & Page Title */}
            <div className="flex items-center space-x-3 min-w-0">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600 block leading-none font-mono">
                  ACADEMIC OPERATIONS &bull; {workspace.department}
                </span>
                <h1 className="text-base sm:text-lg font-black text-slate-900 truncate tracking-tight">
                  {pageTitles[activePage] || 'Workload Intelligence'}
                </h1>
              </div>
            </div>

            {/* Right: Actions & Role Switcher */}
            <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
              {/* College Logo Lockup */}
              <div className="hidden xl:block pr-2 border-r border-slate-200">
                <KvellLogo variant="horizontal-sm" />
              </div>

              {/* RBAC Role Selector Dropdown */}
              <RoleSelector
                currentUser={currentUser}
                onUserChange={(newUser) => setCurrentUser(newUser)}
              />

              {/* Quick Launch Workflow Button */}
              {(currentUser.role === 'super_admin' || currentUser.role === 'admin') && (
                <button
                  onClick={() => setIsWorkflowModalOpen(true)}
                  className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
                  title="Run 6-Step Department Workload Progress Workflow"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>New Report</span>
                </button>
              )}

              {/* Print Statement Button */}
              <button
                onClick={() => setIsPrintModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white shadow-xs transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Statement</span>
                <span className="sm:hidden">Print</span>
              </button>
            </div>
          </div>

          {/* Mobile Navigation Drawer */}
          {isMobileMenuOpen && (
            <div className="lg:hidden border-t border-slate-200 bg-slate-900 text-white p-4 space-y-2">
              <div className="pb-2 border-b border-slate-800 flex items-center justify-between">
                <KvellLogo variant="compact" />
                <RoleSelector
                  currentUser={currentUser}
                  onUserChange={(newUser) => setCurrentUser(newUser)}
                />
              </div>
              <div className="grid grid-cols-2 gap-1 pt-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activePage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActivePage(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-bold ${
                        isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {activePage === 'overview' && (
            <OverviewPage
              data={data}
              workspace={workspace}
              onNavigate={setActivePage}
              onOpenPrint={() => setIsPrintModalOpen(true)}
              currentUser={currentUser}
              onOpenCreateReport={() => setIsWorkflowModalOpen(true)}
              onOpenAddDept={() => setActivePage('departments')}
              refreshTrigger={statsRefreshKey}
            />
          )}

          {activePage === 'departments' && (
            <DepartmentManagementView
              currentUser={currentUser}
              onDepartmentModified={handleDeptModified}
              onNavigateToStaff={(deptId) => {
                setSelectedStaffDeptId(deptId);
                setActivePage('staff');
              }}
            />
          )}

          {activePage === 'staff' && (
            <StaffManagementView
              currentUser={currentUser}
              initialDepartmentId={selectedStaffDeptId}
              onFacultyModified={handleFacultyModified}
              onNavigateToDepartments={() => setActivePage('departments')}
            />
          )}

          {activePage === 'reports' && (
            <WorkloadReportsView
              currentUser={currentUser}
              onOpenCreateModal={() => setIsWorkflowModalOpen(true)}
              refreshTrigger={statsRefreshKey}
            />
          )}

          {activePage === 'analysis' && (
            <AnalysisPage data={data} onLoadCivilDemo={handleLoadCivilDemo} />
          )}

          {activePage === 'faculty' && <FacultyPage data={data} />}

          {activePage === 'theorygroups' && <TheoryGroupsPage data={data} />}

          {activePage === 'subjects' && (
            <SubjectRegisterPage
              data={data}
              onUpdateRow={handleUpdateRow}
              onRemoveRow={handleRemoveRow}
              onAddRow={handleAddRow}
              onBulkAssignFaculty={handleBulkAssignFaculty}
              onBulkDelete={handleBulkDelete}
            />
          )}

          {activePage === 'timetable' && (
            <TimetablePage
              entries={timetableEntries}
              allocations={data}
              onAddEntry={handleAddTimetableEntry}
              onDeleteEntry={handleDeleteTimetableEntry}
            />
          )}

          {activePage === 'sources' && (
            <UploadSourcesPage
              onImportRecords={handleImportRecords}
              onLoadCivilDemo={handleLoadCivilDemo}
            />
          )}

          {activePage === 'settings' && (
            <SettingsPage
              workspace={workspace}
              onUpdateWorkspace={handleUpdateWorkspace}
              onExportBackup={handleExportBackup}
              onRestoreBackup={handleRestoreBackup}
              onClearWorkspace={handleClearWorkspace}
              allocationsCount={data.length}
            />
          )}

          {/* Footer */}
          <footer className="no-print pt-8 pb-4 text-center text-xs text-slate-500 border-t border-slate-200 mt-12 space-y-1">
            <div className="flex items-center justify-center gap-2 font-bold text-slate-700">
              <span>{workspace.institution}</span>
              <span>&bull;</span>
              <span>KVCET &bull; KVELL Academic Operations</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Role-Based Department, Staff &amp; Workload Intelligence System &bull; Permanent Database Persistence &bull; AY {workspace.year}
            </p>
          </footer>
        </main>
      </div>

      {/* Official Print Statement Modal */}
      <PrintStatementModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        data={data}
        workspace={workspace}
      />

      {/* 6-Step Department Workload Progress Workflow Modal */}
      <WorkloadWorkflowModal
        isOpen={isWorkflowModalOpen}
        onClose={() => setIsWorkflowModalOpen(false)}
        currentUser={currentUser}
        onReportSaved={(newReport) => {
          setStatsRefreshKey((k) => k + 1);
          setActivePage('reports');
        }}
      />
    </div>
  );
}
