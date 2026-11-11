import React, { useEffect, useState } from 'react';
import {
  History,
  UserCheck,
  PlusCircle,
  Trash2,
  FileSpreadsheet,
  BookOpen,
  FileCheck2,
  Building2,
  Users,
  RotateCcw,
  Clock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { AppActivity, ActivityType } from '../../types/activity';
import {
  getStoredActivities,
  subscribeToActivities,
  formatActivityTimestamp,
} from '../../utils/activityTracker';

interface RecentActivityWidgetProps {
  onNavigate?: (page: string) => void;
  maxItems?: number;
}

export const RecentActivityWidget: React.FC<RecentActivityWidgetProps> = ({
  onNavigate,
  maxItems = 5,
}) => {
  const [activities, setActivities] = useState<AppActivity[]>([]);

  useEffect(() => {
    // Initial fetch
    setActivities(getStoredActivities().slice(0, maxItems));

    // Subscribe to live activity events
    const unsubscribe = subscribeToActivities((updated) => {
      setActivities(updated.slice(0, maxItems));
    });

    return unsubscribe;
  }, [maxItems]);

  const getActivityVisuals = (type: ActivityType) => {
    switch (type) {
      case 'bulk_assign':
        return {
          icon: <UserCheck className="w-4 h-4 text-indigo-600" />,
          badgeClass: 'bg-indigo-50 border-indigo-200 text-indigo-700',
          bgIconClass: 'bg-indigo-100/70',
        };
      case 'add_course':
        return {
          icon: <PlusCircle className="w-4 h-4 text-blue-600" />,
          badgeClass: 'bg-blue-50 border-blue-200 text-blue-700',
          bgIconClass: 'bg-blue-100/70',
        };
      case 'import_csv':
        return {
          icon: <FileSpreadsheet className="w-4 h-4 text-purple-600" />,
          badgeClass: 'bg-purple-50 border-purple-200 text-purple-700',
          bgIconClass: 'bg-purple-100/70',
        };
      case 'bulk_delete':
      case 'delete_course':
        return {
          icon: <Trash2 className="w-4 h-4 text-rose-600" />,
          badgeClass: 'bg-rose-50 border-rose-200 text-rose-700',
          bgIconClass: 'bg-rose-100/70',
        };
      case 'create_report':
        return {
          icon: <FileCheck2 className="w-4 h-4 text-sky-600" />,
          badgeClass: 'bg-sky-50 border-sky-200 text-sky-700',
          bgIconClass: 'bg-sky-100/70',
        };
      case 'register_dept':
        return {
          icon: <Building2 className="w-4 h-4 text-emerald-600" />,
          badgeClass: 'bg-emerald-50 border-emerald-200 text-emerald-700',
          bgIconClass: 'bg-emerald-100/70',
        };
      case 'add_staff':
        return {
          icon: <Users className="w-4 h-4 text-cyan-600" />,
          badgeClass: 'bg-cyan-50 border-cyan-200 text-cyan-700',
          bgIconClass: 'bg-cyan-100/70',
        };
      case 'load_curriculum':
        return {
          icon: <BookOpen className="w-4 h-4 text-amber-600" />,
          badgeClass: 'bg-amber-50 border-amber-200 text-amber-700',
          bgIconClass: 'bg-amber-100/70',
        };
      case 'undo':
        return {
          icon: <RotateCcw className="w-4 h-4 text-slate-600" />,
          badgeClass: 'bg-slate-100 border-slate-200 text-slate-700',
          bgIconClass: 'bg-slate-200/70',
        };
      default:
        return {
          icon: <History className="w-4 h-4 text-blue-600" />,
          badgeClass: 'bg-blue-50 border-blue-200 text-blue-700',
          bgIconClass: 'bg-blue-100/70',
        };
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden flex flex-col justify-between">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <History className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Recent Activity</h3>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-extrabold font-mono uppercase">
              Last {Math.min(activities.length, maxItems)} Operations
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time institutional audit log of recent course registrations, bulk assignments, and imports
          </p>
        </div>

        {onNavigate && (
          <button
            onClick={() => onNavigate('subjects')}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer shrink-0"
          >
            <span>Subject Register</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Activity List */}
      <div className="p-4 sm:p-5">
        {activities.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            <Clock className="w-6 h-6 text-slate-300 mx-auto mb-2" />
            <p>No recent activity recorded yet.</p>
          </div>
        ) : (
          <div className="relative pl-3 space-y-4 before:absolute before:left-5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
            {activities.map((item) => {
              const { icon, badgeClass, bgIconClass } = getActivityVisuals(item.type);
              const time = formatActivityTimestamp(item.timestamp);

              return (
                <div key={item.id} className="relative flex items-start gap-3 group">
                  {/* Icon Node */}
                  <div
                    className={`relative z-10 w-7 h-7 rounded-lg ${bgIconClass} flex items-center justify-center shrink-0 border border-white shadow-2xs`}
                  >
                    {icon}
                  </div>

                  {/* Activity Details */}
                  <div className="flex-1 min-w-0 bg-slate-50/60 hover:bg-slate-50 p-2.5 rounded-xl border border-slate-100 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase border font-mono tracking-tight ${badgeClass}`}
                        >
                          {item.title}
                        </span>
                        {item.actor && (
                          <span className="text-[11px] font-semibold text-slate-600">
                            &bull; {item.actor}
                          </span>
                        )}
                      </div>

                      {/* Timestamp */}
                      <span
                        className="text-[11px] font-mono font-medium text-slate-400 shrink-0 flex items-center gap-1"
                        title={time.full}
                      >
                        <Clock className="w-3 h-3 text-slate-300" />
                        {time.relative}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 mt-1 font-medium leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Note */}
      <div className="px-5 py-2.5 bg-slate-50/70 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          <span>Operations automatically sync across browser sessions and active workspaces</span>
        </span>
        <span className="font-mono text-[10px] text-slate-400">Audit Trail Active</span>
      </div>
    </div>
  );
};
