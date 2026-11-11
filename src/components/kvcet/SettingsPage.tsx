import React from 'react';
import {
  Settings,
  Download,
  Upload,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
  Building2,
  Trash2,
} from 'lucide-react';
import { WorkspaceConfig, AllocationRecord } from '../../types/workload';

interface SettingsPageProps {
  workspace: WorkspaceConfig;
  onUpdateWorkspace: (updated: Partial<WorkspaceConfig>) => void;
  onExportBackup: () => void;
  onRestoreBackup: (file: File) => void;
  onClearWorkspace: () => void;
  allocationsCount: number;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  workspace,
  onUpdateWorkspace,
  onExportBackup,
  onRestoreBackup,
  onClearWorkspace,
  allocationsCount,
}) => {
  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onRestoreBackup(e.target.files[0]);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600 font-mono">
          System Governance &bull; Academic Standards
        </span>
        <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
          Workspace Rules & Institutional Settings
        </h2>
        <p className="text-xs text-slate-500">
          Transparent workload calculation policies, university identity configuration, and offline data backups
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Workspace Identity */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-900">University & Department Identity</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Institution Full Name</label>
              <input
                type="text"
                value={workspace.institution}
                onChange={(e) => onUpdateWorkspace({ institution: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Short Brand Name</label>
                <input
                  type="text"
                  value={workspace.institutionShort}
                  onChange={(e) => onUpdateWorkspace({ institutionShort: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Academic Year</label>
                <input
                  type="text"
                  value={workspace.year}
                  onChange={(e) => onUpdateWorkspace({ year: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Department / School Name</label>
              <input
                type="text"
                value={workspace.department}
                onChange={(e) => onUpdateWorkspace({ department: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Principal / Dean Approver</label>
              <input
                type="text"
                value={workspace.approvalHead}
                onChange={(e) => onUpdateWorkspace({ approvalHead: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Data Protection & Backup */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-sm text-slate-900">Data Protection & Offline Backups</h3>
            </div>

            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900 mb-4">
              <span className="font-bold">● Local Autosave Enabled</span>
              <span className="font-mono">{allocationsCount} allocations saved</span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              All modifications are persisted in your local browser storage. Download a portable JSON backup file to keep archives or transfer your workload setup to other administrative devices.
            </p>
          </div>

          <div className="space-y-2 pt-4 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={onExportBackup}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Full Backup JSON</span>
              </button>

              <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Restore Backup File</span>
                <input
                  type="file"
                  accept="application/json,.json"
                  onChange={handleRestoreFile}
                  className="hidden"
                />
              </label>
            </div>

            <button
              onClick={onClearWorkspace}
              className="text-[11px] text-rose-600 hover:text-rose-800 hover:underline pt-1 cursor-pointer block"
            >
              Clear saved local workspace
            </button>
          </div>
        </div>

        {/* Workload Calculation Rules */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-900">Workload Calculation Policy</h3>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-mono font-bold border border-blue-200">
              Weekly Contact = L + T + P
            </span>
            <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 font-mono font-bold border border-indigo-200">
              Theory Hours = L + T
            </span>
            <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 font-mono font-bold border border-emerald-200">
              Practical Hours = P
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Credits represent statutory academic units and are not converted into hours unless the syllabus explicitly mandates a period structure. LIT courses are handled separately so that theory and practical components are tracked without duplicate counting.
          </p>
        </div>

        {/* Validation Logic */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-900">Validation Status Definitions</h3>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-start gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                MATCH
              </span>
              <span className="text-slate-600">
                Course title, course code, credits, and syllabus L-T-P pattern completely agree.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                REVIEW
              </span>
              <span className="text-slate-600">
                Minor title deviation, partial match, or syllabus contact periods require manual confirmation.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border-rose-200 shrink-0">
                MISMATCH
              </span>
              <span className="text-slate-600">
                Workload plan credits or period hours conflict directly with the regulation curriculum.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
