import { AppActivity, ActivityType } from '../types/activity';

const ACTIVITY_STORAGE_KEY = 'kvcet_activity_log_v2';
const ACTIVITY_EVENT_NAME = 'kvcet_activity_logged';

// Seed default initial activities if user has not yet performed 5 operations
const DEFAULT_INITIAL_ACTIVITIES: AppActivity[] = [
  {
    id: 'act-init-1',
    type: 'bulk_assign',
    title: 'Bulk Assign',
    description: 'Bulk assigned faculty to 3 course allocations in Computer Science',
    timestamp: new Date(Date.now() - 1000 * 60 * 6).toISOString(), // 6 mins ago
    actor: 'Dr. Principal (Super Admin)',
  },
  {
    id: 'act-init-2',
    type: 'add_course',
    title: 'Added Course',
    description: 'Added course allocation CS25401 (Data Structures and Algorithms)',
    timestamp: new Date(Date.now() - 1000 * 60 * 24).toISOString(), // 24 mins ago
    actor: 'Academic Dean / Admin',
  },
  {
    id: 'act-init-3',
    type: 'import_csv',
    title: 'Imported CSV',
    description: 'Imported 34 official curriculum allocation records via CSV upload',
    timestamp: new Date(Date.now() - 1000 * 60 * 55).toISOString(), // 55 mins ago
    actor: 'System Ingestion Engine',
  },
  {
    id: 'act-init-4',
    type: 'create_report',
    title: 'Created Report',
    description: 'Generated Department Workload Progress Report for CSE Department',
    timestamp: new Date(Date.now() - 1000 * 60 * 130).toISOString(), // ~2 hours ago
    actor: 'Academic Dean / Admin',
  },
  {
    id: 'act-init-5',
    type: 'register_dept',
    title: 'Department Setup',
    description: 'Registered CSE Department with appointed Head of Department',
    timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(), // ~4 hours ago
    actor: 'Dr. Principal (Super Admin)',
  },
];

export function getStoredActivities(): AppActivity[] {
  try {
    const raw = localStorage.getItem(ACTIVITY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse activity storage', e);
  }

  // Save and return initial seeds
  try {
    localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(DEFAULT_INITIAL_ACTIVITIES));
  } catch {}
  return DEFAULT_INITIAL_ACTIVITIES;
}

export function logAppActivity(
  type: ActivityType,
  title: string,
  description: string,
  actor?: string
): AppActivity {
  const newActivity: AppActivity = {
    id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    type,
    title,
    description,
    timestamp: new Date().toISOString(),
    actor: actor || 'Active User',
  };

  try {
    const current = getStoredActivities();
    const updated = [newActivity, ...current.filter((a) => a.id !== newActivity.id)].slice(0, 25);
    localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(updated));

    // Dispatch custom event for real-time reactivity in mounted components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(ACTIVITY_EVENT_NAME, { detail: newActivity }));
    }
  } catch (e) {
    console.error('Failed to log activity', e);
  }

  return newActivity;
}

export function subscribeToActivities(callback: (activities: AppActivity[]) => void): () => void {
  const handler = () => {
    callback(getStoredActivities());
  };

  if (typeof window !== 'undefined') {
    window.addEventListener(ACTIVITY_EVENT_NAME, handler);
    window.addEventListener('storage', handler);
  }

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener(ACTIVITY_EVENT_NAME, handler);
      window.removeEventListener('storage', handler);
    }
  };
}

export function formatActivityTimestamp(isoString: string): { relative: string; full: string } {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
      return { relative: 'Recently', full: isoString };
    }

    const now = Date.now();
    const diffSec = Math.floor((now - date.getTime()) / 1000);

    let relative = 'Just now';
    if (diffSec < 45) {
      relative = 'Just now';
    } else if (diffSec < 3600) {
      const mins = Math.max(1, Math.floor(diffSec / 60));
      relative = `${mins}m ago`;
    } else if (diffSec < 86400) {
      const hours = Math.floor(diffSec / 3600);
      relative = `${hours}h ago`;
    } else if (diffSec < 86400 * 2) {
      relative = 'Yesterday';
    } else {
      const days = Math.floor(diffSec / 86400);
      relative = `${days}d ago`;
    }

    const full = date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      month: 'short',
      day: 'numeric',
    });

    return { relative, full };
  } catch {
    return { relative: 'Recently', full: isoString };
  }
}
