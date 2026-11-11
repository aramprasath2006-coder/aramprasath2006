import * as XLSX from 'xlsx';
import {
  AllocationRecord,
  FacultyStats,
  WorkspaceConfig,
  CourseCategory,
  ValidationStatus,
} from '../types/workload';

export function computeHours(d: AllocationRecord): number | null {
  if (d.L === null || d.T === null || d.P === null) return null;
  return (d.L || 0) + (d.T || 0) + (d.P || 0);
}

export function computeFacultyStatsList(
  records: AllocationRecord[],
  prescribedLimitPolicy: 'cadre' | 'fixed16' | 'fixed18' | number = 'cadre'
): FacultyStats[] {
  const keys = Array.from(
    new Set(records.map((d) => `${d.department || 'Unspecified'}||${d.faculty || 'Unassigned'}`))
  );

  return keys.map((key) => {
    const [dep, facultyName] = key.split('||');
    const facultyCourses = records.filter(
      (d) => (d.department || 'Unspecified') === dep && (d.faculty || 'Unassigned') === facultyName
    );

    const theoryCourses = facultyCourses.filter(
      (d) => d.type === 'Theory' || d.type === 'LIT'
    );
    const labCourses = facultyCourses.filter(
      (d) => d.type === 'Lab' || (d.type === 'Other' && /lab|practical|drawing/i.test(d.name))
    );
    const otherCourses = facultyCourses.filter(
      (d) => !theoryCourses.includes(d) && !labCourses.includes(d)
    );

    const knownRows = facultyCourses.filter((d) => computeHours(d) !== null);

    const lecturePeriods = knownRows.reduce((sum, d) => sum + (d.L || 0), 0);
    const tutorialPeriods = knownRows.reduce((sum, d) => sum + (d.T || 0), 0);
    const practicalPeriods = knownRows.reduce((sum, d) => sum + (d.P || 0), 0);
    const totalCredits = facultyCourses.reduce((sum, d) => sum + (d.credits || 0), 0);

    const incompleteRows = facultyCourses.length - knownRows.length;
    const reviewFlags = facultyCourses.filter((d) => d.status !== 'MATCH').length;
    const totalContactPeriods = knownRows.reduce((sum, d) => sum + (computeHours(d) || 0), 0);

    // Determine department's prescribed load limit
    let prescribedLimit = 16;
    if (prescribedLimitPolicy === 'cadre') {
      const lower = facultyName.toLowerCase();
      if (lower.startsWith('dr.') || lower.startsWith('dr ') || lower.includes('hod') || lower.includes('prof.')) {
        prescribedLimit = 14; // Professor / HoD statutory norm
      } else if (lower.includes('lab') || lower.includes('instructor') || lower.includes('assistant')) {
        prescribedLimit = 18;
      } else {
        prescribedLimit = 16;
      }
    } else if (typeof prescribedLimitPolicy === 'number') {
      prescribedLimit = prescribedLimitPolicy;
    } else if (prescribedLimitPolicy === 'fixed18') {
      prescribedLimit = 18;
    } else if (prescribedLimitPolicy === 'fixed16') {
      prescribedLimit = 16;
    }

    const loadPercentage = prescribedLimit > 0 ? Math.round((totalContactPeriods / prescribedLimit) * 100) : 0;
    const loadDeviation = totalContactPeriods - prescribedLimit;
    let loadStatus: 'compliant' | 'overloaded' | 'underloaded' = 'compliant';
    if (totalContactPeriods > prescribedLimit) {
      loadStatus = 'overloaded';
    } else if (totalContactPeriods < Math.max(10, Math.round(prescribedLimit * 0.75))) {
      loadStatus = 'underloaded';
    }

    return {
      department: dep,
      facultyName,
      totalCourses: facultyCourses.length,
      theoryCoursesCount: theoryCourses.length,
      labCoursesCount: labCourses.length,
      otherCoursesCount: otherCourses.length,
      totalCredits,
      lecturePeriods,
      tutorialPeriods,
      practicalPeriods,
      theoryContactPeriods: lecturePeriods + tutorialPeriods,
      totalContactPeriods,
      incompleteRows,
      reviewFlags,
      prescribedLimit,
      loadPercentage,
      loadStatus,
      loadDeviation,
      coursesList: facultyCourses,
    };
  });
}

