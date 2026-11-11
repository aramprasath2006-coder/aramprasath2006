import { AllocationRecord, WorkspaceConfig, TimetableEntry } from '../types/workload';

export const initialWorkspaceConfig: WorkspaceConfig = {
  institution: 'Karpaga Vinayaga Deemed to be University',
  institutionShort: 'KVCET • KVELL',
  department: 'Academic Directorate',
  year: '2026–2027',
  label: 'Institutional Workload Intelligence',
  campusAddress: 'GST Road, Chinna Kolambakkam, Madhuranthagam Taluk, Chengalpattu - 603308, Tamil Nadu',
  approvalHead: 'Academic Council Dean & Principal',
};

// Start with empty allocations - No hardcoded sample staff, HODs, or fake departments
export const initialKvcetAllocations: AllocationRecord[] = [];

// Clean starter timetable entries - No fake staff allocations
export const initialTimetableEntries: TimetableEntry[] = [];

// Optional curriculum structure reference (for syllabus code matching only when explicitly requested)
export const demoSyllabusAllocations: AllocationRecord[] = [
  {
    id: 'demo-1',
    department: 'Civil Engineering',
    sem: 'IV',
    reg: '2025',
    code: 'CE25401',
    name: 'Strength of Materials II',
    faculty: 'Unassigned Faculty',
    credits: 3,
    type: 'Theory',
    L: 3,
    T: 0,
    P: 0,
    syllabusCredits: 3,
    source: 'R2025 Curriculum Guide',
    status: 'MATCH',
    note: 'Syllabus reference course code CE25401.',
  },
  {
    id: 'demo-2',
    department: 'Civil Engineering',
    sem: 'IV',
    reg: '2025',
    code: 'CE25402',
    name: 'Soil Mechanics',
    faculty: 'Unassigned Faculty',
    credits: 3,
    type: 'Theory',
    L: 3,
    T: 0,
    P: 0,
    syllabusCredits: 3,
    source: 'R2025 Curriculum Guide',
    status: 'MATCH',
    note: 'Syllabus title and L-T-P pattern verified.',
  },
];
