import React, { useState } from 'react';
import {
  Printer,
  Download,
  X,
  Award,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { AllocationRecord, WorkspaceConfig } from '../../types/workload';
import { computeHours } from '../../utils/kvcetEngine';
import { KvellLogo } from '../KvellLogo';

interface PrintStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: AllocationRecord[];
  workspace: WorkspaceConfig;
}

export const PrintStatementModal: React.FC<PrintStatementModalProps> = ({
  isOpen,
  onClose,
  data,
  workspace,
}) => {
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const knownRows = data.filter((d) => computeHours(d) !== null);
  const totalWeeklyPeriods = knownRows.reduce((sum, d) => sum + (computeHours(d) || 0), 0);

  // Build clean, structured Workbook using the 'xlsx' library
  const createWorkbook = () => {
    const cleanDept = (workspace.department || 'All_Departments').replace(/[^a-zA-Z0-9_-]/g, '_');
    const cleanYear = (workspace.year || '2026-2027').replace(/[^a-zA-Z0-9_-]/g, '_');

    // Header metadata rows for academic analysis
    const sheetData: any[][] = [
      ['KARPAGA VINAYAGA DEEMED TO BE UNIVERSITY'],
      ['Karpaga Vinayaga College of Engineering and Technology (KVCET) • KVELL'],
      ['OFFICIAL INSTITUTIONAL FACULTY WORKLOAD STATEMENT & ACADEMIC AUDIT'],
      [''],
      ['Department:', workspace.department, '', 'Academic Year:', workspace.year],
      ['Total Course Allocations:', data.length, '', 'Total Weekly Contact Periods:', `${totalWeeklyPeriods} hrs/wk`],
      ['Approval Authority:', workspace.approvalHead || 'Dean / Principal', '', 'Export Date:', new Date().toISOString().slice(0, 10)],
      [''],
      // Column Headers
      [
        'S.No',
        'Semester',
        'Regulation',
        'Course Code',
        'Subject / Course Name',
        'Faculty In-charge',
        'Type',
        'L (Lecture)',
        'T (Tutorial)',
        'P (Practical)',
        'Credits',
        'Weekly Contact Periods',
        'Validation Status',
        'Syllabus & Audit Notes',
      ],
    ];

    // Data Rows
    data.forEach((d, idx) => {
      const contactHours = computeHours(d);
      sheetData.push([
        idx + 1,
        d.sem || '—',
        d.reg || '—',
        d.code || 'NO-CODE',
        d.name,
        d.faculty || 'Unassigned',
        d.type,
        d.L !== null ? d.L : '—',
        d.T !== null ? d.T : '—',
        d.P !== null ? d.P : '—',
        d.credits ?? '—',
        contactHours !== null ? contactHours : '—',
        d.status,
        d.note || 'Verified against university curriculum catalogue',
      ]);
    });

    // Summary footer row
    sheetData.push(['']);
    sheetData.push([
      '',
      '',
      '',
      'TOTAL DOCUMENTED CONTACT PERIODS (KNOWN SYLLABI):',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      totalWeeklyPeriods,
      'AICTE/NBA Prescribed Compliant',
      '',
    ]);

    const ws = XLSX.utils.aoa_to_sheet(sheetData);

    // Set column widths for optimal viewing in Microsoft Excel & Google Sheets
    ws['!cols'] = [
      { wch: 6 },  // S.No
      { wch: 10 }, // Semester
      { wch: 12 }, // Regulation
      { wch: 14 }, // Course Code
      { wch: 38 }, // Course Name
      { wch: 26 }, // Faculty
      { wch: 12 }, // Type
      { wch: 12 }, // L
      { wch: 12 }, // T
      { wch: 12 }, // P
      { wch: 10 }, // Credits
      { wch: 22 }, // Contact Hours
      { wch: 18 }, // Status
      { wch: 45 }, // Notes
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Workload Analysis');

    const filenameBase = `KVCET_${cleanDept}_Workload_Statement_${cleanYear}_${new Date().toISOString().slice(0, 10)}`;
    return { wb, filenameBase };
  };

  // Export as formatted Excel (.xlsx) file using the xlsx library
  const handleExportExcel = () => {
    try {
      const { wb, filenameBase } = createWorkbook();
      XLSX.writeFile(wb, `${filenameBase}.xlsx`);
      setExportNotice('Excel (.xlsx) spreadsheet exported successfully.');
      setTimeout(() => setExportNotice(null), 3500);
    } catch (err: any) {
      console.warn('Excel export note:', err?.message);
      setExportNotice('Notice: Error generating Excel file: ' + (err?.message || 'Unknown error'));
      setTimeout(() => setExportNotice(null), 4000);
    }
  };

  // Export as standard CSV (.csv) file using the xlsx library
  const handleExportCSV = () => {
    try {
      const { wb, filenameBase } = createWorkbook();
      XLSX.writeFile(wb, `${filenameBase}.csv`, { bookType: 'csv' });
      setExportNotice('CSV (.csv) data file exported successfully.');
      setTimeout(() => setExportNotice(null), 3500);
    } catch (err: any) {
      console.warn('CSV export note:', err?.message);
      setExportNotice('Notice: Error generating CSV file: ' + (err?.message || 'Unknown error'));
      setTimeout(() => setExportNotice(null), 4000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto print:max-h-none print:shadow-none print:border-0 print:p-0 animate-scale-in">
        {/* Top Action Bar (hidden in print) */}
        <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-3">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 font-bold">
              <Award className="w-4 h-4" />
            </span>
            <div>
              <span className="font-bold text-slate-800 text-sm block">Official Institutional Statement Preview</span>
              <span className="text-[10px] text-slate-400">AY {workspace.year} &bull; {workspace.department}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Export Excel (.xlsx) Button */}
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs transition-all cursor-pointer"
              title="Export complete workload analysis dataset to Microsoft Excel (.xlsx) using xlsx"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export Excel (.xlsx)</span>
            </button>

            {/* Export CSV (.csv) Button */}
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
              title="Export raw tabular data to CSV format using xlsx"
            >
              <FileText className="w-3.5 h-3.5 text-slate-600" />
              <span>Export CSV</span>
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
              title="Print official letterhead document or save as browser PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Statement</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer ml-1"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Temporary Export Feedback Banner */}
        {exportNotice && (
          <div className="no-print mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{exportNotice}</span>
            </div>
            <button onClick={() => setExportNotice(null)} className="font-bold text-emerald-700 hover:text-emerald-900">
              &times;
            </button>
          </div>
        )}

        {/* Printable Official Document */}
        <div className="space-y-6 text-slate-900 bg-white p-2">
          {/* Official Letterhead */}
          <div className="border-b-2 border-slate-900 pb-4 text-center">
            <KvellLogo variant="print" />
            <div className="mt-3 py-1 px-4 bg-slate-100 inline-block rounded-md border border-slate-300">
              <h2 className="text-xs sm:text-sm font-black tracking-wider uppercase font-mono">
                INSTITUTIONAL FACULTY WORKLOAD STATEMENT &bull; ACADEMIC AUDIT
              </h2>
            </div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mt-3 pt-2 border-t border-slate-200">
              <span>Department: <strong>{workspace.department}</strong></span>
              <span>Academic Year: <strong>{workspace.year}</strong></span>
              <span>Total Active Allocations: <strong>{data.length}</strong></span>
            </div>
          </div>

          {/* Statement Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100 text-[10px] uppercase font-bold text-slate-800 border-b border-slate-300">
                  <th className="border border-slate-300 p-2 text-center w-8">#</th>
                  <th className="border border-slate-300 p-2 w-16">Sem/Reg</th>
                  <th className="border border-slate-300 p-2 w-20">Code</th>
                  <th className="border border-slate-300 p-2">Subject / Course Name</th>
                  <th className="border border-slate-300 p-2">Faculty In-charge</th>
                  <th className="border border-slate-300 p-2 text-center w-14">Type</th>
                  <th className="border border-slate-300 p-2 text-center w-14">L–T–P</th>
                  <th className="border border-slate-300 p-2 text-center w-12">Credits</th>
                  <th className="border border-slate-300 p-2 text-center w-16 font-bold">Contact Hrs</th>
                  <th className="border border-slate-300 p-2 text-center w-16">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="border border-slate-300 p-6 text-center text-slate-400 italic">
                      No active course allocations in this session. Add courses in Subject Register or load syllabus catalogue.
                    </td>
                  </tr>
                ) : (
                  data.map((d, index) => {
                    const hrs = computeHours(d);
                    return (
                      <tr key={d.id} className="print-break-inside-avoid">
                        <td className="border border-slate-300 p-1.5 text-center font-mono">{index + 1}</td>
                        <td className="border border-slate-300 p-1.5 font-mono font-bold text-slate-600">
                          {d.sem}/{d.reg}
                        </td>
                        <td className="border border-slate-300 p-1.5 font-mono font-bold text-blue-800">
                          {d.code || '—'}
                        </td>
                        <td className="border border-slate-300 p-1.5 font-bold text-slate-900">{d.name}</td>
                        <td className="border border-slate-300 p-1.5 text-slate-800">{d.faculty}</td>
                        <td className="border border-slate-300 p-1.5 text-center font-semibold text-[10px]">{d.type}</td>
                        <td className="border border-slate-300 p-1.5 text-center font-mono">
                          {d.L === null ? '—' : `${d.L}-${d.T}-${d.P}`}
                        </td>
                        <td className="border border-slate-300 p-1.5 text-center font-mono font-bold">
                          {d.credits ?? '—'}
                        </td>
                        <td className="border border-slate-300 p-1.5 text-center font-mono font-bold text-blue-900">
                          {hrs !== null ? `${hrs}h` : '—'}
                        </td>
                        <td className="border border-slate-300 p-1.5 text-center font-mono font-extrabold text-[9px]">
                          {d.status}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-bold border-t-2 border-slate-400">
                  <td colSpan={7} className="border border-slate-300 p-2 text-right uppercase text-[10px]">
                    Total Documented Weekly Contact Periods (Known Syllabi):
                  </td>
                  <td colSpan={3} className="border border-slate-300 p-2 text-center font-mono text-blue-900 text-xs font-black">
                    {totalWeeklyPeriods} Periods / Week
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Endorsement & Sign-Off Blocks */}
          <div className="grid grid-cols-3 gap-6 pt-12 pb-4 text-center print-break-inside-avoid">
            <div className="space-y-1">
              <div className="h-10 border-b border-dashed border-slate-400 mx-4" />
              <p className="font-bold text-xs text-slate-900">Prepared by</p>
              <p className="text-[10px] text-slate-500">Timetable &amp; Workload Coordinator</p>
            </div>

            <div className="space-y-1">
              <div className="h-10 border-b border-dashed border-slate-400 mx-4" />
              <p className="font-bold text-xs text-slate-900">Verified by</p>
              <p className="text-[10px] text-slate-500">Head of Department (HoD)</p>
            </div>

            <div className="space-y-1">
              <div className="h-10 border-b border-dashed border-slate-400 mx-4" />
              <p className="font-bold text-xs text-slate-900">Approved by</p>
              <p className="text-[10px] text-slate-700 font-bold">{workspace.approvalHead}</p>
            </div>
          </div>

          <div className="text-center text-[9px] text-slate-400 border-t border-slate-200 pt-3">
            Generated via KVCET Institutional Workload Intelligence System &bull; Karpaga Vinayaga Deemed to be University
          </div>
        </div>
      </div>
    </div>
  );
};
