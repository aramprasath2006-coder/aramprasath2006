import React, { useState, useEffect, useRef } from 'react';
import {
  Users2,
  Plus,
  Pencil,
  Trash2,
  Search,
  ShieldAlert,
  Building2,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
  X,
  Filter,
  GraduationCap,
  MoreVertical,
  Calendar,
  Clock,
  BookOpen,
} from 'lucide-react';
import { FacultyRecord, DepartmentRecord, FacultyDesignation, UserProfile, FacultyWorkloadDetail } from '../../types/rbac';
import { apiClient } from '../../api/client';
import { FacultySearchFilterBar, FacultyFilterState } from './FacultySearchFilterBar';

interface StaffManagementViewProps {
  currentUser: UserProfile;
  initialDepartmentId?: string;
  onFacultyModified?: () => void;
  onNavigateToDepartments?: () => void;
}

const DESIGNATION_OPTIONS: FacultyDesignation[] = [
  'Professor',
  'Associate Professor',
  'Assistant Professor',
  'Other Faculty Members',
];

export const StaffManagementView: React.FC<StaffManagementViewProps> = ({
  currentUser,
  initialDepartmentId,
  onFacultyModified,
  onNavigateToDepartments,
}) => {
  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);
  const [facultyList, setFacultyList] = useState<FacultyRecord[]>([]);
  const [filterState, setFilterState] = useState<FacultyFilterState>({
    searchQuery: '',
    departmentId: initialDepartmentId || 'all',
    designation: 'all',
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<FacultyRecord | null>(null);

  // Form fields
  const [fullName, setFullName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [designation, setDesignation] = useState<FacultyDesignation>('Assistant Professor');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete modal
  const [facultyToDelete, setFacultyToDelete] = useState<FacultyRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Context Menu & Row Dropdown state
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    faculty: FacultyRecord | null;
  }>({
    isOpen: false,
    x: 0,
    y: 0,
    faculty: null,
  });

  // Assign Workload Modal state
  const [workloadModalFaculty, setWorkloadModalFaculty] = useState<FacultyRecord | null>(null);
  const [workloadAssignedCourses, setWorkloadAssignedCourses] = useState<string>('');
  const [workloadTheoryHours, setWorkloadTheoryHours] = useState<number>(6);
  const [workloadLabHours, setWorkloadLabHours] = useState<number>(6);
  const [workloadProgressPercentage, setWorkloadProgressPercentage] = useState<number>(65);
  const [workloadProgressNotes, setWorkloadProgressNotes] = useState<string>('');
  const [savingWorkload, setSavingWorkload] = useState<boolean>(false);

  const canManage = currentUser.role === 'super_admin' || currentUser.role === 'admin';

  // Load departments and faculty
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [depts, facs] = await Promise.all([
        apiClient.getDepartments(),
        apiClient.getFaculty(),
      ]);
      setDepartments(depts);
      setFacultyList(facs);
      if (initialDepartmentId && depts.some((d) => d.id === initialDepartmentId)) {
        setFilterState((prev) => ({ ...prev, departmentId: initialDepartmentId }));
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load faculty information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (initialDepartmentId) {
      setFilterState((prev) => ({ ...prev, departmentId: initialDepartmentId }));
    }
  }, [initialDepartmentId]);

  // Compute faculty count per department for dropdown badge
  const departmentFacultyCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    facultyList.forEach((f) => {
      counts[f.departmentId] = (counts[f.departmentId] || 0) + 1;
    });
    return counts;
  }, [facultyList]);

  const handleOpenCreate = () => {
    if (departments.length === 0) {
      setError('Please register at least one Department before adding faculty members.');
      return;
    }
    setEditingFaculty(null);
    setFullName('');
    setEmployeeId('');
    setDesignation('Assistant Professor');
    setDepartmentId(
      filterState.departmentId !== 'all' ? filterState.departmentId : departments[0]?.id || ''
    );
    setEmail('');
    setContactNumber('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (fac: FacultyRecord) => {
    setEditingFaculty(fac);
    setFullName(fac.fullName);
    setEmployeeId(fac.employeeId);
    setDesignation(fac.designation);
    setDepartmentId(fac.departmentId);
    setEmail(fac.email || '');
    setContactNumber(fac.contactNumber || '');
    setFormError(null);
    setIsModalOpen(true);
    setActiveDropdownId(null);
    setContextMenu({ isOpen: false, x: 0, y: 0, faculty: null });
  };

  // Close context menu & dropdown on outside click or escape
  useEffect(() => {
    const handleGlobalClick = () => {
      setContextMenu((prev) => (prev.isOpen ? { ...prev, isOpen: false, faculty: null } : prev));
      setActiveDropdownId(null);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setContextMenu((prev) => (prev.isOpen ? { ...prev, isOpen: false, faculty: null } : prev));
        setActiveDropdownId(null);
      }
    };

    window.addEventListener('click', handleGlobalClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('click', handleGlobalClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleRowContextMenu = (e: React.MouseEvent, fac: FacultyRecord) => {
    if (!canManage) return;
    e.preventDefault();
    e.stopPropagation();
    const menuWidth = 200;
    const menuHeight = 160;
    const x = Math.min(e.clientX, window.innerWidth - menuWidth - 10);
    const y = Math.min(e.clientY, window.innerHeight - menuHeight - 10);
    setActiveDropdownId(null);
    setContextMenu({
      isOpen: true,
      x,
      y,
      faculty: fac,
    });
  };

  const handleOpenAssignWorkload = (fac: FacultyRecord) => {
    setContextMenu({ isOpen: false, x: 0, y: 0, faculty: null });
    setActiveDropdownId(null);
    setWorkloadModalFaculty(fac);
    setWorkloadAssignedCourses('');
    setWorkloadTheoryHours(6);
    setWorkloadLabHours(6);
    setWorkloadProgressPercentage(65);
    setWorkloadProgressNotes('Curriculum delivery on track; syllabus coverage verified.');
  };

  const handleSaveWorkload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workloadModalFaculty) return;
    setSavingWorkload(true);
    try {
      const th = Number(workloadTheoryHours) || 0;
      const lb = Number(workloadLabHours) || 0;
      const totalHours = th + lb;
      let complianceStatus: 'Optimal' | 'Overloaded' | 'Under Capacity' = 'Optimal';
      if (totalHours > 16) complianceStatus = 'Overloaded';
      else if (totalHours < 8) complianceStatus = 'Under Capacity';

      const workloadDetail: FacultyWorkloadDetail = {
        facultyId: workloadModalFaculty.id,
        facultyName: workloadModalFaculty.fullName,
        designation: workloadModalFaculty.designation,
        theoryHours: th,
        labHours: lb,
        totalHours,
        assignedCourses: workloadAssignedCourses.trim() || 'Core Subjects / Labs',
        progressPercentage: workloadProgressPercentage,
        progressNotes: workloadProgressNotes.trim() || 'Workload progress updated by Admin.',
        complianceStatus,
      };

      const reports = await apiClient.getWorkloadReports(workloadModalFaculty.departmentId);
      if (reports.length > 0) {
        const targetReport = reports[0];
        const existingDetails = targetReport.individualWorkloadDetails || [];
        const existingIdx = existingDetails.findIndex(
          (d) => d.facultyId === workloadModalFaculty.id || d.facultyName === workloadModalFaculty.fullName
        );
        let updatedDetails = [...existingDetails];
        if (existingIdx >= 0) {
          updatedDetails[existingIdx] = workloadDetail;
        } else {
          updatedDetails.push(workloadDetail);
        }

        const facultyNamesSet = new Set(targetReport.facultyNames || []);
        facultyNamesSet.add(workloadModalFaculty.fullName);
        const facultyNames = Array.from(facultyNamesSet);

        const avgProgress = Math.round(
          updatedDetails.reduce((sum, d) => sum + (d.progressPercentage || 0), 0) /
            (updatedDetails.length || 1)
        );

        await apiClient.updateWorkloadReport(targetReport.id, {
          individualWorkloadDetails: updatedDetails,
          facultyNames,
          facultyCount: facultyNames.length,
          workloadProgress: avgProgress,
        });
      } else {
        await apiClient.createWorkloadReport({
          reportTitle: `${workloadModalFaculty.departmentCode} – Workload Progress Report`,
          departmentId: workloadModalFaculty.departmentId,
          departmentName: workloadModalFaculty.departmentName,
          departmentCode: workloadModalFaculty.departmentCode,
          hodName: 'Head of Department',
          facultyCount: 1,
          facultyNames: [workloadModalFaculty.fullName],
          individualWorkloadDetails: [workloadDetail],
          workloadProgress: workloadProgressPercentage,
          progressStatus: 'In Progress',
          submissionDate: new Date().toISOString().slice(0, 10),
          academicYear: '2026–2027',
          semester: 'Even',
          submittedBy: currentUser.name,
        });
      }

      setSuccessMsg(
        `Workload successfully assigned for ${workloadModalFaculty.fullName} (${totalHours} hrs/wk, ${workloadProgressPercentage}% progress) and saved to department ledger.`
      );
      setWorkloadModalFaculty(null);
      if (onFacultyModified) onFacultyModified();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err?.message || 'Failed to assign workload.');
    } finally {
      setSavingWorkload(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) {
      setFormError('Access denied: Only Super Admin and Admin can add or edit faculty members.');
      return;
    }

    if (!fullName.trim()) {
      setFormError('Full Name is required.');
      return;
    }
    if (!employeeId.trim()) {
      setFormError('Employee ID is required.');
      return;
    }
    if (!departmentId) {
      setFormError('Department selection is required.');
      return;
    }

    const trimmedEmpId = employeeId.trim().toUpperCase();

    // Client-side uniqueness check
    const duplicate = facultyList.find(
      (f) =>
        f.employeeId.toUpperCase() === trimmedEmpId &&
        (!editingFaculty || f.id !== editingFaculty.id)
    );
    if (duplicate) {
      setFormError(`Employee ID "${trimmedEmpId}" is already assigned to ${duplicate.fullName}. Duplicate Employee IDs are not permitted.`);
      return;
    }

    setSubmitting(true);
    setFormError(null);

    const targetDept = departments.find((d) => d.id === departmentId);
    if (!targetDept) {
      setFormError('Invalid department selected.');
      setSubmitting(false);
      return;
    }

    try {
      if (editingFaculty) {
        const updated = await apiClient.updateFaculty(editingFaculty.id, {
          fullName: fullName.trim(),
          employeeId: trimmedEmpId,
          designation,
          departmentId: targetDept.id,
          departmentCode: targetDept.code,
          departmentName: targetDept.name,
          email: email.trim(),
          contactNumber: contactNumber.trim(),
        });
        setSuccessMsg(`Faculty record for ${updated.fullName} updated successfully.`);
      } else {
        const created = await apiClient.createFaculty({
          fullName: fullName.trim(),
          employeeId: trimmedEmpId,
          designation,
          departmentId: targetDept.id,
          departmentCode: targetDept.code,
          departmentName: targetDept.name,
          email: email.trim(),
          contactNumber: contactNumber.trim(),
        });
        setSuccessMsg(`Faculty ${created.fullName} (${created.employeeId}) registered under ${created.departmentCode} in permanent database.`);
      }

      setIsModalOpen(false);
      await loadData();
      if (onFacultyModified) onFacultyModified();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save faculty record.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!facultyToDelete) return;
    setDeleting(true);
    try {
      await apiClient.deleteFaculty(facultyToDelete.id);
      setSuccessMsg(`Faculty record for ${facultyToDelete.fullName} (${facultyToDelete.employeeId}) deleted permanently.`);
      setFacultyToDelete(null);
      await loadData();
      if (onFacultyModified) onFacultyModified();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err?.message || 'Failed to delete faculty member.');
    } finally {
      setDeleting(false);
    }
  };

  const filteredFaculty = facultyList.filter((f) => {
    const matchesDept =
      filterState.departmentId === 'all' || f.departmentId === filterState.departmentId;
    const matchesDesignation =
      filterState.designation === 'all' || f.designation === filterState.designation;
    const q = filterState.searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      f.fullName.toLowerCase().includes(q) ||
      f.employeeId.toLowerCase().includes(q) ||
      f.designation.toLowerCase().includes(q) ||
      f.departmentCode.toLowerCase().includes(q) ||
      f.departmentName.toLowerCase().includes(q) ||
      (f.email && f.email.toLowerCase().includes(q)) ||
      (f.contactNumber && f.contactNumber.includes(q));
    return matchesDept && matchesDesignation && matchesQuery;
  });

  const handleFilterChange = (updates: Partial<FacultyFilterState>) => {
    setFilterState((prev) => ({ ...prev, ...updates }));
  };

  const handleResetFilters = () => {
    setFilterState({
      searchQuery: '',
      departmentId: 'all',
      designation: 'all',
    });
  };

  return (
    <div className="space-y-5">
      {/* Top Banner / Role Notice */}
      {!canManage && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-start gap-3 shadow-2xs">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold text-amber-900">Read-Only Mode &bull; Normal User Access</p>
            <p className="mt-0.5 text-amber-700">
              Only Super Admin and Admin can register, edit, or delete faculty members. Normal users have view privileges.
            </p>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between text-xs shadow-2xs animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer font-bold"
          >
            &times;
          </button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-700 hover:text-rose-900 cursor-pointer font-bold">
            &times;
          </button>
        </div>
      )}

      {/* Action Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users2 className="w-5 h-5 text-blue-600" />
            <span>Staff &amp; Faculty Master Ledger</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manually register teaching faculty members under their assigned departments with unique Employee IDs.
          </p>
        </div>

        {/* Add Faculty Button */}
        {canManage && (
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Faculty Member</span>
          </button>
        )}
      </div>

      {/* Dedicated Search and Filter Component */}
      <FacultySearchFilterBar
        filterState={filterState}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        departments={departments}
        totalFacultyCount={facultyList.length}
        filteredFacultyCount={filteredFaculty.length}
        departmentFacultyCounts={departmentFacultyCounts}
      />

      {/* Faculty Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2" />
            <p>Loading faculty records from database...</p>
          </div>
        ) : filteredFaculty.length === 0 ? (
          <div className="p-12 text-center">
            <Users2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700">No Registered Faculty Records Found</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              {departments.length === 0 ? (
                <>
                  No departments have been registered yet. Please register a department first before adding staff members.
                </>
              ) : facultyList.length === 0 ? (
                'All fake sample staff names have been removed. Use the button below to manually register faculty members.'
              ) : (
                <>
                  No faculty members match your search &ldquo;{filterState.searchQuery || filterState.designation}&rdquo;.
                </>
              )}
            </p>
            {facultyList.length > 0 && (
              <div className="mt-3">
                <button
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
                >
                  Clear Search &amp; Reset Filters
                </button>
              </div>
            )}
            {canManage && (
              <div className="mt-4 flex items-center justify-center gap-3">
                {departments.length === 0 && onNavigateToDepartments ? (
                  <button
                    onClick={onNavigateToDepartments}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Register Department First</span>
                  </button>
                ) : (
                  <button
                    onClick={handleOpenCreate}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Register First Faculty Member</span>
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Emp ID</th>
                  <th className="py-3 px-4">Faculty Name</th>
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFaculty.map((fac) => {
                  const isDropdownOpen = activeDropdownId === fac.id;
                  return (
                    <tr
                      key={fac.id}
                      onContextMenu={(e) => handleRowContextMenu(e, fac)}
                      className="hover:bg-slate-50/80 transition-colors group cursor-default"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                          {fac.employeeId}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-black text-[10px] flex items-center justify-center shrink-0">
                            {fac.fullName.charAt(0)}
                          </div>
                          <div>
                            <span className="group-hover:text-blue-700 transition-colors">{fac.fullName}</span>
                            <div className="text-[10px] text-slate-400 font-normal">
                              Added: {fac.createdAt ? new Date(fac.createdAt).toLocaleDateString() : 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            fac.designation === 'Professor'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : fac.designation === 'Associate Professor'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : fac.designation === 'Assistant Professor'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {fac.designation}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <span className="px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-mono text-[10px] font-black">
                            {fac.departmentCode}
                          </span>
                          <span className="text-slate-600 truncate max-w-xs">{fac.departmentName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 space-y-0.5">
                        {fac.email && (
                          <div className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span className="truncate max-w-xs">{fac.email}</span>
                          </div>
                        )}
                        {fac.contactNumber && (
                          <div className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{fac.contactNumber}</span>
                          </div>
                        )}
                        {!fac.email && !fac.contactNumber && (
                          <span className="text-slate-400 italic">No contact details</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {canManage ? (
                          <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveDropdownId(isDropdownOpen ? null : fac.id);
                                setContextMenu({ isOpen: false, x: 0, y: 0, faculty: null });
                              }}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                isDropdownOpen
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                              }`}
                              title="Staff Context Menu"
                            >
                              <span className="text-[11px]">Actions</span>
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>

                            {/* Dropdown Context Menu */}
                            {isDropdownOpen && (
                              <div
                                className="absolute right-0 mt-1 w-48 rounded-xl bg-white shadow-xl border border-slate-200 z-30 py-1 text-xs divide-y divide-slate-100 animate-scale-in"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="px-3 py-1.5 bg-slate-50 rounded-t-xl text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center justify-between">
                                  <span>{fac.employeeId}</span>
                                  <span className="text-[9px] font-normal font-mono">Options</span>
                                </div>

                                <div className="py-1">
                                  {/* 1. Edit Profile */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveDropdownId(null);
                                      handleOpenEdit(fac);
                                    }}
                                    className="w-full text-left px-3 py-2 text-slate-700 hover:bg-blue-50 hover:text-blue-700 font-semibold flex items-center gap-2 cursor-pointer transition-colors"
                                  >
                                    <Pencil className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                    <span>Edit Profile</span>
                                  </button>

                                  {/* 2. Assign Workload */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveDropdownId(null);
                                      handleOpenAssignWorkload(fac);
                                    }}
                                    className="w-full text-left px-3 py-2 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 font-semibold flex items-center gap-2 cursor-pointer transition-colors"
                                  >
                                    <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                    <span>Assign Workload</span>
                                  </button>
                                </div>

                                <div className="py-1">
                                  {/* 3. Delete Staff */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveDropdownId(null);
                                      setFacultyToDelete(fac);
                                    }}
                                    className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 font-semibold flex items-center gap-2 cursor-pointer transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                    <span>Delete Staff</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-semibold">Read-only</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Faculty Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-[#0a192f] to-[#1e3a8a] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users2 className="w-5 h-5 text-blue-300" />
                <h3 className="text-sm font-black tracking-tight">
                  {editingFaculty ? 'Edit Faculty Record' : 'Manually Add Faculty Member'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-300 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Department Dropdown */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">
                  Assigned Department <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="" disabled>Select Department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.code} – {d.name} (HOD: {d.hodName || 'None'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Full Name & Employee ID */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="font-bold text-slate-700">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. K. Ramesh or Mrs. S. Priya"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">
                    Employee ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. KVCET-042"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono font-bold uppercase focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <span className="text-[10px] text-slate-400 block">Must be unique</span>
                </div>
              </div>

              {/* Designation */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">
                  Designation <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value as FacultyDesignation)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {DESIGNATION_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Email & Contact Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="faculty@kvcet.edu.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Saving to Database...' : editingFaculty ? 'Update Faculty' : 'Save Faculty'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {facultyToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 text-xs space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 rounded-full bg-rose-50 border border-rose-200">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900">Delete Faculty Member?</h4>
                <p className="text-[11px] text-slate-500">This action removes the record from master database.</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="font-bold text-slate-800">{facultyToDelete.fullName}</div>
              <div className="text-[11px] text-slate-600">
                Employee ID: <span className="font-mono font-bold">{facultyToDelete.employeeId}</span> &bull; {facultyToDelete.designation}
              </div>
              <div className="text-[11px] text-blue-700 font-semibold">
                Department: {facultyToDelete.departmentName} ({facultyToDelete.departmentCode})
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setFacultyToDelete(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Right-Click Context Menu (opens anywhere user right-clicks on a staff row) */}
      {canManage && contextMenu.isOpen && contextMenu.faculty && (
        <div
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          className="fixed z-50 w-52 rounded-xl bg-white shadow-2xl border border-slate-200 py-1 text-xs divide-y divide-slate-100 animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1.5 bg-slate-50 rounded-t-xl">
            <p className="font-bold text-slate-800 truncate">{contextMenu.faculty.fullName}</p>
            <p className="text-[10px] text-slate-400 font-mono">
              {contextMenu.faculty.employeeId} &bull; {contextMenu.faculty.designation}
            </p>
          </div>

          <div className="py-1">
            {/* 1. Edit Profile */}
            <button
              type="button"
              onClick={() => {
                const target = contextMenu.faculty;
                setContextMenu({ isOpen: false, x: 0, y: 0, faculty: null });
                if (target) handleOpenEdit(target);
              }}
              className="w-full text-left px-3 py-2 text-slate-700 hover:bg-blue-50 hover:text-blue-700 font-semibold flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Pencil className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Edit Profile</span>
            </button>

            {/* 2. Assign Workload */}
            <button
              type="button"
              onClick={() => {
                const target = contextMenu.faculty;
                setContextMenu({ isOpen: false, x: 0, y: 0, faculty: null });
                if (target) handleOpenAssignWorkload(target);
              }}
              className="w-full text-left px-3 py-2 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 font-semibold flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>Assign Workload</span>
            </button>
          </div>

          <div className="py-1">
            {/* 3. Delete Staff */}
            <button
              type="button"
              onClick={() => {
                const target = contextMenu.faculty;
                setContextMenu({ isOpen: false, x: 0, y: 0, faculty: null });
                if (target) setFacultyToDelete(target);
              }}
              className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 font-semibold flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span>Delete Staff</span>
            </button>
          </div>
        </div>
      )}

      {/* Dedicated Assign Workload Modal */}
      {workloadModalFaculty && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-[#0a192f] to-[#1e3a8a] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-5 h-5 text-blue-300" />
                <div>
                  <h3 className="text-sm font-black tracking-tight">Assign Faculty Workload</h3>
                  <p className="text-[10px] text-blue-200 font-mono">
                    {workloadModalFaculty.fullName} &bull; {workloadModalFaculty.employeeId}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWorkloadModalFaculty(null)}
                className="text-slate-300 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveWorkload} className="p-6 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900 text-xs">{workloadModalFaculty.fullName}</div>
                <div className="text-[11px] text-slate-500">
                  Role: <strong className="text-slate-700">{workloadModalFaculty.designation}</strong> &bull; Dept: <strong className="text-blue-700">{workloadModalFaculty.departmentName} ({workloadModalFaculty.departmentCode})</strong>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">
                  Assigned Courses / Subject Codes <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CS25401 Distributed Systems, CS25402 Cloud Lab"
                  value={workloadAssignedCourses}
                  onChange={(e) => setWorkloadAssignedCourses(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Theory Hours (L+T)</label>
                  <input
                    type="number"
                    min={0}
                    max={30}
                    value={workloadTheoryHours}
                    onChange={(e) => setWorkloadTheoryHours(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Lab Hours (P)</label>
                  <input
                    type="number"
                    min={0}
                    max={30}
                    value={workloadLabHours}
                    onChange={(e) => setWorkloadLabHours(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-blue-900 block">Total Weekly Contact Load</span>
                  <span className="text-[10px] text-blue-700">
                    AICTE/NBA prescribed standard: 12-16 hrs/week
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-base font-mono font-black text-blue-800">
                    {Number(workloadTheoryHours || 0) + Number(workloadLabHours || 0)} hrs/wk
                  </span>
                  <span
                    className={`block text-[9px] font-black uppercase font-mono mt-0.5 ${
                      Number(workloadTheoryHours || 0) + Number(workloadLabHours || 0) > 16
                        ? 'text-rose-600'
                        : Number(workloadTheoryHours || 0) + Number(workloadLabHours || 0) < 8
                        ? 'text-amber-600'
                        : 'text-emerald-600'
                    }`}
                  >
                    {Number(workloadTheoryHours || 0) + Number(workloadLabHours || 0) > 16
                      ? '● Overloaded'
                      : Number(workloadTheoryHours || 0) + Number(workloadLabHours || 0) < 8
                      ? '● Under Capacity'
                      : '● Optimal Load'}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700">Syllabus Delivery Progress</label>
                  <span className="font-mono font-black text-blue-700 text-xs">
                    {workloadProgressPercentage}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={workloadProgressPercentage}
                  onChange={(e) => setWorkloadProgressPercentage(parseInt(e.target.value) || 0)}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Progress Remarks / Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Unit 3 completed, practical internal test conducted."
                  value={workloadProgressNotes}
                  onChange={(e) => setWorkloadProgressNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setWorkloadModalFaculty(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingWorkload}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {savingWorkload ? 'Saving to Database...' : 'Save Workload Allocation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
