import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Plus,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  Layers,
  Building2,
  Calendar,
  Search,
  Filter,
  AlertCircle,
  FileSpreadsheet,
  X,
  Printer,
  ChevronDown,
  UserCheck,
  FileDown,
  Download,
} from 'lucide-react';
import { WorkloadProgressReport, DepartmentRecord, UserProfile } from '../../types/rbac';
import { apiClient } from '../../api/client';
import { generateWorkloadReportPdf } from '../../utils/workloadPdfGenerator';

interface WorkloadReportsViewProps {
  currentUser: UserProfile;
  onOpenCreateModal: () => void;
  refreshTrigger?: number;
}

export const WorkloadReportsView: React.FC<WorkloadReportsViewProps> = ({
  currentUser,
  onOpenCreateModal,
  refreshTrigger = 0,
}) => {
  const [reports, setReports] = useState<WorkloadProgressReport[]>([]);
  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Detail view modal
  const [viewingReport, setViewingReport] = useState<WorkloadProgressReport | null>(null);

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const canManage = currentUser.role === 'super_admin' || currentUser.role === 'admin';

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const [allReports, allDepts] = await Promise.all([
        apiClient.getWorkloadReports(),
        apiClient.getDepartments(),
      ]);
      setReports(allReports);
      setDepartments(allDepts);
    } catch (err: any) {
      setError(err?.message || 'Failed to load workload progress reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [refreshTrigger]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canManage) return;
    if (!window.confirm('Delete this workload progress report permanently from database?')) return;
    setDeletingId(id);
    try {
      await apiClient.deleteWorkloadReport(id);
      await loadReports();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete report.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleUpdateStatus = async (
    report: WorkloadProgressReport,
    newStatus: 'Pending' | 'In Progress' | 'Completed'
  ) => {
    if (!canManage) return;
    try {
      const updated = await apiClient.updateWorkloadReport(report.id, {
        progressStatus: newStatus,
        workloadProgress: newStatus === 'Completed' ? 100 : report.workloadProgress,
      });
      setReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      if (viewingReport && viewingReport.id === updated.id) {
        setViewingReport(updated);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to update report status.');
    }
  };

  const handleDownloadPdf = (report: WorkloadProgressReport, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      generateWorkloadReportPdf(report);
    } catch (err: any) {
      console.warn('PDF generation note:', err?.message);
      setError(err?.message || 'Failed to generate PDF document.');
    }
  };

  const filteredReports = reports.filter((r) => {
    const matchesDept = selectedDeptId === 'all' || r.departmentId === selectedDeptId;
    const matchesStatus = statusFilter === 'all' || r.progressStatus === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      r.reportTitle.toLowerCase().includes(q) ||
      r.departmentName.toLowerCase().includes(q) ||
      r.departmentCode.toLowerCase().includes(q) ||
      r.hodName.toLowerCase().includes(q) ||
      r.facultyNames.some((n) => n.toLowerCase().includes(q));
    return matchesDept && matchesStatus && matchesQuery;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
            <span>Department Workload Progress Reports</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Archived and active institutional workload progress records saved permanently in the central database.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Progress Report</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Department Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold text-slate-600 text-[11px]">Dept:</span>
            <select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="all">All Departments ({reports.length})</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.code} - {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold text-slate-600 text-[11px]">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="In Progress">In Progress</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search report, HOD, faculty..."
            className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 w-52 sm:w-64"
          />
        </div>
      </div>

      {/* Reports Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2" />
          <p>Loading workload reports from database...</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <FileCheck2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">No Workload Progress Reports Yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
            {reports.length === 0
              ? 'No reports have been submitted. Click "Create New Progress Report" to run the 6-step workflow.'
              : 'No reports match your current filter parameters.'}
          </p>
          {reports.length === 0 && (
            <button
              onClick={onOpenCreateModal}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Launch Step-by-Step Workflow</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReports.map((report) => {
            const isCompleted = report.progressStatus === 'Completed';
            const isInProgress = report.progressStatus === 'In Progress';

            return (
              <div
                key={report.id}
                onClick={() => setViewingReport(report)}
                className="bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all p-4.5 flex flex-col justify-between cursor-pointer space-y-4 group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded font-mono font-black text-xs bg-blue-50 text-blue-700 border border-blue-200">
                      {report.departmentCode}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase font-mono ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : isInProgress
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {report.progressStatus}
                    </span>
                  </div>

                  <h4 className="font-black text-slate-900 text-sm mt-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
                    {report.reportTitle}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">{report.departmentName}</p>

                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-[11px] text-slate-400">Head of Dept:</span>
                      <span className="font-bold text-slate-800 truncate max-w-[160px]">
                        {report.hodName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-[11px] text-slate-400">Faculty Roster:</span>
                      <span className="font-bold text-slate-800 font-mono">
                        {report.facultyCount} Members
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-[11px] text-slate-400">Submitted:</span>
                      <span className="text-slate-700 font-medium">
                        {report.submissionDate || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-slate-500 font-medium">Workload Delivery Progress</span>
                    <span className="font-mono font-black text-blue-700">
                      {report.workloadProgress}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        isCompleted ? 'bg-emerald-500' : 'bg-blue-600'
                      }`}
                      style={{ width: `${Math.max(5, report.workloadProgress)}%` }}
                    />
                  </div>

                  {/* Actions footer */}
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 text-[10px]">
                      By {report.submittedBy || 'Admin'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingReport(report);
                        }}
                        className="px-2 py-0.5 rounded text-blue-600 hover:bg-blue-50 font-bold"
                      >
                        View Full Report
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDownloadPdf(report, e)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-slate-700 hover:text-blue-700 hover:bg-blue-50 bg-slate-50 border border-slate-200 transition-colors font-bold cursor-pointer"
                        title="Download formatted official PDF copy"
                      >
                        <FileDown className="w-3 h-3 text-blue-600" />
                        <span>PDF</span>
                      </button>
                      {canManage && (
                        <button
                          onClick={(e) => handleDelete(report.id, e)}
                          disabled={deletingId === report.id}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete report"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Report Detail Modal */}
      {viewingReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-[#0a192f] to-[#1e3a8a] text-white flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-blue-500/30 text-blue-200 border border-blue-400/30">
                  {viewingReport.departmentCode} &bull; Academic Report
                </span>
                <h3 className="text-base font-black tracking-tight mt-1 text-white">
                  {viewingReport.reportTitle}
                </h3>
              </div>
              <button
                onClick={() => setViewingReport(null)}
                className="text-slate-300 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
              {/* Metadata strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Department</span>
                  <span className="font-bold text-slate-900">{viewingReport.departmentName}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Head of Dept</span>
                  <span className="font-bold text-slate-900">{viewingReport.hodName}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Submission Date</span>
                  <span className="font-semibold text-slate-800">{viewingReport.submissionDate}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Status</span>
                  {canManage ? (
                    <select
                      value={viewingReport.progressStatus}
                      onChange={(e) =>
                        handleUpdateStatus(
                          viewingReport,
                          e.target.value as 'Pending' | 'In Progress' | 'Completed'
                        )
                      }
                      className="mt-0.5 font-bold text-blue-700 bg-white border border-slate-300 rounded px-1.5 py-0.5 cursor-pointer text-[11px]"
                    >
                      <option value="Completed">Completed</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Pending">Pending</option>
                    </select>
                  ) : (
                    <span className="font-bold text-slate-900">{viewingReport.progressStatus}</span>
                  )}
                </div>
              </div>

              {/* Progress Summary */}
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-blue-950">Overall Workload Progress</div>
                  <div className="text-[11px] text-blue-700">
                    Calculated from individual faculty syllabus delivery percentages.
                  </div>
                </div>
                <div className="text-2xl font-black font-mono text-blue-800">
                  {viewingReport.workloadProgress}%
                </div>
              </div>

              {/* Individual Faculty Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 font-bold text-slate-800 text-xs">
                  Detailed Faculty Workload &amp; Progress Ledger ({viewingReport.individualWorkloadDetails.length} Entries)
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-extrabold uppercase">
                        <th className="py-2.5 px-3">Faculty Name</th>
                        <th className="py-2.5 px-3">Designation</th>
                        <th className="py-2.5 px-3">Courses / Code</th>
                        <th className="py-2.5 px-3">Hours (L-T-P)</th>
                        <th className="py-2.5 px-3">Progress</th>
                        <th className="py-2.5 px-3">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {viewingReport.individualWorkloadDetails.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-bold text-slate-900">{item.facultyName}</td>
                          <td className="py-2.5 px-3 text-slate-600">{item.designation}</td>
                          <td className="py-2.5 px-3 text-slate-700 max-w-xs">{item.assignedCourses || 'Core subjects'}</td>
                          <td className="py-2.5 px-3 font-mono">
                            {item.theoryHours}T + {item.labHours}L ={' '}
                            <strong className="text-blue-700">{item.totalHours} hrs</strong>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-mono font-bold text-slate-900">
                              {item.progressPercentage}%
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 text-[11px] max-w-xs truncate">
                            {item.progressNotes || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <span className="text-[11px] text-slate-400">
                Created: {new Date(viewingReport.createdAt).toLocaleString()} &bull; Submitted by: {viewingReport.submittedBy}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadPdf(viewingReport)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
                  title="Generate formatted PDF via jsPDF & autoTable"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Export Formatted PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewingReport(null)}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-800 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
