import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, User, ChevronDown, Check } from 'lucide-react';
import { UserProfile, UserRole } from '../../types/rbac';
import { DEFAULT_USERS, getStoredUser, setStoredUser } from '../../api/client';

interface RoleSelectorProps {
  currentUser: UserProfile;
  onUserChange: (user: UserProfile) => void;
}

export const RoleSelector: React.FC<RoleSelectorProps> = ({ currentUser, onUserChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (user: UserProfile) => {
    setStoredUser(user);
    onUserChange(user);
    setIsOpen(false);
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return {
          bg: 'bg-purple-100 text-purple-800 border-purple-300',
          dot: 'bg-purple-600',
          icon: ShieldAlert,
          label: 'Super Admin',
        };
      case 'admin':
        return {
          bg: 'bg-blue-100 text-blue-800 border-blue-300',
          dot: 'bg-blue-600',
          icon: ShieldCheck,
          label: 'Admin',
        };
      default:
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-300',
          dot: 'bg-slate-500',
          icon: User,
          label: 'Normal User',
        };
    }
  };

  const currentBadge = getRoleBadge(currentUser.role);
  const Icon = currentBadge.icon;

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-2xs transition-all cursor-pointer"
        title="Switch user role for access control testing"
      >
        <span className={`w-2 h-2 rounded-full ${currentBadge.dot}`} />
        <Icon className="w-3.5 h-3.5 text-slate-600" />
        <span className="font-bold text-slate-800 hidden sm:inline">{currentUser.name}</span>
        <span
          className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide border ${currentBadge.bg}`}
        >
          {currentBadge.label}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-72 rounded-xl bg-white shadow-xl border border-slate-200 z-50 p-2 text-xs divide-y divide-slate-100">
            <div className="px-3 py-2 text-[11px] text-slate-500">
              <p className="font-bold text-slate-700 mb-0.5">Role-Based Access Control</p>
              <p className="text-[10px] leading-tight">
                Switch role to verify frontend & backend permissions. Only Super Admin & Admin can modify departments and staff.
              </p>
            </div>

            <div className="py-1 space-y-1">
              {DEFAULT_USERS.map((user) => {
                const isSelected = user.id === currentUser.id;
                const badge = getRoleBadge(user.role);
                const ItemIcon = badge.icon;
                return (
                  <button
                    key={user.id}
                    onClick={() => handleSelect(user)}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 text-blue-900 font-semibold'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1 rounded-md ${badge.bg}`}>
                        <ItemIcon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          <span>{user.name}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-normal">
                          {user.email} &bull; {badge.label}
                        </div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="px-3 py-2 bg-slate-50 rounded-b-lg text-[10px] text-slate-600 space-y-1">
              <div className="font-semibold text-slate-700">Access Privileges:</div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Super Admin / Admin: Full CRUD on Depts & Staff</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>Normal Users: Read-only access to master data</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
