import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Download,
  Clock,
  Layers,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  ChevronDown,
  Info,
  Award,
} from 'lucide-react';
import { AllocationRecord, FacultyStats } from '../../types/workload';
import { computeFacultyStatsList, exportFacultySummaryToCSV } from '../../utils/kvcetEngine';

interface FacultyPageProps {
  data: AllocationRecord[];
}

export const FacultyPage: React.FC<FacultyPageProps> = ({ data }) => {
  const [deptFilter, setDeptFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [theoryCountFilter, setTheoryCountFilter] = useState('all');
  const [loadStatusFilter, setLoadStatusFilter] = useState<'all' | 'compliant' | 'overloaded' | 'underloaded'>('all');
  const [prescribedPolicy, setPrescribedPolicy] = useState<'cadre' | 'fixed16' | 'fixed18' | 'fixed14'>('cadre');
  const [viewMode, setViewMode] = useState<'bars' | 'ledger'>('bars');

  const departments = Array.from(new Set(data.map((d) => d.department || 'Unspecified'))).sort();

  // Compute stats with the selected policy
  const policyValue =
    prescribedPolicy === 'fixed16' ? 16 : prescribedPolicy === 'fixed18' ? 18 : prescribedPolicy === 'fixed14' ? 14 : 'cadre';
  const allStats = computeFacultyStatsList(data, policyValue);

  // Filter stats
  const filteredStats = allStats.filter((s) => {
    const matchesDept = deptFilter === 'all' || s.department === deptFilter;
    const matchesSearch =
      !searchQuery ||
      s.facultyName.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      s.department.toLowerCase().includes(searchQuery.toLowerCase().trim());

    const matchesCount =
      theoryCountFilter === 'all' ||
      (theoryCountFilter === '4+'
        ? s.theoryCoursesCount >= 4
        : s.theoryCoursesCount === Number(theoryCountFilter));

    const matchesStatus = loadStatusFilter === 'all' || s.loadStatus === loadStatusFilter;

    return matchesDept && matchesSearch && matchesCount && matchesStatus;
  });

  const totalAssignedCourses = filteredStats.reduce((sum, s) => sum + s.totalCourses, 0);
  const totalKnownPeriods = filteredStats.reduce((sum, s) => sum + s.totalContactPeriods, 0);
  const compliantCount = filteredStats.filter((s) => s.loadStatus === 'compliant').length;
  const overloadedCount = filteredStats.filter((s) => s.loadStatus === 'overloaded').length;
  const underloadedCount = filteredStats.filter((s) => s.loadStatus === 'underloaded').length;

  const maxPeriods = Math.max(1, ...filteredStats.map((s) => s.totalContactPeriods));
  const completeAllocationsCount = data.filter((d) => d.L !== null && d.T !== null && d.P !== null).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600 font-mono">
            Staff Allocation Register &bull; Prescribed Load Governance
          </span>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
            Faculty Teaching Load & Limit Compliance
          </h2>
          <p className="text-xs text-slate-500">
            Real-time visual comparison of assigned teaching contact hours versus department prescribed norms
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* View toggle */}
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
            <button
              onClick={() => setViewMode('bars')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                viewMode === 'bars' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Visual Progress
            </button>
            <button
              onClick={() => setViewMode('ledger')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                viewMode === 'ledger' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Full Ledger Table
            </button>
          </div>

          <button
            onClick={() => exportFacultySummaryToCSV(filteredStats)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards: Load Distribution & Health */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Faculty Roster</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {filteredStats.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {totalAssignedCourses} assigned subjects &bull; {totalKnownPeriods} total contact hrs
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-600 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Optimal / Compliant</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono">
            {compliantCount}
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1">
            Within prescribed ceiling (75%–100%)
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-rose-600 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Overloaded Load</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-700 font-mono">
            {overloadedCount}
          </div>
          <div className="text-[11px] text-rose-600 font-semibold mt-1">
            Exceeds department norm limit
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-amber-600 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Available Capacity</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700 font-mono">
            {underloadedCount}
          </div>
          <div className="text-[11px] text-amber-700 font-semibold mt-1">
            Underloaded (&lt; 75% of ceiling)
          </div>
        </div>
      </div>

      {/* Filter and Prescribed Limit Policy Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search faculty name or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto text-xs">
          {/* Department Filter */}
          <div className="flex items-center space-x-1 text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Dept:</span>
          </div>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium cursor-pointer"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <span className="text-slate-300">|</span>

          {/* Load Status Filter */}
          <select
            value={loadStatusFilter}
            onChange={(e) => setLoadStatusFilter(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium cursor-pointer"
          >
            <option value="all">All Load Statuses</option>
            <option value="compliant">Compliant / Optimal</option>
            <option value="overloaded">Overloaded (&gt; Limit)</option>
            <option value="underloaded">Under Capacity (&lt; Limit)</option>
          </select>

          <span className="text-slate-300">|</span>

          {/* Department Prescribed Limit Policy Selector */}
          <div className="flex items-center space-x-1 text-slate-500">
            <Sliders className="w-3.5 h-3.5 text-blue-600" />
            <span className="font-semibold text-slate-700">Norm Policy:</span>
          </div>
          <select
            value={prescribedPolicy}
            onChange={(e) => setPrescribedPolicy(e.target.value as any)}
            className="bg-blue-50/60 border border-blue-200 text-blue-900 font-bold rounded-lg px-2.5 py-1.5 cursor-pointer"
            title="Configure the benchmark prescribed limit used to calculate load percentages"
          >
            <option value="cadre">AICTE Cadre Norms (Prof: 14h, Asst: 18h, Default: 16h)</option>
            <option value="fixed16">Standard Department Ceiling (16 hrs/wk)</option>
            <option value="fixed18">Teaching Intensive Limit (18 hrs/wk)</option>
            <option value="fixed14">Senior / Research Cap (14 hrs/wk)</option>
          </select>
        </div>
      </div>

      {/* VIEW 1: Dedicated Visual Progress Bars for Each Faculty Member */}
      {viewMode === 'bars' && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                Assigned Teaching Hours vs Prescribed Load Limit Progress
              </h3>
              <p className="text-xs text-slate-500">
                Visual progress meters displaying each faculty member's committed hours compared against their department ceiling
              </p>
            </div>

            {/* Visual Legend */}
            <div className="flex items-center gap-3 text-[11px] self-start sm:self-auto font-medium">
              <span className="inline-flex items-center gap-1 text-emerald-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Compliant (75%–100%)
              </span>
              <span className="inline-flex items-center gap-1 text-rose-700">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Overloaded (&gt;100%)
              </span>
              <span className="inline-flex items-center gap-1 text-amber-700">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Under Capacity (&lt;75%)
              </span>
            </div>
          </div>

          {filteredStats.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs italic">
              No faculty members match the active search and load status filters.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredStats.map((s) => {
                // Determine percentage capped for the visual bar (can visually exceed 100% up to 135%)
                const visualPct = Math.min(s.loadPercentage, 135);
                const isOver = s.loadStatus === 'overloaded';
                const isUnder = s.loadStatus === 'underloaded';

                // Bar fill colors based on status
                let barGradient = 'from-emerald-500 to-teal-500';
                let badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                let statusLabel = 'Compliant';

                if (isOver) {
                  barGradient = 'from-rose-500 to-red-600';
                  badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200';
                  statusLabel = `Overloaded (+${s.loadDeviation} hrs)`;
                } else if (isUnder) {
                  barGradient = 'from-amber-400 to-amber-500';
                  badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200';
                  statusLabel = `Under Capacity (${Math.abs(s.loadDeviation)}h free)`;
                }

                return (
                  <div
                    key={s.facultyName}
                    className="p-4 rounded-xl border border-slate-200/90 bg-white hover:border-blue-300 hover:shadow-xs transition-all space-y-2.5"
                  >
                    {/* Faculty Title & Metrics Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs text-white shadow-2xs ${
                            isOver ? 'bg-rose-600' : isUnder ? 'bg-amber-500' : 'bg-blue-600'
                          }`}
                        >
                          {s.facultyName.replace(/Dr\.?|Prof\.?|Mrs\.?|Mr\.?|Ms\.?/gi, '').trim().slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                            {s.facultyName}
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            {s.department} &bull; {s.totalCourses} courses ({s.theoryCoursesCount} theory, {s.labCoursesCount} labs) &bull; {s.totalCredits} credits
                          </p>
                        </div>
                      </div>

                      {/* Numeric Hours Badge and Compliance Pill */}
                      <div className="flex items-center space-x-2 self-start sm:self-auto">
                        <div className="text-right">
                          <div className="font-mono text-xs font-black text-slate-900">
                            <span className={isOver ? 'text-rose-600' : isUnder ? 'text-amber-700' : 'text-emerald-700'}>
                              {s.totalContactPeriods} hrs
                            </span>{' '}
                            / <span className="text-slate-400 font-medium">{s.prescribedLimit} hrs limit</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {s.loadPercentage}% load capacity
                          </div>
                        </div>

                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${badgeStyle}`}>
                          {isOver ? (
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                          ) : (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          )}
                          <span>{statusLabel}</span>
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar Container with 100% Prescribed Limit Reference Marker */}
                    <div className="space-y-1 pt-1">
                      <div className="relative h-4 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/80 shadow-inner">
                        {/* 100% Threshold Indicator Line */}
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-slate-400/80 z-10"
                          style={{ left: '74%' }}
                          title="100% Department Prescribed Limit"
                        />

                        {/* Animated Filled Progress Bar */}
                        <div
                          style={{ width: `${Math.min((s.totalContactPeriods / s.prescribedLimit) * 74, 100)}%` }}
                          className={`h-full rounded-full bg-gradient-to-r ${barGradient} transition-all duration-500 shadow-xs flex items-center justify-end pr-2`}
                        >
                          {s.totalContactPeriods > 3 && (
                            <span className="text-[9px] font-mono font-bold text-white drop-shadow-xs">
                              {s.loadPercentage}%
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Sub-bar Details: Periods breakdown & Remaining headroom */}
                      <div className="flex items-center justify-between text-[10px] text-slate-500 px-1 font-mono">
                        <div className="flex items-center space-x-2">
                          <span className="text-blue-700 font-bold">L: {s.lecturePeriods}h</span>
                          <span>&bull;</span>
                          <span className="text-cyan-700 font-bold">T: {s.tutorialPeriods}h</span>
                          <span>&bull;</span>
                          <span className="text-emerald-700 font-bold">P: {s.practicalPeriods}h</span>
                          {s.incompleteRows > 0 && (
                            <span className="text-amber-600 font-bold">({s.incompleteRows} incomplete L-T-P)</span>
                          )}
                        </div>

                        <div className="text-right">
                          {isOver ? (
                            <span className="text-rose-600 font-bold">
                              Exceeds norm by +{s.loadDeviation.toFixed(1)} hrs/wk
                            </span>
                          ) : isUnder ? (
                            <span className="text-amber-600 font-bold">
                              {Math.abs(s.loadDeviation).toFixed(1)} hrs available capacity
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-semibold">
                              Optimal load &bull; {Math.abs(s.loadDeviation).toFixed(1)} hrs headroom
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: Visual Stacked L-T-P Component */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              Period Composition Distribution (L vs T vs P)
            </h3>
            <p className="text-xs text-slate-500">
              Breakdown of Lecture (L), Tutorial (T), and Practical (P) hours contributing to the total contact load
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
            {completeAllocationsCount}/{data.length} allocations complete
          </span>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-[#2864dc]" />
            <span className="font-semibold text-slate-700">Lecture (L)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-[#22b8cf]" />
            <span className="font-semibold text-slate-700">Tutorial (T)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-[#18a36f]" />
            <span className="font-semibold text-slate-700">Practical (P)</span>
          </div>
        </div>

        {/* Stacked Bars List */}
        <div className="space-y-3 pt-2">
          {filteredStats.map((s) => {
            const scale = 100 / maxPeriods;
            const lPct = s.lecturePeriods * scale;
            const tPct = s.tutorialPeriods * scale;
            const pPct = s.practicalPeriods * scale;

            return (
              <div
                key={s.facultyName}
                className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center p-2.5 rounded-lg hover:bg-slate-50 transition-colors border-t border-slate-100 first:border-0"
              >
                {/* Faculty Info */}
                <div className="md:col-span-3">
                  <h4 className="font-bold text-slate-900 text-xs truncate">{s.facultyName}</h4>
                  <p className="text-[10px] text-slate-500 truncate">
                    {s.department} &bull; {s.totalCourses} course(s)
                  </p>
                </div>

                {/* Stacked Bar Track */}
                <div className="md:col-span-6">
                  <div className="h-3.5 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                    <div
                      style={{ width: `${lPct}%` }}
                      className="bg-[#2864dc] transition-all duration-300"
                      title={`Lecture (L): ${s.lecturePeriods} hrs`}
                    />
                    <div
                      style={{ width: `${tPct}%` }}
                      className="bg-[#22b8cf] transition-all duration-300"
                      title={`Tutorial (T): ${s.tutorialPeriods} hrs`}
                    />
                    <div
                      style={{ width: `${pPct}%` }}
                      className="bg-[#18a36f] transition-all duration-300"
                      title={`Practical (P): ${s.practicalPeriods} hrs`}
                    />
                  </div>
                </div>

                {/* Numeric values */}
                <div className="md:col-span-3 text-right">
                  <div className="text-xs font-mono font-bold text-slate-900">
                    {s.totalContactPeriods > 0 ? `${s.totalContactPeriods} known periods` : '—'}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500">
                    L: {s.lecturePeriods} &bull; T: {s.tutorialPeriods} &bull; P: {s.practicalPeriods}
                    {s.incompleteRows > 0 ? ` &bull; ${s.incompleteRows} incomplete` : ''}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ledger Table with Integrated Progress Bars */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-x-auto">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Consolidated Faculty Workload Ledger & Compliance Table
          </h3>
          <span className="text-[11px] font-mono text-slate-500">
            {filteredStats.length} faculty members listed
          </span>
        </div>

        <table className="w-full text-left text-xs text-slate-700 min-w-[1150px]">
          <thead className="bg-slate-50 text-[10px] uppercase tracking-wider font-extrabold text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Faculty Name</th>
              <th className="px-3 py-3 text-center">Courses</th>
              <th className="px-3 py-3 text-center">Theory</th>
              <th className="px-3 py-3 text-center">Labs</th>
              <th className="px-3 py-3 text-center">Credits</th>
              <th className="px-3 py-3 text-center">L+T (Hrs)</th>
              <th className="px-3 py-3 text-center">P (Hrs)</th>
              <th className="px-4 py-3 min-w-[190px]">Assigned Load vs Limit Progress</th>
              <th className="px-3 py-3 text-center">Status</th>
              <th className="px-3 py-3 text-center">Review</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {filteredStats.map((s) => {
              const isOver = s.loadStatus === 'overloaded';
              const isUnder = s.loadStatus === 'underloaded';
              const pct = Math.min(s.loadPercentage, 100);

              return (
                <tr key={s.facultyName} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3 text-slate-600 max-w-[140px] truncate">{s.department}</td>
                  <td className="px-4 py-3 font-bold text-slate-900">{s.facultyName}</td>
                  <td className="px-3 py-3 text-center font-mono">{s.totalCourses}</td>
                  <td className="px-3 py-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                        s.theoryCoursesCount >= 4
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      {s.theoryCoursesCount}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center font-mono">{s.labCoursesCount}</td>
                  <td className="px-3 py-3 text-center font-mono font-bold text-indigo-700">{s.totalCredits}</td>
                  <td className="px-3 py-3 text-center font-mono text-blue-700">{s.theoryContactPeriods || '—'}</td>
                  <td className="px-3 py-3 text-center font-mono text-emerald-700">{s.practicalPeriods || '—'}</td>

                  {/* Visual Progress Bar in Table Cell */}
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className={`font-bold ${isOver ? 'text-rose-600' : isUnder ? 'text-amber-700' : 'text-slate-900'}`}>
                          {s.totalContactPeriods} hrs
                        </span>
                        <span className="text-slate-400">Limit: {s.prescribedLimit}h ({s.loadPercentage}%)</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                        <div
                          style={{ width: `${pct}%` }}
                          className={`h-full rounded-full transition-all duration-300 ${
                            isOver ? 'bg-rose-500' : isUnder ? 'bg-amber-400' : 'bg-emerald-500'
                          }`}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="px-3 py-3 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                        isOver
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : isUnder
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {isOver ? `+${s.loadDeviation} Over` : isUnder ? `${Math.abs(s.loadDeviation)}h Free` : 'Optimal'}
                    </span>
                  </td>

                  {/* Review Flags */}
                  <td className="px-3 py-3 text-center">
                    {s.reviewFlags > 0 ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        {s.reviewFlags} Review
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Clear
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
