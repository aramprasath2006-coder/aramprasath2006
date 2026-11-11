import React, { useState } from 'react';
import {
  Layers,
  Download,
  Filter,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';
import { AllocationRecord } from '../../types/workload';
import { filterFacultyByTheoryCount, exportTheoryGroupToCSV } from '../../utils/kvcetEngine';

interface TheoryGroupsPageProps {
  data: AllocationRecord[];
}

export const TheoryGroupsPage: React.FC<TheoryGroupsPageProps> = ({ data }) => {
  const [activeCount, setActiveCount] = useState<number>(1);
  const [deptFilter, setDeptFilter] = useState<string>('all');

  const departments = Array.from(new Set(data.map((d) => d.department || 'Unspecified'))).sort();
  const groupedFaculty = filterFacultyByTheoryCount(data, activeCount, deptFilter);

  const handleExport = () => {
    exportTheoryGroupToCSV(groupedFaculty, activeCount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600 font-mono">
            Separate Theory Allocation Module &bull; Academic Load Partitioning
          </span>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
            Faculty Grouped by Theory Papers
          </h2>
          <p className="text-xs text-slate-500">
            Dedicated tabulated lists for professors and instructors handling exactly 1, 2, or 3 theory papers
          </p>
        </div>

        <button
          onClick={handleExport}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export {activeCount} Theory CSV</span>
        </button>
      </div>

      {/* Filter & Group Switcher Tabs */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Count Tabs */}
        <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
          {[1, 2, 3].map((count) => {
            const isActive = activeCount === count;
            return (
              <button
                key={count}
                onClick={() => setActiveCount(count)}
                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {count} Theory {count === 1 ? 'Paper' : 'Papers'}
              </button>
            );
          })}
        </div>

        {/* Department Dropdown */}
        <div className="flex items-center space-x-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold text-slate-500">Department:</span>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium cursor-pointer"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Group Register Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Faculty Handling Exactly {activeCount} {activeCount === 1 ? 'Theory Paper' : 'Theory Papers'}
            </h3>
            <p className="text-xs text-slate-500">
              {groupedFaculty.length} faculty identified in {deptFilter === 'all' ? 'all departments' : deptFilter}
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            {groupedFaculty.length} Staff Members
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 min-w-[850px]">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider font-extrabold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-center w-14">S. No.</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Faculty Name</th>
                <th className="px-3 py-3 text-center">Paper Count</th>
                <th className="px-4 py-3">Course Code</th>
                <th className="px-5 py-3">Subject / Theory Paper</th>
                <th className="px-3 py-3 text-center">Semester</th>
                <th className="px-3 py-3 text-center">Regulation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {groupedFaculty.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                    No faculty found with exactly {activeCount} theory {activeCount === 1 ? 'paper' : 'papers'} in this department filter.
                  </td>
                </tr>
              ) : (
                (() => {
                  let serial = 1;
                  return groupedFaculty.flatMap((g) =>
                    g.courses.map((course, idx) => (
                      <tr
                        key={`${g.facultyName}-${course.id}`}
                        className={`hover:bg-slate-50/70 transition-colors ${
                          idx === 0 ? 'border-t-2 border-slate-200/60' : ''
                        }`}
                      >
                        <td className="px-4 py-3 text-center font-mono text-slate-500">
                          {idx === 0 ? serial++ : ''}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{idx === 0 ? g.department : ''}</td>
                        <td className="px-4 py-3 font-bold text-slate-900">
                          {idx === 0 ? g.facultyName : ''}
                        </td>
                        <td className="px-3 py-3 text-center">
                          {idx === 0 ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                              {g.theoryCount}
                            </span>
                          ) : (
                            ''
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-indigo-700">
                          {course.code || '—'}
                        </td>
                        <td className="px-5 py-3 font-semibold text-slate-800">
                          <span>{course.name}</span>
                          {course.type === 'LIT' && (
                            <span className="ml-2 px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              LIT
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-center font-mono">{course.sem || '—'}</td>
                        <td className="px-3 py-3 text-center font-mono">{course.reg || '—'}</td>
                      </tr>
                    ))
                  );
                })()
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-slate-100/70 border border-slate-200 text-xs text-slate-600 leading-relaxed">
        <strong>Academic Policy Note:</strong> Theory paper count aggregates both pure theoretical courses (L+T) and Laboratory Integrated Theory (LIT) subjects. Faculty members are grouped by department and name; only exact counts of {activeCount} are reported in this view for academic auditing.
      </div>
    </div>
  );
};
