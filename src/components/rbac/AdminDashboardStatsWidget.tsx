import React, { useEffect, useState } from 'react';
import {
  Building2,
  GraduationCap,
  Users2,
  FileCheck2,
  Clock,
  CheckCircle2,
  Layers,
  ArrowRight,
  RefreshCw,
  PlusCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { AdminDashboardStats, UserProfile } from '../../types/rbac';
import { apiClient } from '../../api/client';

interface AdminDashboardStatsWidgetProps {
  currentUser: UserProfile;
  onNavigateTab: (tab: string) => void;
  onOpenCreateReport?: () => void;
  onOpenAddDept?: () => void;
  refreshTrigger?: number;
}

export const AdminDashboardStatsWidget: React.FC<AdminDashboardStatsWidgetProps> = ({
  currentUser,
  onNavigateTab,
  onOpenCreateReport,
  onOpenAddDept,
  refreshTrigger = 0,
}) => {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getAdminStats();
      if (data) {
        setStats(data);
      }
    } catch (err: any) {
      console.warn('Notice: Institutional statistics sync delayed:', err?.message);
      setError('Institutional database sync delayed. Showing current statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [refreshTrigger]);

  const canManage = currentUser.role === 'super_admin' || currentUser.role === 'admin';

  return (
    <div className="space-y-4">
      {/* Header bar for Admin Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
              Institutional Administrative Dashboard
            </h3>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-mono">
              Live DB Synced
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time metrics on registered academic departments, HODs, faculty rosters, and workload progress reports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchStats}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh database statistics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            <span>Refresh</span>
          </button>

          {canManage && onOpenAddDept && (
            <button
              onClick={onOpenAddDept}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Department</span>
            </button>
          )}

          {canManage && onOpenCreateReport && (
            <button
              onClick={onOpenCreateReport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>New Workload Report</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchStats} className="font-bold underline ml-2">Retry</button>
        </div>
      )}

      {/* 7 Required Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {/* 1. Total Departments */}
        <div
          onClick={() => onNavigateTab('departments')}
          className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
              Departments
            </span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900 font-mono">
              {loading ? '...' : stats?.totalDepartments ?? 0}
            </div>
            <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
              <span>Registered</span>
              <ArrowRight className="w-2.5 h-2.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>

        {/* 2. Total HODs */}
        <div
          onClick={() => onNavigateTab('departments')}
          className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
              Total HODs
            </span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900 font-mono">
              {loading ? '...' : stats?.totalHods ?? 0}
            </div>
            <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
              <span>Appointed Heads</span>
              <ArrowRight className="w-2.5 h-2.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>

        {/* 3. Total Faculty Members */}
        <div
          onClick={() => onNavigateTab('staff')}
          className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-purple-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
              Total Faculty
            </span>
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Users2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900 font-mono">
              {loading ? '...' : stats?.totalFaculty ?? 0}
            </div>
            <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
              <span>Active Roster</span>
              <ArrowRight className="w-2.5 h-2.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>

        {/* 4. Total Workload Reports */}
        <div
          onClick={() => onNavigateTab('reports')}
          className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-sky-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
              Total Reports
            </span>
            <div className="p-1.5 rounded-lg bg-sky-50 text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition-colors">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900 font-mono">
              {loading ? '...' : stats?.totalWorkloadReports ?? 0}
            </div>
            <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
              <span>All Submissions</span>
              <ArrowRight className="w-2.5 h-2.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>

        {/* 5. Completed Workload Reports */}
        <div
          onClick={() => onNavigateTab('reports')}
          className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
              Completed
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-emerald-700 font-mono">
              {loading ? '...' : stats?.completedWorkloadReports ?? 0}
            </div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
              Verified &amp; Finalized
            </div>
          </div>
        </div>

        {/* 6. Pending Workload Reports */}
        <div
          onClick={() => onNavigateTab('reports')}
          className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
              Pending
            </span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-amber-700 font-mono">
              {loading ? '...' : stats?.pendingWorkloadReports ?? 0}
            </div>
            <div className="text-[10px] text-amber-600 font-semibold mt-0.5">
              Awaiting Review
            </div>
          </div>
        </div>

        {/* 7. In Progress / In-Review */}
        <div
          onClick={() => onNavigateTab('reports')}
          className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
              In Progress
            </span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-indigo-700 font-mono">
              {loading ? '...' : stats?.inProgressWorkloadReports ?? 0}
            </div>
            <div className="text-[10px] text-indigo-600 font-semibold mt-0.5">
              Active Drafting
            </div>
          </div>
        </div>
      </div>

      {/* Department-wise Faculty Count Section */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Department-Wise Faculty Distribution
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            {stats?.departmentWiseFacultyCount?.length || 0} Departments Configured
          </span>
        </div>

        {(!stats?.departmentWiseFacultyCount || stats.departmentWiseFacultyCount.length === 0) ? (
          <div className="py-6 text-center text-xs text-slate-400 bg-slate-50/60 rounded-lg border border-dashed border-slate-200">
            <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-600">No departments registered yet in database.</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Admin or Super Admin can register departments using the Department Management section.
            </p>
            {canManage && onOpenAddDept && (
              <button
                onClick={onOpenAddDept}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200"
              >
                + Register First Department
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {stats.departmentWiseFacultyCount.map((dept) => {
              const maxCount = Math.max(
                1,
                ...stats.departmentWiseFacultyCount.map((d) => d.count)
              );
              const percentage = Math.round((dept.count / maxCount) * 100);

              return (
                <div
                  key={dept.departmentId}
                  onClick={() => onNavigateTab('staff')}
                  className="p-3 rounded-lg border border-slate-100 bg-slate-50/60 hover:bg-white hover:border-blue-200 hover:shadow-xs transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="px-1.5 py-0.5 text-[10px] font-black uppercase rounded bg-blue-100 text-blue-800 font-mono">
                        {dept.departmentCode}
                      </span>
                      <p className="text-xs font-bold text-slate-800 truncate mt-1" title={dept.departmentName}>
                        {dept.departmentName}
                      </p>
                    </div>
                    <span className="text-sm font-black text-slate-900 font-mono shrink-0">
                      {dept.count} <span className="text-[10px] text-slate-400 font-normal">staff</span>
                    </span>
                  </div>
                  <div className="mt-2 w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(8, percentage)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
