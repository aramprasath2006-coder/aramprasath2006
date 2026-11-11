import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  CheckCircle2,
  Search,
  Filter,
  Save,
  RotateCcw,
  X,
  User,
  GraduationCap,
  Building2,
  Calendar,
  CheckSquare,
  Square,
  MinusSquare,
  UserCheck,
  AlertTriangle,
  Check,
  Layers,
  Sparkles,
} from 'lucide-react';
import { AllocationRecord, CourseCategory } from '../../types/workload';
import { apiClient } from '../../api/client';

interface SubjectRegisterPageProps {
  data: AllocationRecord[];
  onUpdateRow: (index: number, key: keyof AllocationRecord, value: any) => void;
  onRemoveRow: (index: number) => void;
  onAddRow: () => void;
  onBulkAssignFaculty?: (ids: string[], facultyName: string) => void;
  onBulkDelete?: (ids: string[]) => void;
}

export const SubjectRegisterPage: React.FC<SubjectRegisterPageProps> = ({
  data,
  onUpdateRow,
  onRemoveRow,
  onAddRow,
  onBulkAssignFaculty,
  onBulkDelete,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedSem, setSelectedSem] = useState<string>('all');

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isAssignFacultyModalOpen, setIsAssignFacultyModalOpen] = useState(false);
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
  const [targetFacultyName, setTargetFacultyName] = useState('');
  const [customFacultyName, setCustomFacultyName] = useState('');
  const [useCustomFaculty, setUseCustomFaculty] = useState(false);
  const [registeredFaculty, setRegisteredFaculty] = useState<string[]>([]);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const selectAllRef = useRef<HTMLInputElement>(null);

  // Load registered faculty from permanent database
  useEffect(() => {
    let active = true;
    apiClient
      .getFaculty()
      .then((list) => {
        if (active && Array.isArray(list)) {
          const names = list.map((f) => (f.fullName || '').trim()).filter(Boolean);
          setRegisteredFaculty(names);
        }
      })
      .catch(() => {
        // Fallback silently if offline
      });
    return () => {
      active = false;
    };
  }, []);

  // Extract unique filter options from data
  const facultyOptions = useMemo(() => {
    const set = new Set<string>();
    data.forEach((item) => {
      const fac = item.faculty?.trim();
      if (fac) set.add(fac);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [data]);

  // Combined faculty pool (existing allocations + registered DB staff)
  const allAvailableFaculty = useMemo(() => {
    const set = new Set<string>();
    facultyOptions.forEach((f) => set.add(f));
    registeredFaculty.forEach((f) => set.add(f));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [facultyOptions, registeredFaculty]);

  const departmentOptions = useMemo(() => {
    const set = new Set<string>();
    data.forEach((item) => {
      const dept = item.department?.trim();
      if (dept) set.add(dept);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [data]);

  const semesterOptions = useMemo(() => {
    const set = new Set<string>();
    data.forEach((item) => {
      const sem = item.sem !== undefined && item.sem !== null ? String(item.sem).trim() : '';
      if (sem) set.add(sem);
    });
    return Array.from(set).sort((a, b) => {
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });
  }, [data]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedFaculty !== 'all' ||
    selectedCategory !== 'all' ||
    selectedDepartment !== 'all' ||
    selectedSem !== 'all';

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedFaculty('all');
    setSelectedCategory('all');
    setSelectedDepartment('all');
    setSelectedSem('all');
  };

  const filteredData = useMemo(() => {
    return data.filter((d) => {
      // 1. Text search by course code, title, assigned faculty name, or department
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesCode = (d.code || '').toLowerCase().includes(q);
        const matchesName = (d.name || '').toLowerCase().includes(q);
        const matchesFaculty = (d.faculty || '').toLowerCase().includes(q);
        const matchesDept = (d.department || '').toLowerCase().includes(q);
        if (!matchesCode && !matchesName && !matchesFaculty && !matchesDept) {
          return false;
        }
      }

      // 2. Faculty dropdown filter
      if (selectedFaculty !== 'all') {
        if (selectedFaculty === '__unassigned__') {
          if (d.faculty && d.faculty.trim() !== '') return false;
        } else {
          if ((d.faculty || '').trim() !== selectedFaculty) return false;
        }
      }

      // 3. Category / Course Type dropdown filter
      if (selectedCategory !== 'all') {
        if (d.type !== selectedCategory) return false;
      }

      // 4. Department dropdown filter
      if (selectedDepartment !== 'all') {
        if ((d.department || '').trim() !== selectedDepartment) return false;
      }

      // 5. Semester dropdown filter
      if (selectedSem !== 'all') {
        const itemSem = d.sem !== undefined && d.sem !== null ? String(d.sem).trim() : '';
        if (itemSem !== selectedSem) return false;
      }

      return true;
    });
  }, [data, searchQuery, selectedFaculty, selectedCategory, selectedDepartment, selectedSem]);

  // Multi-select helpers
  const allFilteredSelected = useMemo(() => {
    return (
      filteredData.length > 0 &&
      filteredData.every((item) => selectedIds.has(item.id))
    );
  }, [filteredData, selectedIds]);

  const someFilteredSelected = useMemo(() => {
    return (
      filteredData.some((item) => selectedIds.has(item.id)) &&
      !allFilteredSelected
    );
  }, [filteredData, selectedIds, allFilteredSelected]);

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someFilteredSelected;
    }
  }, [someFilteredSelected]);

  const toggleSelectAll = () => {
    const next = new Set(selectedIds);
    if (allFilteredSelected) {
      filteredData.forEach((item) => next.delete(item.id));
    } else {
      filteredData.forEach((item) => next.add(item.id));
    }
    setSelectedIds(next);
  };

  const toggleSelectRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  // Bulk actions executions
  const handleOpenAssignModal = () => {
    if (selectedIds.size === 0) return;
    setTargetFacultyName(allAvailableFaculty[0] || '');
    setCustomFacultyName('');
    setUseCustomFaculty(false);
    setIsAssignFacultyModalOpen(true);
  };

  const handleExecuteBulkAssign = () => {
    const finalFaculty = useCustomFaculty ? customFacultyName.trim() : targetFacultyName.trim();
    if (!finalFaculty) return;
    const ids = Array.from(selectedIds);

    if (onBulkAssignFaculty) {
      onBulkAssignFaculty(ids, finalFaculty);
    } else {
      ids.forEach((id) => {
        const idx = data.findIndex((item) => item.id === id);
        if (idx >= 0) {
          onUpdateRow(idx, 'faculty', finalFaculty);
        }
      });
    }

    setNotification({
      type: 'success',
      message: `Assigned faculty "${finalFaculty}" to ${ids.length} selected subjects.`,
    });
    setTimeout(() => setNotification(null), 4000);
    clearSelection();
    setIsAssignFacultyModalOpen(false);
  };

  const handleExecuteBulkDelete = () => {
    const ids = Array.from(selectedIds);
    if (onBulkDelete) {
      onBulkDelete(ids);
    } else {
      const indices = ids
        .map((id) => data.findIndex((item) => item.id === id))
        .filter((idx) => idx >= 0)
        .sort((a, b) => b - a);
      indices.forEach((idx) => onRemoveRow(idx));
    }

    setNotification({
      type: 'info',
      message: `Removed ${ids.length} selected subjects from the register.`,
    });
    setTimeout(() => setNotification(null), 4000);
    clearSelection();
    setIsDeleteConfirmModalOpen(false);
  };

  // Selected subjects preview list
  const selectedRecords = useMemo(() => {
    return data.filter((item) => selectedIds.has(item.id));
  }, [data, selectedIds]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600 font-mono">
            Master Course Catalogue &bull; Inline Editable Register
          </span>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
            Subject Allocation Register
          </h2>
          <p className="text-xs text-slate-500">
            Edit courses, reassign faculty, update L–T–P hours, or add new subjects with instant local autosave
          </p>
        </div>

        <button
          onClick={onAddRow}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Allocation</span>
        </button>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold animate-in fade-in duration-200 ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Info Notice */}
      <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-center justify-between text-xs text-blue-900">
        <div className="flex items-center space-x-2">
          <Save className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            <strong>Local Autosave Active:</strong> Any inline edit to course titles, faculty assignments, or L-T-P is saved immediately in your browser.
          </span>
        </div>
        <span className="font-mono font-bold text-blue-700">{data.length} Total Records</span>
      </div>

      {/* Sticky / Floating Bulk Action Toolbar */}
      {selectedIds.size > 0 && (
        <div className="sticky top-2 z-30 bg-slate-900 text-white p-3.5 rounded-xl shadow-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-mono font-black flex items-center gap-1.5">
              <CheckSquare className="w-3.5 h-3.5 text-blue-400" />
              {selectedIds.size} Selected
            </span>
            <span className="text-xs text-slate-300 font-medium">
              of {data.length} subjects
            </span>

            {filteredData.length > 0 && selectedIds.size < filteredData.length && (
              <button
                onClick={() => {
                  const next = new Set(selectedIds);
                  filteredData.forEach((d) => next.add(d.id));
                  setSelectedIds(next);
                }}
                className="text-xs text-blue-400 hover:text-blue-300 underline font-semibold cursor-pointer ml-1.5"
              >
                Select all {filteredData.length} filtered
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Assign Faculty Button */}
            <button
              onClick={handleOpenAssignModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition-colors cursor-pointer"
              title="Bulk assign faculty to selected subjects"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Assign Faculty</span>
            </button>

            {/* Delete Selected Button */}
            <button
              onClick={() => setIsDeleteConfirmModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-xs transition-colors cursor-pointer"
              title="Delete all selected subjects"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected</span>
            </button>

            {/* Deselect All */}
            <button
              onClick={clearSelection}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="Deselect all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Search and Filters Control Panel */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Main Search Input */}
          <div className="lg:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by course code, title, or assigned faculty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium placeholder:text-slate-400 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Faculty Dropdown Filter */}
          <div className="lg:col-span-2 relative">
            <div className="relative">
              <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={selectedFaculty}
                onChange={(e) => setSelectedFaculty(e.target.value)}
                className="w-full pl-8 pr-7 py-2 text-xs bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 cursor-pointer appearance-none transition-colors"
              >
                <option value="all">All Faculty ({facultyOptions.length})</option>
                <option value="__unassigned__">-- Unassigned --</option>
                {facultyOptions.map((fac) => (
                  <option key={fac} value={fac}>
                    {fac}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Category Dropdown Filter */}
          <div className="lg:col-span-2 relative">
            <div className="relative">
              <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-8 pr-7 py-2 text-xs bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 cursor-pointer appearance-none transition-colors"
              >
                <option value="all">All Categories</option>
                <option value="Theory">Theory</option>
                <option value="Lab">Lab</option>
                <option value="LIT">LIT</option>
                <option value="Other">Other</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Department Dropdown Filter */}
          <div className="lg:col-span-2 relative">
            <div className="relative">
              <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full pl-8 pr-7 py-2 text-xs bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 cursor-pointer appearance-none transition-colors"
              >
                <option value="all">All Depts ({departmentOptions.length})</option>
                {departmentOptions.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Semester Dropdown Filter */}
          <div className="lg:col-span-2 relative">
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={selectedSem}
                onChange={(e) => setSelectedSem(e.target.value)}
                className="w-full pl-8 pr-7 py-2 text-xs bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 cursor-pointer appearance-none transition-colors"
              >
                <option value="all">All Semesters</option>
                {semesterOptions.map((sem) => (
                  <option key={sem} value={sem}>
                    Sem {sem}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Results count & Active filter tags bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-1.5 text-slate-600">
            <span className="font-semibold text-slate-800">
              Showing <span className="font-mono text-blue-600 font-bold">{filteredData.length}</span> of {data.length} subjects
            </span>

            {hasActiveFilters && (
              <span className="text-slate-300 mx-1">|</span>
            )}

            {/* Filter Badges */}
            {searchQuery.trim() && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-[11px] font-semibold text-blue-700">
                Keyword: &ldquo;{searchQuery}&rdquo;
                <button
                  onClick={() => setSearchQuery('')}
                  className="hover:text-blue-900 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedFaculty !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-[11px] font-semibold text-indigo-700">
                Faculty: {selectedFaculty === '__unassigned__' ? 'Unassigned' : selectedFaculty}
                <button
                  onClick={() => setSelectedFaculty('all')}
                  className="hover:text-indigo-900 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedCategory !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-[11px] font-semibold text-amber-700">
                Type: {selectedCategory}
                <button
                  onClick={() => setSelectedCategory('all')}
                  className="hover:text-amber-900 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedDepartment !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-700">
                Dept: {selectedDepartment}
                <button
                  onClick={() => setSelectedDepartment('all')}
                  className="hover:text-emerald-900 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedSem !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 border border-purple-200 text-[11px] font-semibold text-purple-700">
                Sem: {selectedSem}
                <button
                  onClick={() => setSelectedSem('all')}
                  className="hover:text-purple-900 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset All Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Editable Table with Multi-Select */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700 min-w-[1280px]">
          <thead className="bg-slate-50 text-[10px] uppercase tracking-wider font-extrabold text-slate-500 border-b border-slate-200">
            <tr>
              {/* Multi-Select Master Checkbox */}
              <th className="px-3 py-3 w-10 text-center">
                <input
                  type="checkbox"
                  ref={selectAllRef}
                  checked={allFilteredSelected}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                  title={allFilteredSelected ? 'Deselect all filtered' : 'Select all filtered'}
                />
              </th>
              <th className="px-3 py-3 w-16">Sem</th>
              <th className="px-3 py-3 w-28">Course Code</th>
              <th className="px-4 py-3 min-w-[220px]">Subject Title</th>
              <th className="px-4 py-3 min-w-[170px]">Faculty In-charge</th>
              <th className="px-2 py-3 w-16 text-center">Plan Cr</th>
              <th className="px-3 py-3 w-28">Category</th>
              <th className="px-2 py-3 w-16 text-center">Reg</th>
              <th className="px-3 py-3 w-36 text-center">L – T – P Periods</th>
              <th className="px-2 py-3 w-16 text-center">Syl Cr</th>
              <th className="px-3 py-3 min-w-[140px]">Department</th>
              <th className="px-3 py-3 text-center w-20">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-12 text-center">
                  <div className="max-w-sm mx-auto flex flex-col items-center justify-center text-slate-500">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2.5">
                      <Search className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">No matching subjects found</p>
                    <p className="text-xs text-slate-400 mt-0.5 mb-3">
                      Try adjusting your search keywords or clear the active filter dropdowns.
                    </p>
                    {hasActiveFilters && (
                      <button
                        onClick={handleResetFilters}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Clear All Filters</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredData.map((d, origIdx) => {
                const realIndex = data.findIndex((item) => item.id === d.id);
                const idx = realIndex >= 0 ? realIndex : origIdx;
                const isSelected = selectedIds.has(d.id);

                return (
                  <tr
                    key={d.id}
                    className={`transition-colors ${
                      isSelected
                        ? 'bg-blue-50/70 border-l-2 border-l-blue-600'
                        : 'hover:bg-slate-50/70'
                    }`}
                  >
                    {/* Row Select Checkbox */}
                    <td className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectRow(d.id)}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                        title={`Select ${d.code || d.name}`}
                      />
                    </td>

                    {/* Sem */}
                    <td className="px-2.5 py-2">
                      <input
                        type="text"
                        value={d.sem || ''}
                        onChange={(e) => onUpdateRow(idx, 'sem', e.target.value)}
                        className="w-12 px-1.5 py-1 font-mono font-bold text-center bg-slate-50 hover:bg-white border border-slate-200 rounded focus:border-blue-500 focus:bg-white"
                      />
                    </td>

                    {/* Code */}
                    <td className="px-2.5 py-2">
                      <input
                        type="text"
                        value={d.code || ''}
                        onChange={(e) => onUpdateRow(idx, 'code', e.target.value.toUpperCase())}
                        placeholder="Code"
                        className="w-24 px-2 py-1 font-mono font-bold text-indigo-700 bg-slate-50 hover:bg-white border border-slate-200 rounded focus:border-blue-500 focus:bg-white"
                      />
                    </td>

                    {/* Subject Name */}
                    <td className="px-2.5 py-2">
                      <input
                        type="text"
                        value={d.name || ''}
                        onChange={(e) => onUpdateRow(idx, 'name', e.target.value)}
                        className="w-full px-2.5 py-1 font-bold text-slate-900 bg-slate-50 hover:bg-white border border-slate-200 rounded focus:border-blue-500 focus:bg-white"
                      />
                    </td>

                    {/* Faculty */}
                    <td className="px-2.5 py-2">
                      <input
                        type="text"
                        value={d.faculty || ''}
                        onChange={(e) => onUpdateRow(idx, 'faculty', e.target.value)}
                        className="w-full px-2.5 py-1 font-semibold text-slate-800 bg-slate-50 hover:bg-white border border-slate-200 rounded focus:border-blue-500 focus:bg-white"
                      />
                    </td>

                    {/* Credits */}
                    <td className="px-2 py-2 text-center">
                      <input
                        type="number"
                        step="0.5"
                        value={d.credits !== null && d.credits !== undefined ? d.credits : ''}
                        onChange={(e) =>
                          onUpdateRow(idx, 'credits', e.target.value === '' ? null : Number(e.target.value))
                        }
                        className="w-12 px-1 py-1 font-mono text-center bg-slate-50 hover:bg-white border border-slate-200 rounded focus:border-blue-500 focus:bg-white"
                      />
                    </td>

                    {/* Category */}
                    <td className="px-2.5 py-2">
                      <select
                        value={d.type}
                        onChange={(e) => onUpdateRow(idx, 'type', e.target.value as CourseCategory)}
                        className="w-full px-2 py-1 bg-slate-50 hover:bg-white border border-slate-200 rounded text-[11px] font-bold focus:border-blue-500 cursor-pointer"
                      >
                        <option value="Theory">Theory</option>
                        <option value="LIT">LIT</option>
                        <option value="Lab">Lab</option>
                        <option value="Other">Other</option>
                      </select>
                    </td>

                    {/* Regulation */}
                    <td className="px-2 py-2 text-center">
                      <input
                        type="text"
                        value={d.reg || ''}
                        onChange={(e) => onUpdateRow(idx, 'reg', e.target.value)}
                        className="w-12 px-1 py-1 font-mono text-center bg-slate-50 hover:bg-white border border-slate-200 rounded focus:border-blue-500 focus:bg-white"
                      />
                    </td>

                    {/* L - T - P */}
                    <td className="px-2.5 py-2">
                      <div className="flex items-center space-x-1 justify-center">
                        <input
                          type="number"
                          placeholder="L"
                          title="Lecture Periods"
                          value={d.L !== null && d.L !== undefined ? d.L : ''}
                          onChange={(e) =>
                            onUpdateRow(idx, 'L', e.target.value === '' ? null : Number(e.target.value))
                          }
                          className="w-10 px-1 py-1 font-mono text-center bg-blue-50/60 border border-blue-200 rounded focus:bg-white text-blue-900 font-bold"
                        />
                        <span className="text-slate-400 font-bold">–</span>
                        <input
                          type="number"
                          placeholder="T"
                          title="Tutorial Periods"
                          value={d.T !== null && d.T !== undefined ? d.T : ''}
                          onChange={(e) =>
                            onUpdateRow(idx, 'T', e.target.value === '' ? null : Number(e.target.value))
                          }
                          className="w-10 px-1 py-1 font-mono text-center bg-cyan-50/60 border border-cyan-200 rounded focus:bg-white text-cyan-900 font-bold"
                        />
                        <span className="text-slate-400 font-bold">–</span>
                        <input
                          type="number"
                          placeholder="P"
                          title="Practical Periods"
                          value={d.P !== null && d.P !== undefined ? d.P : ''}
                          onChange={(e) =>
                            onUpdateRow(idx, 'P', e.target.value === '' ? null : Number(e.target.value))
                          }
                          className="w-10 px-1 py-1 font-mono text-center bg-emerald-50/60 border border-emerald-200 rounded focus:bg-white text-emerald-900 font-bold"
                        />
                      </div>
                    </td>

                    {/* Syllabus Credits */}
                    <td className="px-2 py-2 text-center">
                      <input
                        type="number"
                        step="0.5"
                        value={d.syllabusCredits !== null && d.syllabusCredits !== undefined ? d.syllabusCredits : ''}
                        onChange={(e) =>
                          onUpdateRow(idx, 'syllabusCredits', e.target.value === '' ? null : Number(e.target.value))
                        }
                        className="w-12 px-1 py-1 font-mono text-center bg-slate-50 hover:bg-white border border-slate-200 rounded focus:border-blue-500 focus:bg-white"
                      />
                    </td>

                    {/* Department */}
                    <td className="px-2.5 py-2">
                      <input
                        type="text"
                        value={d.department || ''}
                        onChange={(e) => onUpdateRow(idx, 'department', e.target.value)}
                        className="w-full px-2 py-1 text-slate-700 bg-slate-50 hover:bg-white border border-slate-200 rounded focus:border-blue-500 focus:bg-white text-[11px]"
                      />
                    </td>

                    {/* Actions */}
                    <td className="px-2 py-2 text-center">
                      <button
                        onClick={() => {
                          onRemoveRow(idx);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Remove Allocation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ==================== MODAL 1: BULK ASSIGN FACULTY ==================== */}
      {isAssignFacultyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Bulk Assign Faculty
                  </h3>
                  <p className="text-xs text-slate-500">
                    Update the Faculty In-Charge for {selectedIds.size} selected subjects
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAssignFacultyModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Selected Courses Preview Chips */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                Selected Course Allocations ({selectedIds.size})
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200/80">
                {selectedRecords.slice(0, 6).map((rec) => (
                  <span
                    key={rec.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[11px] font-mono font-semibold text-slate-700 shadow-2xs"
                  >
                    <span className="text-blue-600 font-bold">{rec.code || 'NO-CODE'}</span>
                    <span className="truncate max-w-[120px] text-slate-600">{rec.name}</span>
                  </span>
                ))}
                {selectedRecords.length > 6 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-100 text-[11px] font-bold text-blue-700">
                    +{selectedRecords.length - 6} more
                  </span>
                )}
              </div>
            </div>

            {/* Faculty Selection Controls */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 block">
                Assign to Faculty Member
              </label>

              {/* Selection Mode Toggle */}
              <div className="flex rounded-lg bg-slate-100 p-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setUseCustomFaculty(false)}
                  className={`flex-1 py-1.5 rounded-md transition-all cursor-pointer ${
                    !useCustomFaculty
                      ? 'bg-white text-blue-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Select from Faculty List ({allAvailableFaculty.length})
                </button>
                <button
                  type="button"
                  onClick={() => setUseCustomFaculty(true)}
                  className={`flex-1 py-1.5 rounded-md transition-all cursor-pointer ${
                    useCustomFaculty
                      ? 'bg-white text-blue-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Enter Custom Name
                </button>
              </div>

              {!useCustomFaculty ? (
                <div className="space-y-1">
                  <select
                    value={targetFacultyName}
                    onChange={(e) => setTargetFacultyName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 cursor-pointer"
                  >
                    {allAvailableFaculty.length === 0 ? (
                      <option value="">No faculty registered</option>
                    ) : (
                      allAvailableFaculty.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))
                    )}
                  </select>
                  <p className="text-[11px] text-slate-400">
                    Includes active allocations and registered institutional faculty from database.
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <input
                    type="text"
                    placeholder="Enter full faculty name (e.g. Dr. K. Ramanathan)"
                    value={customFacultyName}
                    onChange={(e) => setCustomFacultyName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
                  />
                  <p className="text-[11px] text-slate-400">
                    Type a faculty name to assign directly to all selected subjects.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAssignFacultyModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteBulkAssign}
                disabled={!useCustomFaculty ? !targetFacultyName : !customFacultyName.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Apply to {selectedIds.size} Subjects</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL 2: CONFIRM BULK DELETE ==================== */}
      {isDeleteConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  Delete {selectedIds.size} Selected Subjects?
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Are you sure you want to remove these {selectedIds.size} course allocations from the register?
                  This action can be undone using the top-level <strong>Undo</strong> button.
                </p>
              </div>
            </div>

            {/* Selected Courses Preview */}
            <div className="max-h-32 overflow-y-auto p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
              {selectedRecords.map((rec) => (
                <div key={rec.id} className="flex items-center justify-between text-[11px] text-slate-700">
                  <span className="font-mono font-bold text-rose-700">{rec.code || 'NO-CODE'}</span>
                  <span className="truncate max-w-[200px] text-slate-600 font-medium">{rec.name}</span>
                  <span className="text-slate-400 text-[10px]">{rec.department}</span>
                </div>
              ))}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsDeleteConfirmModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteBulkDelete}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Delete {selectedIds.size} Subjects</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
