import React from 'react';
import {
  Users,
  BookOpen,
  Clock,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { AllocationRecord, WorkspaceConfig } from '../../types/workload';
import { computeHours, computeFacultyStatsList } from '../../utils/kvcetEngine';
import { KvellLogo } from '../KvellLogo';
import { DepartmentResourceUtilizationChart } from './DepartmentResourceUtilizationChart';
import { DepartmentCreditComparisonChart } from './DepartmentCreditComparisonChart';
import { RecentActivityWidget } from './RecentActivityWidget';
import { AdminDashboardStatsWidget } from '../rbac/AdminDashboardStatsWidget';
import { UserProfile } from '../../types/rbac';

interface OverviewPageProps {
  data: AllocationRecord[];
  workspace: WorkspaceConfig;
  onNavigate: (page: string) => void;
  onOpenPrint: () => void;
  currentUser?: UserProfile;
  onOpenCreateReport?: () => void;
  onOpenAddDept?: () => void;
  refreshTrigger?: number;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  data,
  workspace,
  onNavigate,
  onOpenPrint,
  currentUser = { id: 'u-superadmin', name: 'Dr. Principal', email: 'admin@kvcet.edu.in', role: 'super_admin', roleLabel: 'Super Admin' },
  onOpenCreateReport,
  onOpenAddDept,
  refreshTrigger = 0,
}) => {
  const facultyList = Array.from(new Set(data.map((d) => d.faculty)));
  const reviewFlags = data.filter((d) => d.status !== 'MATCH').length;
  const knownRows = data.filter((d) => computeHours(d) !== null);
  const totalPeriods = knownRows.reduce((sum, d) => sum + (computeHours(d) || 0), 0);
  const incompleteCount = data.length - knownRows.length;

  const facultyStats = computeFacultyStatsList(data);
  const topFaculty = facultyStats
    .slice()
    .sort((a, b) => b.totalContactPeriods - a.totalContactPeriods)
    .slice(0, 6);
  const maxPeriod = Math.max(1, ...topFaculty.map((x) => x.totalContactPeriods));

  // Category counts
  const counts = {
    Theory: data.filter((d) => d.type === 'Theory').length,
    LIT: data.filter((d) => d.type === 'LIT').length,
    Lab: data.filter((d) => d.type === 'Lab').length,
    Other: data.filter((d) => d.type === 'Other').length,
  };
  const maxCount = Math.max(1, ...Object.values(counts));

  return (
    <div className="space-y-6">
      {/* Executive Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0a192f] via-[#112d4e] to-[#1e3a8a] p-6 sm:p-8 text-white shadow-lg border border-slate-700/40">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[11px] font-bold tracking-wide uppercase font-mono">
                {workspace.institutionShort}
              </span>
              <span className="text-slate-400 text-xs">•</span>
              <span className="text-slate-200 text-xs font-semibold">
                AY {workspace.year}
              </span>
              <span className="text-slate-400 text-xs">•</span>
              <span className="text-indigo-200 text-xs font-semibold">
                {workspace.department}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-sans leading-tight">
              Institutional Workload Intelligence Platform
            </h2>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Automated syllabus validation engine for Karpaga Vinayaga Deemed to be University. Matches individual course allocations against official R2021/R2025 curriculum credit structures and contact periods, separates lecture and laboratory workloads, and flags discrepancies for academic council review.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => onNavigate('analysis')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                <span>Launch Workload Analysis</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={onOpenPrint}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition-all cursor-pointer"
              >
                <span>Generate Official Statement</span>
              </button>
            </div>
          </div>

          {/* Quick Hero Stat Widget */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 min-w-[220px] text-right space-y-2 shrink-0">
            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
              Department Register
            </div>
            <div className="text-3xl font-black text-white font-mono">
              {data.length} <span className="text-sm font-normal text-slate-300">allocations</span>
            </div>
            <div className="text-[11px] text-slate-300 flex items-center justify-end gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{data.filter((d) => d.status === 'MATCH').length} Syllabus Verified</span>
            </div>
          </div>
        </div>
      </div>

      {/* Institutional Admin Dashboard Section with 7 Core Metrics */}
      <AdminDashboardStatsWidget
        currentUser={currentUser}
        onNavigateTab={onNavigate}
        onOpenCreateReport={onOpenCreateReport}
        onOpenAddDept={onOpenAddDept}
        refreshTrigger={refreshTrigger}
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Faculty in Plan</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">{facultyList.length}</div>
          <div className="mt-2 text-[11px] text-slate-500">
            Unique named & placeholder faculty
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Allocated Courses</span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">{data.length}</div>
          <div className="mt-2 text-[11px] text-slate-500">
            Across current academic programmes
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Weekly Contact Periods</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {knownRows.length > 0 ? `${totalPeriods}*` : '—'}
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            {incompleteCount > 0 ? `${incompleteCount} incomplete rows excluded` : 'All L-T-P complete'}
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Items Needing Review</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700 font-mono">{reviewFlags}</div>
          <div className="mt-2 text-[11px] text-slate-500">
            Credit, code, or syllabus flags
          </div>
        </div>
      </div>

      {/* Recharts Departmental Teaching Hours & Resource Utilization Chart */}
      <DepartmentResourceUtilizationChart data={data} />

      {/* Visual Recharts Bar Chart: Current Department vs Institutional Peer Average Credit Load */}
      <DepartmentCreditComparisonChart data={data} workspace={workspace} />

      {/* Two Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Faculty Contact-Period Distribution */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                Faculty Contact-Period Distribution
              </h3>
              <p className="text-xs text-slate-500">
                Known weekly periods from verified syllabus catalogue
              </p>
            </div>
            <button
              onClick={() => onNavigate('faculty')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
            >
              View All ({facultyStats.length}) &rarr;
            </button>
          </div>

          <div className="space-y-3 pt-2">
            {topFaculty.map((f) => {
              const pct = Math.round((f.totalContactPeriods / maxPeriod) * 100);
              return (
                <div key={f.facultyName} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{f.facultyName}</span>
                    <span className="font-mono font-bold text-slate-900">
                      {f.totalContactPeriods} periods{' '}
                      <span className="text-slate-400 font-normal">
                        ({f.theoryCoursesCount} theory, {f.labCoursesCount} labs)
                      </span>
                    </span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                    <div
                      style={{ width: `${pct}%` }}
                      className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {incompleteCount > 0 && (
            <p className="text-[11px] text-slate-400 italic pt-2 border-t border-slate-100">
              * Note: {incompleteCount} allocations have missing or incomplete L-T-P values and are not counted as zero.
            </p>
          )}
        </div>

        {/* Right 1 Col: Course Classification */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              Course Classification
            </h3>
            <p className="text-xs text-slate-500">Based on active workload plan</p>
          </div>

          {/* Bar Columns */}
          <div className="flex items-end justify-between gap-3 h-36 px-2 border-b border-slate-100 pb-2">
            {Object.entries(counts).map(([cat, val]) => {
              const hPct = Math.round((val / maxCount) * 100);
              return (
                <div key={cat} className="flex-1 flex flex-col items-center justify-end h-full gap-2">
                  <span className="text-xs font-mono font-bold text-slate-900">{val}</span>
                  <div
                    style={{ height: `${Math.max(hPct, 8)}%` }}
                    className="w-full max-w-[42px] rounded-t-lg bg-gradient-to-t from-blue-700 to-indigo-500 transition-all duration-500"
                  />
                  <span className="text-[10px] font-semibold text-slate-600 text-center truncate max-w-full">
                    {cat}
                  </span>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            LIT courses are retained as integrated theory courses; their practical components are monitored separately in the contact-period breakdown.
          </p>
        </div>
      </div>

      {/* Operational Activity & Academic Review Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Col: Recent Activity Widget */}
        <RecentActivityWidget onNavigate={onNavigate} maxItems={5} />

        {/* Right Col: Priority Review Items */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Priority Academic Review Items</h3>
                <p className="text-xs text-slate-500">
                  Courses where plan credits or titles deviate from syllabus catalogue
                </p>
              </div>
              <button
                onClick={() => onNavigate('analysis')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
              >
                Open Full Analysis &rarr;
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {data
                .filter((d) => d.status !== 'MATCH')
                .slice(0, 5)
                .map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-slate-50/60 transition-colors"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-900">
                          {item.code || 'NO-CODE'}
                        </span>
                        <span className="text-xs font-bold text-slate-800 truncate">{item.name}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">
                        Faculty: <strong className="text-slate-700">{item.faculty}</strong> &bull; Sem {item.sem} (R{item.reg})
                      </p>
                    </div>

                    <div className="shrink-0 self-start sm:self-auto">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                          item.status === 'MISMATCH'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="p-3 bg-slate-50/70 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>{reviewFlags} total flagged items across curriculum</span>
            <button
              onClick={() => onNavigate('subjects')}
              className="text-blue-600 hover:text-blue-800 font-bold"
            >
              Review in Register &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
