import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import { Building2, Layers, Clock, Users, ArrowUpRight, Award, BarChart3 } from 'lucide-react';
import { AllocationRecord } from '../../types/workload';
import { computeHours } from '../../utils/kvcetEngine';

interface DepartmentResourceUtilizationChartProps {
  data: AllocationRecord[];
}

interface DepartmentUtilizationData {
  department: string;
  shortName: string;
  theoryHours: number; // L + T
  labHours: number; // P
  totalHours: number; // L + T + P
  facultyCount: number;
  courseCount: number;
  avgLoadPerFaculty: number;
}

export const DepartmentResourceUtilizationChart: React.FC<DepartmentResourceUtilizationChartProps> = ({
  data,
}) => {
  const [chartMode, setChartMode] = useState<'stacked' | 'grouped'>('stacked');

  // Aggregate department-wise metrics
  const deptMap = new Map<
    string,
    {
      theoryHours: number;
      labHours: number;
      facultySet: Set<string>;
      courseCount: number;
    }
  >();

  data.forEach((d) => {
    const dept = d.department?.trim() || 'Unspecified';
    if (!deptMap.has(dept)) {
      deptMap.set(dept, {
        theoryHours: 0,
        labHours: 0,
        facultySet: new Set<string>(),
        courseCount: 0,
      });
    }

    const entry = deptMap.get(dept)!;
    entry.courseCount++;
    if (d.faculty) {
      entry.facultySet.add(d.faculty);
    }

    if (d.L !== null && d.T !== null) {
      entry.theoryHours += (d.L || 0) + (d.T || 0);
    }
    if (d.P !== null) {
      entry.labHours += d.P || 0;
    }
  });

  const chartData: DepartmentUtilizationData[] = Array.from(deptMap.entries()).map(
    ([dept, val]) => {
      // Abbreviate department name for clean axis rendering
      let short = dept;
      if (dept.toLowerCase().includes('civil')) short = 'Civil Engg';
      else if (dept.toLowerCase().includes('computer science') || dept.toLowerCase().includes('cse'))
        short = 'CSE';
      else if (dept.toLowerCase().includes('artificial intelligence') || dept.toLowerCase().includes('ai&ds'))
        short = 'AI & DS';
      else if (dept.toLowerCase().includes('electronics and communication') || dept.toLowerCase().includes('ece'))
        short = 'ECE';
      else if (dept.toLowerCase().includes('mechanical')) short = 'Mech Engg';
      else if (dept.toLowerCase().includes('humanities') || dept.toLowerCase().includes('s&h'))
        short = 'S&H';
      else if (dept.length > 16) short = dept.slice(0, 14) + '…';

      const total = val.theoryHours + val.labHours;
      const facultyCount = val.facultySet.size;
      const avg = facultyCount > 0 ? Number((total / facultyCount).toFixed(1)) : 0;

      return {
        department: dept,
        shortName: short,
        theoryHours: val.theoryHours,
        labHours: val.labHours,
        totalHours: total,
        facultyCount,
        courseCount: val.courseCount,
        avgLoadPerFaculty: avg,
      };
    }
  ).sort((a, b) => b.totalHours - a.totalHours);

  // Institutional Summary Metrics
  const totalInstTheory = chartData.reduce((acc, d) => acc + d.theoryHours, 0);
  const totalInstLab = chartData.reduce((acc, d) => acc + d.labHours, 0);
  const totalInstHours = totalInstTheory + totalInstLab;
  const highestDept = chartData[0];
  const totalFacultyCount = Array.from(new Set(data.map((d) => d.faculty))).length;

  // Custom Rich Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item: DepartmentUtilizationData = payload[0].payload;
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-xl shadow-xl border border-slate-700 text-xs space-y-2 min-w-[210px] z-50">
          <div className="border-b border-slate-800 pb-1.5">
            <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider block">
              Department Resource Profile
            </span>
            <h4 className="font-extrabold text-white text-sm leading-tight">{item.department}</h4>
          </div>

          <div className="space-y-1 font-mono text-[11px]">
            <div className="flex items-center justify-between text-blue-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#2563eb]" />
                Theory & Tutorials (L+T):
              </span>
              <strong className="text-white">{item.theoryHours} hrs</strong>
            </div>

            <div className="flex items-center justify-between text-emerald-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#059669]" />
                Practical Labs (P):
              </span>
              <strong className="text-white">{item.labHours} hrs</strong>
            </div>

            <div className="flex items-center justify-between text-amber-300 pt-1 border-t border-slate-800 font-bold">
              <span>Total Department Load:</span>
              <strong className="text-amber-300 text-xs">{item.totalHours} hrs/wk</strong>
            </div>
          </div>

          <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
            <span>{item.facultyCount} faculty members</span>
            <span>Avg {item.avgLoadPerFaculty} hrs / faculty</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-5">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 font-bold">
              <BarChart3 className="w-4 h-4" />
            </span>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Departmental Teaching Hours Distribution
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Institutional resource utilization comparing weekly theoretical lectures and laboratory workloads across academic departments
          </p>
        </div>

        {/* View Switcher & Legend */}
        <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
            <button
              onClick={() => setChartMode('stacked')}
              className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
                chartMode === 'stacked'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Stacked (L+T vs Lab)
            </button>
            <button
              onClick={() => setChartMode('grouped')}
              className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
                chartMode === 'grouped'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Side-by-Side
            </button>
          </div>
        </div>
      </div>

      {/* Main Bar Chart Container */}
      <div className="w-full h-72 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 15, left: -10, bottom: 25 }}
            barSize={chartMode === 'stacked' ? 36 : 18}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="shortName"
              tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }}
              axisLine={{ stroke: '#cbd5e1' }}
              tickLine={false}
              interval={0}
              dy={8}
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
              axisLine={false}
              tickLine={false}
              unit="h"
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ paddingBottom: '12px', fontSize: '11px', fontWeight: 600 }}
              formatter={(value) => <span className="text-slate-700 font-medium">{value}</span>}
            />

            {chartMode === 'stacked' ? (
              <>
                <Bar
                  dataKey="theoryHours"
                  name="Theory & Tutorials (L+T)"
                  stackId="utilization"
                  fill="#2563eb"
                  radius={[0, 0, 4, 4]}
                />
                <Bar
                  dataKey="labHours"
                  name="Practical Labs (P)"
                  stackId="utilization"
                  fill="#059669"
                  radius={[6, 6, 0, 0]}
                />
              </>
            ) : (
              <>
                <Bar
                  dataKey="theoryHours"
                  name="Theory & Tutorials (L+T)"
                  fill="#2563eb"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="labHours"
                  name="Practical Labs (P)"
                  fill="#059669"
                  radius={[4, 4, 0, 0]}
                />
              </>
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Institutional Resource Utilization KPI Footers */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-0.5">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            Total Campus Load
          </span>
          <div className="text-base font-black text-slate-900 font-mono">
            {totalInstHours} <span className="text-xs font-normal text-slate-500">hrs/week</span>
          </div>
          <div className="text-[10px] text-slate-500">
            {totalInstTheory}h Theory &bull; {totalInstLab}h Practical
          </div>
        </div>

        <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-100 space-y-0.5">
          <span className="text-[10px] uppercase font-bold text-blue-700 tracking-wider">
            Top Teaching Department
          </span>
          <div className="text-base font-black text-blue-900 truncate">
            {highestDept ? highestDept.shortName : '—'}
          </div>
          <div className="text-[10px] font-mono text-blue-700 font-bold">
            {highestDept ? `${highestDept.totalHours} hrs (${highestDept.facultyCount} staff)` : '—'}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-100 space-y-0.5">
          <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">
            Theory vs Lab Ratio
          </span>
          <div className="text-base font-black text-emerald-900 font-mono">
            {totalInstHours > 0 ? `${Math.round((totalInstTheory / totalInstHours) * 100)}% : ${Math.round((totalInstLab / totalInstHours) * 100)}%` : '—'}
          </div>
          <div className="text-[10px] text-emerald-700">
            Lecture to Laboratory balance
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-0.5">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            Participating Departments
          </span>
          <div className="text-base font-black text-slate-900 font-mono">
            {chartData.length} <span className="text-xs font-normal text-slate-500">schools</span>
          </div>
          <div className="text-[10px] text-slate-500">
            {totalFacultyCount} total allocated faculty
          </div>
        </div>
      </div>
    </div>
  );
};
