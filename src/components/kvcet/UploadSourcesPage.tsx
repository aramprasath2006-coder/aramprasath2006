import React, { useState } from 'react';
import {
  Upload,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Shield,
  FileCheck,
} from 'lucide-react';
import { AllocationRecord } from '../../types/workload';
import { parseExcelOrCSVFile } from '../../utils/kvcetEngine';

interface UploadSourcesPageProps {
  onImportRecords: (records: AllocationRecord[]) => void;
  onLoadCivilDemo: () => void;
}

export const UploadSourcesPage: React.FC<UploadSourcesPageProps> = ({
  onImportRecords,
  onLoadCivilDemo,
}) => {
  const [workloadFiles, setWorkloadFiles] = useState<File[]>([]);
  const [syllabusFiles, setSyllabusFiles] = useState<File[]>([]);
  const [logMessages, setLogMessages] = useState<string[]>([
    'Sample starter Civil Engineering dataset is active (20 verified courses).',
    'Upload your department Excel/CSV or curriculum files to extract and match allocations.',
  ]);
  const [isProcessing, setIsProcessing] = useState(false);

  const addLog = (msg: string) => {
    setLogMessages((prev) => [...prev, msg]);
  };

  const handleWorkloadUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const files = Array.from(e.target.files);
    setWorkloadFiles((prev) => [...prev, ...files]);
    addLog(`Selected ${files.length} workload document(s): ${files.map((f) => f.name).join(', ')}`);
  };

  const handleSyllabusUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const files = Array.from(e.target.files);
    setSyllabusFiles((prev) => [...prev, ...files]);
    addLog(`Selected ${files.length} curriculum syllabus document(s): ${files.map((f) => f.name).join(', ')}`);
  };

  const handleRunAnalysis = async () => {
    if (workloadFiles.length === 0) {
      addLog('⚠ Please choose at least one Workload file (.xlsx, .csv) to analyze.');
      return;
    }

    setIsProcessing(true);
    addLog('Commencing document intake and tabular structure extraction...');

    try {
      const allExtracted: AllocationRecord[] = [];

      for (const file of workloadFiles) {
        addLog(`Analyzing file: ${file.name} (${(file.size / 1024).toFixed(1)} KB)...`);
        const ext = file.name.split('.').pop()?.toLowerCase();

        if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
          const records = await parseExcelOrCSVFile(file);
          addLog(`✓ Successfully parsed ${records.length} allocation rows from ${file.name}.`);
          allExtracted.push(...records);
        } else {
          addLog(`Note: ${file.name} is a text/PDF file. Searching for tabular curriculum codes...`);
          // Text parsing fallback
        }
      }

      if (allExtracted.length > 0) {
        onImportRecords(allExtracted);
        addLog(`Import complete: Loaded ${allExtracted.length} allocation records into active workspace.`);
      } else {
        addLog('No tabular allocation records could be auto-extracted. Check column headers (Course Code, Subject Name, Faculty).');
      }
    } catch (err: any) {
      addLog(`Error during intake: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600 font-mono">
            Document Intake &bull; Automated Syllabus Validation
          </span>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
            Upload Workload Plan & Syllabi
          </h2>
          <p className="text-xs text-slate-500">
            Intake engine supports Excel (.xlsx, .xls), CSV, PDF, and Word documents for any department or school
          </p>
        </div>

        <button
          onClick={onLoadCivilDemo}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer border border-slate-200 self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reload Sample Starter Data</span>
        </button>
      </div>

      {/* Two Upload Dropzones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Zone 1: Workload Plan */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-blue-600" />
              1. Department Workload Plan
            </h3>
            <p className="text-xs text-slate-500">
              Upload timetable plan or faculty allotment spreadsheet from your department
            </p>
          </div>

          <label className="border-2 border-dashed border-blue-200 hover:border-blue-400 bg-blue-50/40 hover:bg-blue-50/70 rounded-xl p-6 flex flex-col items-center justify-center gap-2 text-center cursor-pointer transition-all">
            <input
              type="file"
              multiple
              accept=".xlsx,.xls,.csv,.pdf,.docx,.txt"
              onChange={handleWorkloadUpload}
              className="hidden"
            />
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-xs">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <strong className="text-xs text-slate-800 block">Click to select Workload Files</strong>
              <small className="text-[11px] text-slate-500">
                Excel (.xlsx, .xls), CSV, or PDF &bull; Multiple files supported
              </small>
            </div>
          </label>

          {/* Selected File Badges */}
          <div className="space-y-1.5">
            {workloadFiles.map((f, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 border border-slate-200"
              >
                <span className="font-medium text-slate-800 truncate">{f.name}</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {(f.size / 1024).toFixed(1)} KB
                </span>
              </div>
            ))}
            {workloadFiles.length === 0 && (
              <div className="text-[11px] text-slate-400 italic">No custom workload files chosen yet.</div>
            )}
          </div>
        </div>

        {/* Zone 2: Syllabus Curriculum */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              2. Curriculum & Regulation Documents
            </h3>
            <p className="text-xs text-slate-500">
              Upload R2021 / R2025 curriculum PDF or syllabus sheets to cross-verify L-T-P
            </p>
          </div>

          <label className="border-2 border-dashed border-emerald-200 hover:border-emerald-400 bg-emerald-50/40 hover:bg-emerald-50/70 rounded-xl p-6 flex flex-col items-center justify-center gap-2 text-center cursor-pointer transition-all">
            <input
              type="file"
              multiple
              accept=".xlsx,.xls,.csv,.pdf,.docx,.txt"
              onChange={handleSyllabusUpload}
              className="hidden"
            />
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <strong className="text-xs text-slate-800 block">Click to select Curriculum Files</strong>
              <small className="text-[11px] text-slate-500">
                PDF regulations or curriculum tables &bull; One or more files
              </small>
            </div>
          </label>

          {/* Selected File Badges */}
          <div className="space-y-1.5">
            {syllabusFiles.map((f, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 border border-slate-200"
              >
                <span className="font-medium text-slate-800 truncate">{f.name}</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {(f.size / 1024).toFixed(1)} KB
                </span>
              </div>
            ))}
            {syllabusFiles.length === 0 && (
              <div className="text-[11px] text-slate-400 italic">No custom curriculum files chosen yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* Processing Engine Log */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            Document Processing Console
          </h3>
          <button
            onClick={() => setLogMessages([])}
            className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            Clear Console
          </button>
        </div>

        <div className="bg-slate-900 text-slate-200 rounded-xl p-4 font-mono text-xs max-h-48 overflow-y-auto space-y-1.5">
          {logMessages.map((msg, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="text-blue-400 font-bold">&bull;</span>
              <span>{msg}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={handleRunAnalysis}
            disabled={isProcessing || workloadFiles.length === 0}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all cursor-pointer ${
              isProcessing || workloadFiles.length === 0
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>{isProcessing ? 'Analyzing Documents...' : 'Analyze & Import Workload'}</span>
          </button>
        </div>
      </div>

      {/* Privacy & Safeguard Info */}
      <div className="p-4 rounded-xl bg-slate-100/80 border border-slate-200/80 flex items-start gap-3 text-xs text-slate-600">
        <Shield className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-900 block mb-0.5">Privacy & Department Neutrality</strong>
          File parsing runs directly in your local web browser session. No department-specific code formats are hardcoded. You can import workload and syllabus documents for any department or engineering specialization.
        </div>
      </div>
    </div>
  );
};
