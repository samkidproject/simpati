/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LayoutDashboard, Users, Calendar, Bot, Settings } from 'lucide-react';

interface BottomNavProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  darkMode: boolean;
}

export default function BottomNav({
  currentTab,
  setCurrentTab,
  darkMode
}: BottomNavProps) {
  const navItems = [
    { id: 'dashboard', label: 'Ringkasan', icon: LayoutDashboard },
    { id: 'pegawai', label: 'Pegawai', icon: Users },
    { id: 'kalender', label: 'Kalender', icon: Calendar },
    { id: 'ai', label: 'Smart AI', icon: Bot },
    { id: 'pengaturan', label: 'Setelan', icon: Settings },
  ];

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 h-16 md:hidden flex items-center justify-around z-40 border-t pb-safe shadow-lg px-2 ${
        darkMode
          ? 'bg-gray-900 border-gray-800 text-gray-200'
          : 'bg-white border-gray-200 text-gray-700'
      }`}
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;
        return (
          <button
            key={item.id}
            id={`bottom-nav-${item.id}`}
            onClick={() => setCurrentTab(item.id)}
            className="flex flex-col items-center justify-center w-20 h-full relative cursor-pointer group"
          >
            {/* Soft indicator pill background */}
            {isActive && (
              <span className="absolute top-1.5 h-7 w-12 rounded-full bg-amber-500/20 animate-pulse" />
            )}

            <Icon
              className={`w-5.5 h-5.5 z-10 transition-transform duration-200 ${
                isActive
                  ? 'text-amber-500 scale-110'
                  : darkMode
                  ? 'text-gray-400 group-hover:text-amber-400'
                  : 'text-gray-500 group-hover:text-amber-600'
              }`}
            />
            <span
              className={`text-[10px] font-sans tracking-tight mt-1 font-medium z-10 ${
                isActive
                  ? 'text-amber-500 font-semibold'
                  : darkMode
                  ? 'text-gray-400'
                  : 'text-gray-500'
              }`}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
