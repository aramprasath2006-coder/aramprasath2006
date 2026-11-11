import React from 'react';
import {
  Search,
  Filter,
  X,
  Building2,
  GraduationCap,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { DepartmentRecord, FacultyDesignation } from '../../types/rbac';

export interface FacultyFilterState {
  searchQuery: string;
  departmentId: string;
  designation: string;
}

interface FacultySearchFilterBarProps {
  filterState: FacultyFilterState;
  onFilterChange: (updates: Partial<FacultyFilterState>) => void;
  onResetFilters: () => void;
  departments: DepartmentRecord[];
  totalFacultyCount: number;
  filteredFacultyCount: number;
  departmentFacultyCounts: Record<string, number>;
}

const DESIGNATION_OPTIONS: { label: string; value: string }[] = [
  { label: 'All Designations', value: 'all' },
  { label: 'Professors', value: 'Professor' },
  { label: 'Associate Professors', value: 'Associate Professor' },
  { label: 'Assistant Professors', value: 'Assistant Professor' },
  { label: 'Other Faculty', value: 'Other Faculty Members' },
];

export const FacultySearchFilterBar: React.FC<FacultySearchFilterBarProps> = ({
  filterState,
  onFilterChange,
  onResetFilters,
  departments,
  totalFacultyCount,
  filteredFacultyCount,
  departmentFacultyCounts,
}) => {
  const hasActiveFilters =
    filterState.searchQuery.trim().length > 0 ||
    filterState.departmentId !== 'all' ||
    filterState.designation !== 'all';

  const selectedDepartment = departments.find((d) => d.id === filterState.departmentId);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-3.5 space-y-3">
      {/* Top Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
        {/* Search Input with Icon and Clear Button */}
        <div className="relative flex-1 min-w-[240px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-slate-400" />
          </div>
          <input
            type="text"
            value={filterState.searchQuery}
            onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
            placeholder="Search by faculty name, employee ID (e.g. KVCET-001), or department..."
            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          {filterState.searchQuery && (
            <button
              onClick={() => onFilterChange({ searchQuery: '' })}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdowns Row */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          {/* Department Filter Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs flex-1 sm:flex-initial">
            <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="font-extrabold text-slate-500 text-[10px] uppercase tracking-wider shrink-0">
              Dept:
            </span>
            <select
              value={filterState.departmentId}
              onChange={(e) => onFilterChange({ departmentId: e.target.value })}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer max-w-[180px] truncate"
            >
              <option value="all">All Departments ({totalFacultyCount})</option>
              {departments.map((d) => {
                const count = departmentFacultyCounts[d.id] || 0;
                return (
                  <option key={d.id} value={d.id}>
                    {d.code} – {d.name} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Designation Filter Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs flex-1 sm:flex-initial">
            <GraduationCap className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="font-extrabold text-slate-500 text-[10px] uppercase tracking-wider shrink-0">
              Role:
            </span>
            <select
              value={filterState.designation}
              onChange={(e) => onFilterChange({ designation: e.target.value })}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              {DESIGNATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer shrink-0"
              title="Reset all filters"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Filter Chips & Results Count Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
        {/* Results Counter */}
        <div className="flex items-center gap-2 text-slate-600">
          <span className="text-[11px] font-semibold">
            Showing <strong className="text-slate-900 font-mono">{filteredFacultyCount}</strong> of{' '}
            <span className="font-mono">{totalFacultyCount}</span> faculty members
          </span>
          {hasActiveFilters && (
            <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
              Filtered
            </span>
          )}
        </div>

        {/* Active Filter Badges */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-1.5">
            {filterState.searchQuery && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200">
                <span>Keyword: &ldquo;{filterState.searchQuery}&rdquo;</span>
                <button
                  onClick={() => onFilterChange({ searchQuery: '' })}
                  className="hover:text-rose-600 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedDepartment && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-medium border border-blue-200">
                <span>Dept: {selectedDepartment.code}</span>
                <button
                  onClick={() => onFilterChange({ departmentId: 'all' })}
                  className="hover:text-rose-600 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filterState.designation !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-medium border border-indigo-200">
                <span>{filterState.designation}</span>
                <button
                  onClick={() => onFilterChange({ designation: 'all' })}
                  className="hover:text-rose-600 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
