import React, { useState } from 'react';
import {
  Search,
  Filter,
  Download,
  RotateCcw,
  BookOpen,
  FlaskConical,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { AllocationRecord } from '../../types/workload';
import { computeHours, exportAnalysisToCSV } from '../../utils/kvcetEngine';

interface AnalysisPageProps {
  data: AllocationRecord[];
  onLoadCivilDemo: () => void;
}

export const AnalysisPage: React.FC<AnalysisPageProps> = ({ data, onLoadCivilDemo }) => {
  const [activeTab, setActiveTab] = useState<'theory' | 'labs' | 'issues'>('theory');
  const [deptFilter, setDeptFilter] = useState('all');
  const [semFilter, setSemFilter] = useState('all');
  const [regFilter, setRegFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Extract unique filter options
  const departments = Array.from(new Set(data.map((d) => d.department || 'Unspecified'))).sort();
  const semesters = Array.from(new Set(data.map((d) => String(d.sem)))).sort();
  const regulations = Array.from(new Set(data.map((d) => String(d.reg)))).sort();

  // Filter logic
  const filteredRows = data.filter((d) => {
    const matchesDept = deptFilter === 'all' || (d.department || 'Unspecified') === deptFilter;
    const matchesSem = semFilter === 'all' || String(d.sem) === semFilter;
    const matchesReg = regFilter === 'all' || String(d.reg) === regFilter;
    const matchesType = typeFilter === 'all' || d.type === typeFilter;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      d.name.toLowerCase().includes(query) ||
      d.code.toLowerCase().includes(query) ||
      d.faculty.toLowerCase().includes(query) ||
      d.department.toLowerCase().includes(query);

    return matchesDept && matchesSem && matchesReg && matchesType && matchesSearch;
  });

  const theoryRows = filteredRows.filter((d) => d.type === 'Theory' || d.type === 'LIT');
  const labRows = filteredRows.filter(
    (d) => d.type === 'Lab' || (d.type === 'Other' && /lab|practical|drawing/i.test(d.name))
  );
  const issueRows = filteredRows.filter((d) => d.status !== 'MATCH');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600 font-mono">
            Validation Engine &bull; Syllabus Cross-Audit
          </span>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
            Workload Allocation Analysis
          </h2>
          <p className="text-xs text-slate-500">
            Real-time validation against Anna University & Karpaga Vinayaga Autonomous Regulations (R2021 / R2025)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onLoadCivilDemo}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer border border-slate-200"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Load Civil Demo</span>
          </button>
          <button
            onClick={() => exportAnalysisToCSV(filteredRows)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Multi-Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
        {/* Dept */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Department
          </label>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Sem */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Semester
          </label>
          <select
            value={semFilter}
            onChange={(e) => setSemFilter(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">All Semesters</option>
            {semesters.map((s) => (
              <option key={s} value={s}>Semester {s}</option>
            ))}
          </select>
        </div>

        {/* Reg */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Regulation
          </label>
          <select
            value={regFilter}
            onChange={(e) => setRegFilter(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">All Regulations</option>
            {regulations.map((r) => (
              <option key={r} value={r}>R{r}</option>
            ))}
          </select>
        </div>

        {/* Type */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Classification
          </label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">All Courses</option>
            <option value="Theory">Theory Only</option>
            <option value="LIT">Integrated Theory (LIT)</option>
            <option value="Lab">Laboratories</option>
            <option value="Other">Skill / Project / Other</option>
          </select>
        </div>

        {/* Search */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Search
          </label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Code, name, staff..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex space-x-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('theory')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'theory'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Theory & LIT Papers ({theoryRows.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('labs')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'labs'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FlaskConical className="w-4 h-4" />
          <span>Laboratories & Practicals ({labRows.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('issues')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'issues'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span>Validation Exceptions & Review ({issueRows.length})</span>
        </button>
      </div>

      {/* Tab 1: Theory Papers Table */}
      {activeTab === 'theory' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 min-w-[950px]">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider font-extrabold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Sem / Reg</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Course Code & Title</th>
                <th className="px-4 py-3">Faculty In-charge</th>
                <th className="px-3 py-3 text-center">Type</th>
                <th className="px-3 py-3 text-center">Credits<br /><span className="text-[9px] text-slate-400 font-normal">Plan / Syllabus</span></th>
                <th className="px-3 py-3 text-center">L–T–P Pattern</th>
                <th className="px-3 py-3 text-center font-bold">Weekly Hours</th>
                <th className="px-4 py-3 text-center">Validation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {theoryRows.map((d) => {
                const totalHours = computeHours(d);
                return (
                  <tr key={d.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap font-mono font-bold text-slate-600">
                      {d.sem} / R{d.reg}
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-[150px] truncate">{d.department}</td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{d.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{d.code || 'Code not supplied'}</div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{d.faculty}</td>
                    <td className="px-3 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        d.type === 'LIT' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {d.type}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center font-mono font-bold">
                      {d.credits ?? '—'} / <span className="text-slate-400">{d.syllabusCredits ?? '—'}</span>
                    </td>
                    <td className="px-3 py-3 text-center font-mono">
                      {d.L === null ? '—' : `${d.L}–${d.T}–${d.P}`}
                    </td>
                    <td className="px-3 py-3 text-center font-mono font-black text-blue-700">
                      {totalHours !== null ? `${totalHours} hrs` : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                        d.status === 'MATCH'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : d.status === 'MISMATCH'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {d.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Laboratories Table */}
      {activeTab === 'labs' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 min-w-[850px]">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider font-extrabold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Sem / Reg</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Laboratory Course Code & Title</th>
                <th className="px-4 py-3">Faculty In-charge</th>
                <th className="px-4 py-3 text-center">Credits (Plan / Syllabus)</th>
                <th className="px-4 py-3 text-center">Practical Periods / Wk (P)</th>
                <th className="px-4 py-3 text-center font-bold">Weekly Hours</th>
                <th className="px-4 py-3 text-center">Validation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {labRows.map((d) => {
                const totalHours = computeHours(d);
                return (
                  <tr key={d.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap font-mono font-bold text-slate-600">
                      {d.sem} / R{d.reg}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{d.department}</td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{d.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{d.code || 'Code not supplied'}</div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{d.faculty}</td>
                    <td className="px-4 py-3 text-center font-mono font-bold">
                      {d.credits ?? '—'} / <span className="text-slate-400">{d.syllabusCredits ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-bold text-emerald-700">
                      {d.P ?? '—'} periods
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-black text-blue-700">
                      {totalHours !== null ? `${totalHours} hrs` : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                        d.status === 'MATCH'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : d.status === 'MISMATCH'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {d.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Issues / Exceptions */}
      {activeTab === 'issues' && (
        <div className="space-y-3">
          {issueRows.map((d) => (
            <div
              key={d.id}
              className={`p-4 rounded-xl border bg-white shadow-2xs space-y-2 ${
                d.status === 'MISMATCH' ? 'border-rose-200' : 'border-amber-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-slate-900">{d.code || 'NO-CODE'}</span>
                  <span className="font-bold text-sm text-slate-900">{d.name}</span>
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                    d.status === 'MISMATCH'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {d.status}
                </span>
              </div>

              <div className="text-xs text-slate-600 flex flex-wrap items-center gap-2">
                <span>Dept: <strong>{d.department}</strong></span>
                <span>&bull;</span>
                <span>Sem {d.sem} (Regulation {d.reg})</span>
                <span>&bull;</span>
                <span>Faculty: <strong>{d.faculty}</strong></span>
                <span>&bull;</span>
                <span>Plan Credits: <strong>{d.credits ?? '—'}</strong> (Syllabus: {d.syllabusCredits ?? '—'})</span>
              </div>

              <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                <strong>Verification Note:</strong> {d.note || 'Discrepancy detected between workload plan and standard syllabus. Please inspect and update in Subject Register.'}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Academic Policy Footer Notice */}
      <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 text-xs text-blue-900 leading-relaxed">
        <strong>Interpretation Policy:</strong> Weekly Contact Hours = L + T + P periods per week from the verified syllabus catalogue. For theory courses, teaching hours = L + T; for labs, practical hours = P. For Laboratory Integrated Theory (LIT), both components are retained and displayed separately to prevent double counting.
      </div>
    </div>
  );
};
