import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  Search,
  ShieldAlert,
  GraduationCap,
  Users,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
} from 'lucide-react';
import { DepartmentRecord, UserProfile } from '../../types/rbac';
import { apiClient } from '../../api/client';

interface DepartmentManagementViewProps {
  currentUser: UserProfile;
  onDepartmentModified?: () => void;
  onNavigateToStaff?: (deptId: string) => void;
  autoOpenAdd?: boolean;
  onCloseAutoOpenAdd?: () => void;
}

export const DepartmentManagementView: React.FC<DepartmentManagementViewProps> = ({
  currentUser,
  onDepartmentModified,
  onNavigateToStaff,
  autoOpenAdd = false,
  onCloseAutoOpenAdd,
}) => {
  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(autoOpenAdd);
  const [editingDept, setEditingDept] = useState<DepartmentRecord | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [hodName, setHodName] = useState('');
  const [hodEmployeeId, setHodEmployeeId] = useState('');
  const [hodDesignation, setHodDesignation] = useState('Professor & Head');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete confirm modal
  const [deptToDelete, setDeptToDelete] = useState<DepartmentRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const canManage = currentUser.role === 'super_admin' || currentUser.role === 'admin';

  const fetchDepartments = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await apiClient.getDepartments();
      setDepartments(list);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (autoOpenAdd) {
      handleOpenCreate();
      if (onCloseAutoOpenAdd) onCloseAutoOpenAdd();
    }
  }, [autoOpenAdd]);

  const handleOpenCreate = () => {
    setEditingDept(null);
    setName('');
    setCode('');
    setHodName('');
    setHodEmployeeId('');
    setHodDesignation('Professor & Head');
    setDescription('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (dept: DepartmentRecord) => {
    setEditingDept(dept);
    setName(dept.name);
    setCode(dept.code);
    setHodName(dept.hodName);
    setHodEmployeeId(dept.hodEmployeeId);
    setHodDesignation(dept.hodDesignation || 'Professor & Head');
    setDescription(dept.description);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) {
      setFormError('Access denied: Only Super Admin and Admin can register or modify departments.');
      return;
    }

    if (!name.trim()) {
      setFormError('Department Name is required.');
      return;
    }
    if (!code.trim()) {
      setFormError('Department Code is required.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      if (editingDept) {
        // Update
        const updated = await apiClient.updateDepartment(editingDept.id, {
          name: name.trim(),
          code: code.trim().toUpperCase(),
          hodName: hodName.trim(),
          hodEmployeeId: hodEmployeeId.trim().toUpperCase(),
          hodDesignation: hodDesignation.trim(),
          description: description.trim(),
        });
        setSuccessMsg(`Department "${updated.name}" updated successfully.`);
      } else {
        // Create
        const created = await apiClient.createDepartment({
          name: name.trim(),
          code: code.trim().toUpperCase(),
          hodName: hodName.trim(),
          hodEmployeeId: hodEmployeeId.trim().toUpperCase(),
          hodDesignation: hodDesignation.trim(),
          description: description.trim(),
        });
        setSuccessMsg(`Department "${created.name}" (${created.code}) registered successfully in permanent database.`);
      }

      setIsModalOpen(false);
      await fetchDepartments();
      if (onDepartmentModified) onDepartmentModified();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save department.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deptToDelete) return;
    setDeleting(true);
    try {
      const res = await apiClient.deleteDepartment(deptToDelete.id);
      setSuccessMsg(
        `Department "${deptToDelete.name}" deleted permanently${
          res.deletedFacultyCount > 0 ? ` (along with ${res.deletedFacultyCount} associated faculty)` : ''
        }.`
      );
      setDeptToDelete(null);
      await fetchDepartments();
      if (onDepartmentModified) onDepartmentModified();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err?.message || 'Failed to delete department.');
    } finally {
      setDeleting(false);
    }
  };

  const filteredDepts = departments.filter((d) => {
    const q = searchQuery.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      d.code.toLowerCase().includes(q) ||
      d.hodName.toLowerCase().includes(q) ||
      d.hodEmployeeId.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Role Notice */}
      {!canManage && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-start gap-3 shadow-2xs">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold text-amber-900">Read-Only Mode &bull; Normal User Access</p>
            <p className="mt-0.5 text-amber-700">
              You are signed in as a Normal User. Only Super Admin and Admin users have permission to create, edit, or delete department master records. Use the role switcher in the top right header to simulate an Admin session.
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

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            <span>Academic Department Management</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manually register and maintain academic departments, assigned HODs, and departmental profiles.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search departments, codes, HODs..."
              className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 w-56 sm:w-64"
            />
          </div>

          {/* Add Dept Button */}
          {canManage && (
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Department</span>
            </button>
          )}
        </div>
      </div>

      {/* Departments Table / Cards */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2" />
            <p>Loading registered departments from database...</p>
          </div>
        ) : filteredDepts.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700">No Registered Departments Found</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              {departments.length === 0
                ? 'All fake sample departments have been removed. Use the button below to manually register the first department (e.g. CSE, ECE, EEE, MECH, CIVIL).'
                : 'No departments match your current search query.'}
            </p>
            {canManage && departments.length === 0 && (
              <button
                onClick={handleOpenCreate}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Register First Department</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Department Name</th>
                  <th className="py-3 px-4">Head of Department (HOD)</th>
                  <th className="py-3 px-4">HOD Emp ID</th>
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDepts.map((dept) => (
                  <tr key={dept.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-black text-blue-700">
                      <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200">
                        {dept.code}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <div>{dept.name}</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        Registered: {dept.createdAt ? new Date(dept.createdAt).toLocaleDateString() : 'N/A'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {dept.hodName ? (
                        <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                          <GraduationCap className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>{dept.hodName}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Not Assigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {dept.hodEmployeeId || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {dept.hodDesignation || 'Professor & Head'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate" title={dept.description}>
                      {dept.description || '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {onNavigateToStaff && (
                          <button
                            onClick={() => onNavigateToStaff(dept.id)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                            title="Manage Faculty in this Department"
                          >
                            <Users className="w-3.5 h-3.5 text-slate-500" />
                            <span>Staff</span>
                          </button>
                        )}

                        {canManage && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(dept)}
                              className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50 cursor-pointer transition-colors"
                              title="Edit Department"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeptToDelete(dept)}
                              className="p-1 rounded text-slate-500 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                              title="Delete Department"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Department Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-[#0a192f] to-[#1e3a8a] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-300" />
                <h3 className="text-sm font-black tracking-tight">
                  {editingDept ? 'Edit Department Information' : 'Manually Register Department'}
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="font-bold text-slate-700">
                    Department Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Computer Science and Engineering"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">
                    Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CSE"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono font-bold uppercase focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* HOD Details */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                  <GraduationCap className="w-4 h-4 text-blue-600" />
                  <span>Head of Department (HOD) Details</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-600 text-[11px]">
                      HOD Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. M. Shanmugasundaram"
                      value={hodName}
                      onChange={(e) => setHodName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-600 text-[11px]">
                      HOD Employee ID
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. KVCET-HOD-01"
                      value={hodEmployeeId}
                      onChange={(e) => setHodEmployeeId(e.target.value.toUpperCase())}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-600 text-[11px]">
                    HOD Designation
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Professor & Head of Department"
                    value={hodDesignation}
                    onChange={(e) => setHodDesignation(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Department Description */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">
                  Department Description / Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional brief description of department scope, labs, academic programs..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
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
                  {submitting ? 'Saving to Database...' : editingDept ? 'Update Department' : 'Save Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deptToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 text-xs space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 rounded-full bg-rose-50 border border-rose-200">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900">Delete Department Permanently?</h4>
                <p className="text-[11px] text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="font-bold text-slate-800">{deptToDelete.name} ({deptToDelete.code})</div>
              {deptToDelete.hodName && (
                <div className="text-[11px] text-slate-500">HOD: {deptToDelete.hodName}</div>
              )}
              <div className="text-[11px] text-rose-600 font-semibold pt-1">
                Notice: All faculty members belonging to this department will also be permanently removed.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeptToDelete(null)}
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
    </div>
  );
};
