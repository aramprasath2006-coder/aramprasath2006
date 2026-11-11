import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  AlertTriangle,
  User,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { TimetableEntry, AllocationRecord, DayOfWeek } from '../../types/workload';

interface TimetablePageProps {
  entries: TimetableEntry[];
  allocations: AllocationRecord[];
  onAddEntry: (entry: Omit<TimetableEntry, 'id'>) => void;
  onDeleteEntry: (id: string) => void;
}

const PERIOD_TIMINGS = [
  { period: 1, timeString: '08:45 - 09:40' },
  { period: 2, timeString: '09:40 - 10:35' },
  { period: 3, timeString: '10:55 - 11:45' },
  { period: 4, timeString: '11:45 - 12:40' },
  { period: 5, timeString: '01:30 - 02:25' },
  { period: 6, timeString: '02:25 - 03:20' },
  { period: 7, timeString: '03:20 - 04:15' },
];

const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const TimetablePage: React.FC<TimetablePageProps> = ({
  entries,
  allocations,
  onAddEntry,
  onDeleteEntry,
}) => {
  const [filterMode, setFilterMode] = useState<'faculty' | 'class'>('faculty');
  const facultyNames = Array.from(new Set(allocations.map((d) => d.faculty))).sort();
  const [selectedFaculty, setSelectedFaculty] = useState<string>(facultyNames[0] || 'Dr G. Premkumar');
  const [selectedSem, setSelectedSem] = useState<string>('IV');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<{
    day: DayOfWeek;
    period: number;
    courseCode: string;
    courseName: string;
    facultyName: string;
    roomOrLab: string;
    sem: string;
  }>({
    day: 'Monday',
    period: 1,
    courseCode: '',
    courseName: '',
    facultyName: selectedFaculty || facultyNames[0] || '',
    roomOrLab: 'Civil LH-101',
    sem: 'IV',
  });

  // Clashes
  const clashes: string[] = [];
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const e1 = entries[i];
      const e2 = entries[j];
      if (e1.day === e2.day && e1.period === e2.period) {
        if (e1.facultyName === e2.facultyName) {
          clashes.push(
            `${e1.facultyName} is scheduled in both ${e1.courseCode} and ${e2.courseCode} at ${e1.day} Period ${e1.period}!`
          );
        }
      }
    }
  }

  const displayedEntries =
    filterMode === 'faculty'
      ? entries.filter((e) => e.facultyName === selectedFaculty)
      : entries.filter((e) => e.sem === selectedSem);

  const handleOpenAdd = (day?: DayOfWeek, period?: number) => {
    setFormData({
      day: day || 'Monday',
      period: period || 1,
      courseCode: allocations[0]?.code || 'CE25401',
      courseName: allocations[0]?.name || 'Strength of Materials II',
      facultyName: selectedFaculty || facultyNames[0] || '',
      roomOrLab: 'Civil LH-101',
      sem: selectedSem || 'IV',
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const timing = PERIOD_TIMINGS.find((p) => p.period === Number(formData.period));
    onAddEntry({
      day: formData.day,
      period: Number(formData.period),
      timeString: timing?.timeString || '08:45 - 09:40',
      courseCode: formData.courseCode,
      courseName: formData.courseName,
      facultyName: formData.facultyName,
      department: 'Civil Engineering',
      roomOrLab: formData.roomOrLab,
      sem: formData.sem,
    });
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600 font-mono">
            Weekly Master Contact Matrix &bull; Period Scheduler
          </span>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
            Institutional Weekly Timetable
          </h2>
          <p className="text-xs text-slate-500">
            7-period schedule matrix with real-time double-booking clash alerts
          </p>
        </div>

        <button
          onClick={() => handleOpenAdd()}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Schedule Period</span>
        </button>
      </div>

      {/* Clashes Banner */}
      {clashes.length > 0 && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-1">
          <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Timetable Collision Alert ({clashes.length} clashes detected):</span>
          </div>
          <ul className="text-xs text-rose-700 pl-6 list-disc space-y-0.5">
            {clashes.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      )}

      {/* View Switcher Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-500">View By:</span>
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
            <button
              onClick={() => setFilterMode('faculty')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                filterMode === 'faculty' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600'
              }`}
            >
              Faculty Schedule
            </button>
            <button
              onClick={() => setFilterMode('class')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                filterMode === 'class' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600'
              }`}
            >
              Class / Semester
            </button>
          </div>
        </div>

        {filterMode === 'faculty' ? (
          <div className="flex items-center space-x-2 text-xs">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-500">Faculty:</span>
            <select
              value={selectedFaculty}
              onChange={(e) => setSelectedFaculty(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-800 cursor-pointer"
            >
              {facultyNames.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-xs">
            <span className="font-semibold text-slate-500">Semester:</span>
            <select
              value={selectedSem}
              onChange={(e) => setSelectedSem(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-800 cursor-pointer"
            >
              {['IV', 'VI', 'VIII'].map((s) => (
                <option key={s} value={s}>Semester {s}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-x-auto">
        <table className="w-full border-collapse text-left min-w-[880px]">
          <thead>
            <tr className="bg-slate-50 text-[10px] uppercase tracking-wider font-extrabold text-slate-500 border-b border-slate-200">
              <th className="p-3 border-r border-slate-200 w-28 text-center">Day / Time</th>
              {PERIOD_TIMINGS.map((p) => (
                <th key={p.period} className="p-3 border-r border-slate-200 text-center min-w-[110px]">
                  <div>Period {p.period}</div>
                  <div className="text-[9px] font-mono text-slate-400 font-normal">{p.timeString}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-xs">
            {DAYS.map((day) => (
              <tr key={day} className="hover:bg-slate-50/40 transition-colors">
                <td className="p-3 font-bold text-slate-800 bg-slate-50/70 border-r border-slate-200 text-center">
                  {day}
                </td>
                {PERIOD_TIMINGS.map((p) => {
                  const entry = displayedEntries.find(
                    (e) => e.day === day && e.period === p.period
                  );

                  return (
                    <td
                      key={p.period}
                      className="p-2 border-r border-slate-200 align-top h-24 hover:bg-blue-50/30 transition-colors relative group"
                    >
                      {entry ? (
                        <div className="h-full bg-white rounded-lg border border-blue-200 p-2 shadow-2xs flex flex-col justify-between space-y-1 hover:border-blue-400 transition-colors">
                          <div>
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="font-mono font-bold text-blue-700 bg-blue-50 px-1 rounded">
                                {entry.courseCode || 'CRS'}
                              </span>
                              <span className="text-slate-400 font-bold">Sem {entry.sem}</span>
                            </div>
                            <p className="font-bold text-slate-900 text-[11px] line-clamp-1 mt-0.5" title={entry.courseName}>
                              {entry.courseName}
                            </p>
                            <div className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                              <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                              <span className="truncate">{entry.roomOrLab}</span>
                            </div>
                            {filterMode === 'class' && (
                              <p className="text-[10px] font-semibold text-slate-700 truncate mt-0.5">
                                {entry.facultyName}
                              </p>
                            )}
                          </div>

                          <button
                            onClick={() => {
                              if (window.confirm('Remove this timetable slot?')) {
                                onDeleteEntry(entry.id);
                              }
                            }}
                            className="text-slate-300 hover:text-rose-600 self-end p-0.5 transition-colors cursor-pointer"
                            title="Delete Slot"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOpenAdd(day, p.period)}
                          className="w-full h-full rounded border border-dashed border-transparent hover:border-blue-300 flex items-center justify-center text-slate-300 hover:text-blue-600 transition-colors cursor-pointer group"
                          title={`Schedule ${day} Period ${p.period}`}
                        >
                          <Plus className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Schedule Timetable Period</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Day</label>
                  <select
                    value={formData.day}
                    onChange={(e) => setFormData({ ...formData, day: e.target.value as DayOfWeek })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer"
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Period</label>
                  <select
                    value={formData.period}
                    onChange={(e) => setFormData({ ...formData, period: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer"
                  >
                    {PERIOD_TIMINGS.map((p) => (
                      <option key={p.period} value={p.period}>Period {p.period} ({p.timeString})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Select Course from Catalogue</label>
                <select
                  value={formData.courseCode}
                  onChange={(e) => {
                    const sel = allocations.find((a) => a.code === e.target.value);
                    setFormData({
                      ...formData,
                      courseCode: e.target.value,
                      courseName: sel?.name || '',
                    });
                  }}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer font-medium"
                >
                  {allocations.map((a) => (
                    <option key={a.id} value={a.code}>
                      {a.code || 'NO-CODE'}: {a.name} ({a.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Faculty In-charge</label>
                <select
                  value={formData.facultyName}
                  onChange={(e) => setFormData({ ...formData, facultyName: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer font-medium"
                >
                  {facultyNames.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Room / Lab</label>
                  <input
                    type="text"
                    value={formData.roomOrLab}
                    onChange={(e) => setFormData({ ...formData, roomOrLab: e.target.value })}
                    placeholder="LH-101 or Lab"
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Semester</label>
                  <input
                    type="text"
                    value={formData.sem}
                    onChange={(e) => setFormData({ ...formData, sem: e.target.value })}
                    placeholder="IV"
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer shadow-xs"
                >
                  Save Period
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