export function filterFacultyByTheoryCount(
  records: AllocationRecord[],
  exactTheoryCount: number,
  departmentFilter: string = 'all'
): Array<{
  department: string;
  facultyName: string;
  theoryCount: number;
  courses: AllocationRecord[];
}> {
  const groups = new Map<string, AllocationRecord[]>();

  records
    .filter((d) => d.type === 'Theory' || d.type === 'LIT')
    .forEach((d) => {
      const key = `${d.department || 'Unspecified'}||${d.faculty || 'Unassigned'}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(d);
    });

  const results: Array<{
    department: string;
    facultyName: string;
    theoryCount: number;
    courses: AllocationRecord[];
  }> = [];

  groups.forEach((items, key) => {
    const [dep, facultyName] = key.split('||');
    if (departmentFilter === 'all' || dep === departmentFilter) {
      if (items.length === exactTheoryCount) {
        results.push({
          department: dep,
          facultyName,
          theoryCount: items.length,
          courses: items.sort((a, b) => String(a.sem).localeCompare(String(b.sem), undefined, { numeric: true })),
        });
      }
    }
  });

  return results.sort((a, b) => a.facultyName.localeCompare(b.facultyName));
}

export function exportAnalysisToCSV(records: AllocationRecord[], filename = 'workload_analysis.csv') {
  const headers = [
    'Department',
    'Semester',
    'Regulation',
    'Course Code',
    'Subject Title',
    'Faculty In-charge',
    'Classification',
    'Workload Credits',
    'Syllabus Credits',
    'Lecture (L)',
    'Tutorial (T)',
    'Practical (P)',
    'Weekly Contact Periods',
    'Validation Status',
    'Review Note',
  ];

  const rows = records.map((d) => [
    d.department,
    d.sem,
    d.reg,
    d.code || '—',
    d.name,
    d.faculty,
    d.type,
    d.credits !== null ? d.credits : '—',
    d.syllabusCredits !== null ? d.syllabusCredits : '—',
    d.L !== null ? d.L : '—',
    d.T !== null ? d.T : '—',
    d.P !== null ? d.P : '—',
    computeHours(d) !== null ? computeHours(d) : '—',
    d.status,
    d.note || '',
  ]);

  downloadCSV([headers, ...rows], filename);
}

export function exportFacultySummaryToCSV(stats: FacultyStats[], filename = 'faculty_workload_summary.csv') {
  const headers = [
    'Department',
    'Faculty Name',
    'Total Assigned Courses',
    'Theory Papers (Theory + LIT)',
    'Laboratories / Practicals',
    'Total Credits Allocated',
    'Known Lecture Periods (L)',
    'Known Tutorial Periods (T)',
    'Known Practical Periods (P)',
    'Known Theory Contact (L+T)',
    'Known Total Weekly Periods',
    'Prescribed Load Limit (Hrs/Wk)',
    'Assigned vs Limit (%)',
    'Load Compliance Status',
    'Incomplete LTP Rows',
    'Review Flags',
  ];

  const rows = stats.map((s) => [
    s.department,
    s.facultyName,
    s.totalCourses,
    s.theoryCoursesCount,
    s.labCoursesCount,
    s.totalCredits,
    s.lecturePeriods,
    s.tutorialPeriods,
    s.practicalPeriods,
    s.theoryContactPeriods,
    s.totalContactPeriods,
    s.prescribedLimit,
    `${s.loadPercentage}%`,
    s.loadStatus.toUpperCase(),
    s.incompleteRows,
    s.reviewFlags,
  ]);

  downloadCSV([headers, ...rows], filename);
}

export function exportTheoryGroupToCSV(
  grouped: Array<{ department: string; facultyName: string; theoryCount: number; courses: AllocationRecord[] }>,
  theoryCount: number
) {
  const headers = [
    'Sl. No',
    'Department',
    'Faculty Name',
    'Theory Papers Count',
    'Course Code',
    'Course Name',
    'Semester',
    'Regulation',
    'Course Type',
  ];

  const rows: any[] = [];
  let index = 1;

  grouped.forEach((g) => {
    g.courses.forEach((c) => {
      rows.push([
        index++,
        g.department,
        g.facultyName,
        g.theoryCount,
        c.code || '—',
        c.name,
        c.sem,
        c.reg,
        c.type,
      ]);
    });
  });

  downloadCSV([headers, ...rows], `faculty_handling_${theoryCount}_theory_papers.csv`);
}

function downloadCSV(rows: any[][], filename: string) {
  const csvContent = rows
    .map((r) => r.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function parseExcelOrCSVFile(file: File): Promise<AllocationRecord[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const records: AllocationRecord[] = [];

  workbook.SheetNames.forEach((sheetName) => {
    const rawData = XLSX.utils.sheet_to_json<any[]>(workbook.Sheets[sheetName], {
      header: 1,
      raw: false,
      defval: '',
    });

    if (rawData.length < 2) return;

    // Detect header row
    let headerIdx = -1;
    let colMap: Record<string, number> = {};

    for (let r = 0; r < Math.min(rawData.length, 10); r++) {
      const row = rawData[r].map((v: any) => String(v || '').toLowerCase().trim());
      const hasName = row.some((c: string) => /subject|course|title|paper/i.test(c));
      const hasFaculty = row.some((c: string) => /faculty|staff|teacher|instructor/i.test(c));
      if (hasName || hasFaculty) {
        headerIdx = r;
        row.forEach((cell: string, idx: number) => {
          if (/code/i.test(cell)) colMap.code = idx;
          if (/subject|course|title|paper/i.test(cell) && !colMap.name) colMap.name = idx;
          if (/faculty|staff|instructor/i.test(cell)) colMap.faculty = idx;
          if (/credit/i.test(cell)) colMap.credits = idx;
          if (/sem/i.test(cell)) colMap.sem = idx;
          if (/reg/i.test(cell)) colMap.reg = idx;
          if (/dept|department|school/i.test(cell)) colMap.dept = idx;
          if (/type|category/i.test(cell)) colMap.type = idx;
        });
        break;
      }
    }

    if (headerIdx === -1) return;

    for (let r = headerIdx + 1; r < rawData.length; r++) {
      const row = rawData[r];
      if (!row || row.length === 0) continue;

      const name = colMap.name !== undefined ? String(row[colMap.name] || '').trim() : '';
      if (!name || /^(total|subtotal|grand total)$/i.test(name)) continue;

      const code = colMap.code !== undefined ? String(row[colMap.code] || '').trim() : '';
      const faculty = colMap.faculty !== undefined ? String(row[colMap.faculty] || '').trim() : 'Unassigned';
      const credits = colMap.credits !== undefined ? parseFloat(row[colMap.credits]) || null : null;
      const sem = colMap.sem !== undefined ? String(row[colMap.sem] || 'IV').trim() : 'IV';
      const reg = colMap.reg !== undefined ? String(row[colMap.reg] || '2025').trim() : '2025';
      const dept = colMap.dept !== undefined ? String(row[colMap.dept] || sheetName).trim() : sheetName;

      const isLab = /lab|practical|workshop/i.test(name);
      const isLit = /lit|integrated/i.test(name);
      const type: CourseCategory = isLit ? 'LIT' : isLab ? 'Lab' : 'Theory';

      records.push({
        id: `imp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        department: dept.length > 2 ? dept : 'Civil Engineering',
        sem: sem || 'IV',
        reg: reg || '2025',
        code,
        name,
        faculty: faculty || 'Unassigned',
        credits: credits || (type === 'Lab' ? 2 : 3),
        type,
        L: type === 'Lab' ? 0 : 3,
        T: 0,
        P: type === 'Lab' ? 2 : (type === 'LIT' ? 2 : 0),
        syllabusCredits: credits || 3,
        source: file.name,
        status: 'REVIEW',
        note: `Imported from ${file.name} [Sheet: ${sheetName}]`,
      });
    }
  });

  return records;
}
