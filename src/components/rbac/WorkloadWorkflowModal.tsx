import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Building2,
  GraduationCap,
  Users2,
  UserPlus,
  Trash2,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Layers,
  Calendar,
  Save,
} from 'lucide-react';
import {
  DepartmentRecord,
  FacultyRecord,
  FacultyWorkloadDetail,
  WorkloadProgressReport,
  UserProfile,
} from '../../types/rbac';
import { apiClient } from '../../api/client';

interface WorkloadWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReportSaved: (report: WorkloadProgressReport) => void;
  currentUser: UserProfile;
}

interface AdditionalFaculty {
  id: string;
  name: string;
  designation: string;
}

export const WorkloadWorkflowModal: React.FC<WorkloadWorkflowModalProps> = ({
  isOpen,
  onClose,
  onReportSaved,
  currentUser,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);
  const [deptFaculty, setDeptFaculty] = useState<FacultyRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Workflow State:
  // Step 1: Department
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');

  // Step 2: HOD Name
  const [hodMode, setHodMode] = useState<'registered' | 'manual'>('registered');
  const [hodName, setHodName] = useState<string>('');
  const [hodDesignation, setHodDesignation] = useState<string>('Professor & Head');

  // Step 3 & 4: Selected faculty & Additional faculty
  const [selectedFacultyIds, setSelectedFacultyIds] = useState<string[]>([]);
  const [additionalFaculty, setAdditionalFaculty] = useState<AdditionalFaculty[]>([]);

  // Step 5: Workload details per faculty
  const [workloadDetails, setWorkloadDetails] = useState<Record<string, FacultyWorkloadDetail>>({});

  // Step 6: Review and finalize
  const [reportTitle, setReportTitle] = useState<string>('');
  const [submissionDate, setSubmissionDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [progressStatus, setProgressStatus] = useState<'Pending' | 'In Progress' | 'Completed'>(
    'In Progress'
  );
  const [academicYear, setAcademicYear] = useState<string>('2026–2027');
  const [semester, setSemester] = useState<string>('Even');
  const [saving, setSaving] = useState<boolean>(false);

  // Fetch departments on mount
  useEffect(() => {
    if (isOpen) {
      loadDepartments();
    }
  }, [isOpen]);

  const loadDepartments = async () => {
    setLoading(true);
    setError(null);
    try {
      const depts = await apiClient.getDepartments();
      setDepartments(depts);
      if (depts.length > 0 && !selectedDeptId) {
        setSelectedDeptId(depts[0].id);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  // When selected department changes, fetch strictly its faculty
  useEffect(() => {
    if (!selectedDeptId) {
      setDeptFaculty([]);
      return;
    }
    const targetDept = departments.find((d) => d.id === selectedDeptId);
    if (targetDept) {
      // Step 2 HOD default
      if (targetDept.hodName) {
        setHodName(targetDept.hodName);
        setHodDesignation(targetDept.hodDesignation || 'Professor & Head');
        setHodMode('registered');
      } else {
        setHodName('');
        setHodMode('manual');
      }
      setReportTitle(`${targetDept.code} – ${targetDept.name} Workload Progress Report`);
    }

    // Load faculty belonging strictly to this department
    apiClient
      .getFaculty(selectedDeptId)
      .then((facs) => {
        setDeptFaculty(facs);
        // Pre-select all registered faculty by default
        setSelectedFacultyIds(facs.map((f) => f.id));
      })
      .catch((err) => {
        console.warn('Notice: Failed to load department faculty:', err?.message);
      });
  }, [selectedDeptId, departments]);

  if (!isOpen) return null;

  const selectedDepartment = departments.find((d) => d.id === selectedDeptId);

  // Helper to sync workload details when entering Step 5
  const prepareWorkloadDetails = () => {
    const detailsMap: Record<string, FacultyWorkloadDetail> = { ...workloadDetails };

    // Registered faculty selected
    const chosenRegistered = deptFaculty.filter((f) => selectedFacultyIds.includes(f.id));
    chosenRegistered.forEach((fac) => {
      if (!detailsMap[fac.id]) {
        detailsMap[fac.id] = {
          facultyId: fac.id,
          facultyName: fac.fullName,
          designation: fac.designation,
          theoryHours: 6,
          labHours: 6,
          totalHours: 12,
          assignedCourses: 'Core Subjects / Labs',
          progressPercentage: 65,
          progressNotes: 'Curriculum delivery on schedule; continuous internal assessment underway.',
          complianceStatus: 'Optimal',
        };
      }
    });

    // Additional faculty
    additionalFaculty.forEach((extra) => {
      if (!detailsMap[extra.id]) {
        detailsMap[extra.id] = {
          facultyName: extra.name,
          designation: extra.designation,
          theoryHours: 4,
          labHours: 4,
          totalHours: 8,
          assignedCourses: 'Departmental Elective / Lab',
          progressPercentage: 50,
          progressNotes: 'Initial modules delivered.',
          complianceStatus: 'Optimal',
        };
      }
    });

    setWorkloadDetails(detailsMap);
  };

  // Navigation between steps
  const handleNextStep = () => {
    setError(null);

    if (currentStep === 1) {
      if (!selectedDeptId) {
        setError('Please select a department to proceed.');
        return;
      }
    } else if (currentStep === 2) {
      if (!hodName.trim()) {
        setError('Please enter or select the Head of Department (HOD) name.');
        return;
      }
    } else if (currentStep === 4) {
      const totalCount = selectedFacultyIds.length + additionalFaculty.length;
      if (totalCount === 0) {
        setError('Please select at least one faculty member or add an additional faculty member.');
        return;
      }
      prepareWorkloadDetails();
    }

    setCurrentStep((prev) => Math.min(6, prev + 1));
  };

  const handlePrevStep = () => {
    setError(null);
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  // Additional faculty management
  const handleAddAdditionalFaculty = () => {
    const newExtra: AdditionalFaculty = {
      id: `extra-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: `Faculty Member ${additionalFaculty.length + 1}`,
      designation: 'Assistant Professor',
    };
    setAdditionalFaculty([...additionalFaculty, newExtra]);
  };

  const handleRemoveAdditionalFaculty = (id: string) => {
    setAdditionalFaculty(additionalFaculty.filter((f) => f.id !== id));
    const nextDetails = { ...workloadDetails };
    delete nextDetails[id];
    setWorkloadDetails(nextDetails);
  };

  const handleUpdateAdditionalFaculty = (
    id: string,
    field: 'name' | 'designation',
    value: string
  ) => {
    setAdditionalFaculty(
      additionalFaculty.map((f) => (f.id === id ? { ...f, [field]: value } : f))
    );
    if (workloadDetails[id]) {
      setWorkloadDetails({
        ...workloadDetails,
        [id]: {
          ...workloadDetails[id],
          ...(field === 'name' ? { facultyName: value } : { designation: value }),
        },
      });
    }
  };

  // Workload details updater
  const handleWorkloadChange = (
    key: string,
    field: keyof FacultyWorkloadDetail,
    val: any
  ) => {
    const current = workloadDetails[key] || {
      facultyName: 'Faculty',
      designation: 'Assistant Professor',
      theoryHours: 0,
      labHours: 0,
      totalHours: 0,
      assignedCourses: '',
      progressPercentage: 50,
      progressNotes: '',
      complianceStatus: 'Optimal',
    };

    const updated = { ...current, [field]: val };

    if (field === 'theoryHours' || field === 'labHours') {
      const th = Number(field === 'theoryHours' ? val : current.theoryHours) || 0;
      const lb = Number(field === 'labHours' ? val : current.labHours) || 0;
      updated.totalHours = th + lb;
      if (updated.totalHours > 16) {
        updated.complianceStatus = 'Overloaded';
      } else if (updated.totalHours < 8) {
        updated.complianceStatus = 'Under Capacity';
      } else {
        updated.complianceStatus = 'Optimal';
      }
    }

    setWorkloadDetails({
      ...workloadDetails,
      [key]: updated,
    });
  };

  // Compile final report and save to database
  const handleSaveReport = async () => {
    if (!selectedDepartment) return;

    setSaving(true);
    setError(null);

    try {
      // Gather all selected faculty items
      const facultyWorkloadItems: FacultyWorkloadDetail[] = [];
      const facultyNameList: string[] = [];

      // Registered
      deptFaculty
        .filter((f) => selectedFacultyIds.includes(f.id))
        .forEach((f) => {
          facultyNameList.push(f.fullName);
          if (workloadDetails[f.id]) {
            facultyWorkloadItems.push(workloadDetails[f.id]);
          }
        });

      // Additional
      additionalFaculty.forEach((extra) => {
        if (extra.name.trim()) {
          facultyNameList.push(extra.name.trim());
          if (workloadDetails[extra.id]) {
            facultyWorkloadItems.push(workloadDetails[extra.id]);
          }
        }
      });

      // Compute average progress
      const avgProgress =
        facultyWorkloadItems.length > 0
          ? Math.round(
              facultyWorkloadItems.reduce((acc, curr) => acc + (curr.progressPercentage || 0), 0) /
                facultyWorkloadItems.length
            )
          : 0;

      const newReport = await apiClient.createWorkloadReport({
        reportTitle: reportTitle.trim() || `${selectedDepartment.name} Workload Progress Report`,
        departmentId: selectedDepartment.id,
        departmentName: selectedDepartment.name,
        departmentCode: selectedDepartment.code,
        hodName: hodName.trim(),
        facultyCount: facultyNameList.length,
        facultyNames: facultyNameList,
        individualWorkloadDetails: facultyWorkloadItems,
        workloadProgress: avgProgress,
        progressStatus,
        submissionDate,
        academicYear,
        semester,
        submittedBy: `${currentUser.name} (${currentUser.roleLabel})`,
      });

      onReportSaved(newReport);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save workload report.');
    } finally {
      setSaving(false);
    }
  };

  const stepsList = [
    { num: 1, title: 'Department', desc: 'Select Registered Dept' },
    { num: 2, title: 'HOD Name', desc: 'Verify / Enter HOD' },
    { num: 3, title: 'Faculty Roster', desc: 'Department Faculty' },
    { num: 4, title: 'Selection & Extra', desc: 'Add / Select Staff' },
    { num: 5, title: 'Workload & Progress', desc: 'Hours & Syllabus' },
    { num: 6, title: 'Review & Save', desc: 'Permanent DB Save' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-scale-in my-auto">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#0a192f] via-[#112d4e] to-[#1e3a8a] text-white flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-blue-500/30 text-blue-200 text-[10px] font-black uppercase font-mono tracking-wider border border-blue-400/30">
                Workflow Step {currentStep} of 6
              </span>
              <span className="text-slate-400 text-xs">&bull;</span>
              <span className="text-xs text-blue-100 font-semibold">
                Permanent Database Integration
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black tracking-tight text-white mt-0.5">
              Department Workload Progress Report Creator
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 overflow-x-auto shrink-0">
          <div className="flex items-center justify-between min-w-[560px]">
            {stepsList.map((st, idx) => {
              const isPast = currentStep > st.num;
              const isCurrent = currentStep === st.num;
              return (
                <div key={st.num} className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                      isPast
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-300'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {isPast ? <CheckCircle2 className="w-3.5 h-3.5" /> : st.num}
                  </div>
                  <div className="text-left">
                    <p
                      className={`text-[11px] font-bold leading-tight ${
                        isCurrent ? 'text-blue-900 font-black' : isPast ? 'text-slate-700' : 'text-slate-400'
                      }`}
                    >
                      {st.title}
                    </p>
                    <p className="text-[9px] text-slate-400 leading-none">{st.desc}</p>
                  </div>
                  {idx < stepsList.length - 1 && (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 mx-1 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="font-bold text-rose-600 hover:text-rose-800">
              &times;
            </button>
          </div>
        )}

        {/* Step Content Area (Scrollable) */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6 text-xs">
          {/* ================= STEP 1: SELECT DEPARTMENT ================= */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider font-mono">
                  STEP 1 OF 6
                </span>
                <h4 className="text-sm font-black text-slate-900 mt-0.5">
                  Select Department from Registered Department List
                </h4>
                <p className="text-slate-500 text-xs mt-0.5">
                  This selection is completely dynamic. Only departments registered in the master database appear here.
                </p>
              </div>

              {loading ? (
                <div className="py-12 text-center text-slate-400">Loading departments...</div>
              ) : departments.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 space-y-3">
                  <Building2 className="w-10 h-10 text-slate-400 mx-auto" />
                  <p className="font-bold text-slate-700 text-sm">No Departments Registered Yet</p>
                  <p className="text-slate-500 max-w-sm mx-auto">
                    Please use the Department Management section to register your college departments (e.g., CSE, ECE, EEE, MECH, CIVIL) first.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {departments.map((dept) => {
                    const isSelected = selectedDeptId === dept.id;
                    return (
                      <div
                        key={dept.id}
                        onClick={() => setSelectedDeptId(dept.id)}
                        className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/60 shadow-sm ring-1 ring-blue-500'
                            : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50/60'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span
                              className={`px-2 py-0.5 rounded font-mono font-black text-xs ${
                                isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {dept.code}
                            </span>
                            {isSelected && (
                              <span className="text-[10px] font-black text-blue-700 uppercase flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Selected
                              </span>
                            )}
                          </div>
                          <h5 className="font-black text-slate-900 text-sm mt-2">{dept.name}</h5>
                          {dept.hodName && (
                            <p className="text-slate-600 text-[11px] mt-1 flex items-center gap-1">
                              <GraduationCap className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span>HOD: {dept.hodName}</span>
                            </p>
                          )}
                          {dept.description && (
                            <p className="text-slate-400 text-[11px] mt-1 line-clamp-2">
                              {dept.description}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ================= STEP 2: HOD NAME ================= */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider font-mono">
                  STEP 2 OF 6
                </span>
                <h4 className="text-sm font-black text-slate-900 mt-0.5">
                  Confirm Head of Department (HOD) for {selectedDepartment?.code} – {selectedDepartment?.name}
                </h4>
                <p className="text-slate-500 text-xs mt-0.5">
                  Allow the Admin to either select the registered HOD or manually enter / override the HOD name.
                </p>
              </div>

              {/* Option 1: Registered HOD */}
              {selectedDepartment?.hodName && (
                <div
                  onClick={() => {
                    setHodMode('registered');
                    setHodName(selectedDepartment.hodName);
                    setHodDesignation(selectedDepartment.hodDesignation || 'Professor & Head');
                  }}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    hodMode === 'registered'
                      ? 'border-blue-600 bg-blue-50/60 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="hod_selection"
                      checked={hodMode === 'registered'}
                      onChange={() => {
                        setHodMode('registered');
                        setHodName(selectedDepartment.hodName);
                        setHodDesignation(selectedDepartment.hodDesignation || 'Professor & Head');
                      }}
                      className="mt-1 text-blue-600"
                    />
                    <div>
                      <span className="text-[10px] font-extrabold uppercase text-blue-600 tracking-wider">
                        Use Registered Master HOD
                      </span>
                      <p className="text-sm font-black text-slate-900">{selectedDepartment.hodName}</p>
                      <p className="text-[11px] text-slate-500">
                        {selectedDepartment.hodDesignation || 'Professor & Head'} &bull; Emp ID: {selectedDepartment.hodEmployeeId || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Option 2: Manually enter HOD */}
              <div
                onClick={() => setHodMode('manual')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  hodMode === 'manual'
                    ? 'border-blue-600 bg-blue-50/30 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="hod_selection"
                    checked={hodMode === 'manual'}
                    onChange={() => setHodMode('manual')}
                    className="mt-1 text-blue-600"
                  />
                  <div className="flex-1 space-y-3">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase text-slate-600 tracking-wider">
                        Manually Enter / In-Charge HOD Name
                      </span>
                      <p className="text-slate-500 text-[11px]">
                        Specify an acting head, visiting coordinator, or override for this report period.
                      </p>
                    </div>

                    {hodMode === 'manual' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-700">HOD Full Name *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Dr. M. Shanmugasundaram"
                            value={hodName}
                            onChange={(e) => setHodName(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-slate-700">Designation</label>
                          <input
                            type="text"
                            placeholder="e.g. Professor & Head / In-charge"
                            value={hodDesignation}
                            onChange={(e) => setHodDesignation(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 3: DISPLAY REGISTERED FACULTY ================= */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider font-mono">
                    STEP 3 OF 6
                  </span>
                  <h4 className="text-sm font-black text-slate-900 mt-0.5">
                    Registered Faculty Roster: {selectedDepartment?.code} – {selectedDepartment?.name}
                  </h4>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Only faculty members registered strictly under {selectedDepartment?.code} are displayed. No mixing across departments.
                  </p>
                </div>
                <div className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-bold text-xs shrink-0 font-mono">
                  {deptFaculty.length} Registered Staff
                </div>
              </div>

              {deptFaculty.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 space-y-2">
                  <Users2 className="w-10 h-10 text-slate-400 mx-auto" />
                  <p className="font-bold text-slate-700">No Faculty Registered for this Department</p>
                  <p className="text-slate-500 text-xs max-w-md mx-auto">
                    You can still proceed to Step 4 and manually add faculty members using the &quot;Add Another Faculty&quot; feature.
                  </p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold uppercase text-[10px]">
                        <th className="py-2.5 px-3">Emp ID</th>
                        <th className="py-2.5 px-3">Faculty Name</th>
                        <th className="py-2.5 px-3">Designation</th>
                        <th className="py-2.5 px-3">Email</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {deptFaculty.map((fac) => (
                        <tr key={fac.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-700">
                            {fac.employeeId}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">
                            {fac.fullName}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                              {fac.designation}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-500">{fac.email || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ================= STEP 4: SELECTION & ADD ANOTHER FACULTY ================= */}
          {currentStep === 4 && (
            <div className="space-y-5">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider font-mono">
                    STEP 4 OF 6
                  </span>
                  <h4 className="text-sm font-black text-slate-900 mt-0.5">
                    Select Faculty Members &amp; Add Additional Staff
                  </h4>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Check off faculty to include in this workload cycle, or use &quot;Add Another Faculty&quot; for adjunct/visiting professors.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedFacultyIds(deptFaculty.map((f) => f.id))}
                    className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300">&bull;</span>
                  <button
                    type="button"
                    onClick={() => setSelectedFacultyIds([])}
                    className="text-[11px] font-bold text-slate-500 hover:underline cursor-pointer"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              {/* Registered Faculty Selection */}
              {deptFaculty.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-extrabold uppercase text-slate-600 tracking-wide">
                    Registered Department Faculty ({selectedFacultyIds.length}/{deptFaculty.length} Selected)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {deptFaculty.map((fac) => {
                      const isChecked = selectedFacultyIds.includes(fac.id);
                      return (
                        <label
                          key={fac.id}
                          className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-blue-50/70 border-blue-400 shadow-2xs'
                              : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedFacultyIds([...selectedFacultyIds, fac.id]);
                              } else {
                                setSelectedFacultyIds(selectedFacultyIds.filter((id) => id !== fac.id));
                              }
                            }}
                            className="rounded text-blue-600 w-4 h-4"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 truncate">{fac.fullName}</div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                              <span className="font-mono">{fac.employeeId}</span>
                              <span>&bull;</span>
                              <span>{fac.designation}</span>
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Additional Faculty Members Section */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-slate-800 text-xs">
                      Manually Add Additional Faculty Members
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddAdditionalFaculty}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Add Another Faculty</span>
                  </button>
                </div>

                {additionalFaculty.length === 0 ? (
                  <p className="text-[11px] text-slate-500 italic">
                    No extra faculty added. Click &quot;Add Another Faculty&quot; if you need to include visiting professors or guest lecturers.
                  </p>
                ) : (
                  <div className="space-y-2 pt-1">
                    {additionalFaculty.map((extra, index) => (
                      <div
                        key={extra.id}
                        className="flex flex-col sm:flex-row sm:items-center gap-2 p-2.5 bg-white rounded-lg border border-slate-200"
                      >
                        <span className="text-[11px] font-black text-slate-400 font-mono w-6">
                          #{index + 1}
                        </span>
                        <input
                          type="text"
                          placeholder="Faculty Member Full Name"
                          value={extra.name}
                          onChange={(e) =>
                            handleUpdateAdditionalFaculty(extra.id, 'name', e.target.value)
                          }
                          className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <select
                          value={extra.designation}
                          onChange={(e) =>
                            handleUpdateAdditionalFaculty(extra.id, 'designation', e.target.value)
                          }
                          className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                        >
                          <option value="Professor">Professor</option>
                          <option value="Associate Professor">Associate Professor</option>
                          <option value="Assistant Professor">Assistant Professor</option>
                          <option value="Visiting Professor">Visiting Professor</option>
                          <option value="Other Faculty Members">Other Faculty Members</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => handleRemoveAdditionalFaculty(extra.id)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 cursor-pointer transition-colors self-end sm:self-center"
                          title="Remove this extra faculty"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= STEP 5: WORKLOAD DETAILS & PROGRESS ================= */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider font-mono">
                    STEP 5 OF 6
                  </span>
                  <h4 className="text-sm font-black text-slate-900 mt-0.5">
                    Enter Individual Faculty Workload Details &amp; Progress
                  </h4>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Specify Theory &amp; Lab hours, assigned courses, syllabus delivery progress %, and notes.
                  </p>
                </div>
              </div>

              {/* Roster of chosen faculty */}
              <div className="space-y-4">
                {/* Registered faculty cards */}
                {deptFaculty
                  .filter((f) => selectedFacultyIds.includes(f.id))
                  .map((fac) => {
                    const detail = workloadDetails[fac.id] || {
                      facultyName: fac.fullName,
                      designation: fac.designation,
                      theoryHours: 6,
                      labHours: 6,
                      totalHours: 12,
                      assignedCourses: '',
                      progressPercentage: 65,
                      progressNotes: '',
                      complianceStatus: 'Optimal',
                    };

                    return (
                      <div
                        key={fac.id}
                        className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-black flex items-center justify-center text-xs">
                              {fac.fullName.charAt(0)}
                            </div>
                            <div>
                              <span className="font-black text-slate-900 text-sm">{fac.fullName}</span>
                              <span className="text-slate-400 text-xs ml-2">
                                ({fac.employeeId} &bull; {fac.designation})
                              </span>
                            </div>
                          </div>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase font-mono ${
                              detail.complianceStatus === 'Overloaded'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : detail.complianceStatus === 'Under Capacity'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            }`}
                          >
                            {detail.complianceStatus} &bull; {detail.totalHours} hrs/wk
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                          <div className="sm:col-span-2 space-y-1">
                            <label className="font-bold text-slate-700 text-[11px]">
                              Assigned Courses / Subject Codes
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. CS25401 Data Structures, CS25402 OS Lab"
                              value={detail.assignedCourses}
                              onChange={(e) =>
                                handleWorkloadChange(fac.id, 'assignedCourses', e.target.value)
                              }
                              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-xs"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="font-bold text-slate-700 text-[11px]">
                              Theory (L+T)
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={30}
                              value={detail.theoryHours}
                              onChange={(e) =>
                                handleWorkloadChange(
                                  fac.id,
                                  'theoryHours',
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono font-bold text-xs"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="font-bold text-slate-700 text-[11px]">
                              Lab (P)
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={30}
                              value={detail.labHours}
                              onChange={(e) =>
                                handleWorkloadChange(
                                  fac.id,
                                  'labHours',
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono font-bold text-xs"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <label className="font-bold text-slate-700 text-[11px]">
                                Syllabus Progress
                              </label>
                              <span className="font-mono font-black text-blue-700 text-xs">
                                {detail.progressPercentage}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min={0}
                              max={100}
                              value={detail.progressPercentage}
                              onChange={(e) =>
                                handleWorkloadChange(
                                  fac.id,
                                  'progressPercentage',
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="w-full accent-blue-600 cursor-pointer"
                            />
                          </div>

                          <div className="sm:col-span-2 space-y-1">
                            <label className="font-bold text-slate-700 text-[11px]">
                              Progress Remarks &amp; Notes
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Syllabus coverage on track; Unit-4 started"
                              value={detail.progressNotes}
                              onChange={(e) =>
                                handleWorkloadChange(fac.id, 'progressNotes', e.target.value)
                              }
                              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}

                {/* Additional faculty cards */}
                {additionalFaculty.map((extra) => {
                  const detail = workloadDetails[extra.id] || {
                    facultyName: extra.name,
                    designation: extra.designation,
                    theoryHours: 4,
                    labHours: 4,
                    totalHours: 8,
                    assignedCourses: '',
                    progressPercentage: 50,
                    progressNotes: '',
                    complianceStatus: 'Optimal',
                  };

                  return (
                    <div
                      key={extra.id}
                      className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/20 shadow-2xs space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-mono text-[10px] font-black uppercase">
                            Additional
                          </span>
                          <span className="font-black text-slate-900 text-sm">{extra.name}</span>
                          <span className="text-slate-400 text-xs">({extra.designation})</span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase font-mono bg-indigo-100 text-indigo-800">
                          {detail.totalHours} hrs/wk
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div className="sm:col-span-2 space-y-1">
                          <label className="font-bold text-slate-700 text-[11px]">
                            Assigned Courses / Subject Codes
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Open Elective, Project Guidance"
                            value={detail.assignedCourses}
                            onChange={(e) =>
                              handleWorkloadChange(extra.id, 'assignedCourses', e.target.value)
                            }
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-slate-700 text-[11px]">
                            Theory (L+T)
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={30}
                            value={detail.theoryHours}
                            onChange={(e) =>
                              handleWorkloadChange(
                                extra.id,
                                'theoryHours',
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono font-bold text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-slate-700 text-[11px]">Lab (P)</label>
                          <input
                            type="number"
                            min={0}
                            max={30}
                            value={detail.labHours}
                            onChange={(e) =>
                              handleWorkloadChange(
                                extra.id,
                                'labHours',
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono font-bold text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="font-bold text-slate-700 text-[11px]">
                              Syllabus Progress
                            </label>
                            <span className="font-mono font-black text-indigo-700 text-xs">
                              {detail.progressPercentage}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={detail.progressPercentage}
                            onChange={(e) =>
                              handleWorkloadChange(
                                extra.id,
                                'progressPercentage',
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="w-full accent-indigo-600 cursor-pointer"
                          />
                        </div>
                        <div className="sm:col-span-2 space-y-1">
                          <label className="font-bold text-slate-700 text-[11px]">
                            Progress Remarks &amp; Notes
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Unit-2 completed"
                            value={detail.progressNotes}
                            onChange={(e) =>
                              handleWorkloadChange(extra.id, 'progressNotes', e.target.value)
                            }
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= STEP 6: REVIEW & SAVE ================= */}
          {currentStep === 6 && (
            <div className="space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider font-mono">
                  STEP 6 OF 6 &bull; FINALIZATION
                </span>
                <h4 className="text-sm font-black text-slate-900 mt-0.5">
                  Review &amp; Permanently Save Workload Progress Report
                </h4>
                <p className="text-slate-500 text-xs mt-0.5">
                  This report will be saved permanently into the central institutional database.
                </p>
              </div>

              {/* Report Header Metadata */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-slate-700 text-[11px]">Report Title</label>
                  <input
                    type="text"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 text-[11px]">Submission Date</label>
                  <input
                    type="date"
                    value={submissionDate}
                    onChange={(e) => setSubmissionDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 text-[11px]">Progress Status</label>
                  <select
                    value={progressStatus}
                    onChange={(e) =>
                      setProgressStatus(e.target.value as 'Pending' | 'In Progress' | 'Completed')
                    }
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>

              {/* Report Summary Card */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-900 to-indigo-900 text-white space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="px-2 py-0.5 rounded bg-blue-500/30 text-blue-200 font-mono text-[10px] font-bold">
                      {selectedDepartment?.code} &bull; {academicYear} ({semester})
                    </span>
                    <h5 className="text-base font-black text-white mt-1">
                      {selectedDepartment?.name}
                    </h5>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase text-blue-300 font-semibold block">
                      HOD In-Charge
                    </span>
                    <span className="text-sm font-bold text-white">{hodName}</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs border-t border-blue-800">
                  <span className="text-blue-200">
                    Total Faculty Included: <strong>{selectedFacultyIds.length + additionalFaculty.length}</strong>
                  </span>
                  <span className="text-blue-200">
                    Status: <strong className="text-amber-300">{progressStatus}</strong>
                  </span>
                </div>
              </div>

              {/* Breakdown Table Preview */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 font-bold text-slate-700 text-xs">
                  Individual Faculty Workload Summary
                </div>
                <div className="overflow-x-auto max-h-56">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-extrabold uppercase">
                        <th className="py-2 px-3">Faculty Name</th>
                        <th className="py-2 px-3">Designation</th>
                        <th className="py-2 px-3">Hours (L-T-P)</th>
                        <th className="py-2 px-3">Progress</th>
                        <th className="py-2 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {/* Registered */}
                      {deptFaculty
                        .filter((f) => selectedFacultyIds.includes(f.id))
                        .map((f) => {
                          const d = workloadDetails[f.id];
                          return (
                            <tr key={f.id} className="hover:bg-slate-50">
                              <td className="py-2 px-3 font-bold text-slate-800">{f.fullName}</td>
                              <td className="py-2 px-3 text-slate-600">{f.designation}</td>
                              <td className="py-2 px-3 font-mono">
                                {d?.theoryHours || 0}T + {d?.labHours || 0}L ={' '}
                                <strong className="text-blue-700">{d?.totalHours || 0} hrs</strong>
                              </td>
                              <td className="py-2 px-3 font-mono font-bold text-slate-800">
                                {d?.progressPercentage || 0}%
                              </td>
                              <td className="py-2 px-3">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                                  {d?.complianceStatus || 'Optimal'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}

                      {/* Additional */}
                      {additionalFaculty.map((extra) => {
                        const d = workloadDetails[extra.id];
                        return (
                          <tr key={extra.id} className="hover:bg-slate-50 bg-indigo-50/10">
                            <td className="py-2 px-3 font-bold text-indigo-900">
                              {extra.name} (Additional)
                            </td>
                            <td className="py-2 px-3 text-slate-600">{extra.designation}</td>
                            <td className="py-2 px-3 font-mono">
                              {d?.theoryHours || 0}T + {d?.labHours || 0}L ={' '}
                              <strong className="text-indigo-700">{d?.totalHours || 0} hrs</strong>
                            </td>
                            <td className="py-2 px-3 font-mono font-bold text-indigo-800">
                              {d?.progressPercentage || 0}%
                            </td>
                            <td className="py-2 px-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700">
                                {d?.complianceStatus || 'Optimal'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div>
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentStep < 6 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="inline-flex items-center gap-1 px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
              >
                <span>Continue to Step {currentStep + 1}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveReport}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-colors cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving to Database...' : 'Save Report Permanently'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
