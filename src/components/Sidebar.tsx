/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LayoutDashboard, Users, Calendar, Bot, Moon, Sun, ShieldAlert, Award, Settings } from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export default function Sidebar({
  currentTab,
  setCurrentTab,
  isOpen,
  setIsOpen,
  darkMode,
  toggleDarkMode
}: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pegawai', label: 'Data Pegawai', icon: Users },
    { id: 'kalender', label: 'Kalender ASN', icon: Calendar },
    { id: 'ai', label: 'SIMPATI AI', icon: Bot },
    { id: 'pengaturan', label: 'Pengaturan', icon: Settings },
  ];

  const handleMenuClick = (tabId: string) => {
    setCurrentTab(tabId);
    setIsOpen(false); // Close drawer on mobile
  };

  return (
    <>
      {/* Backdrop for mobile drawer */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 flex flex-col transition-transform duration-300 z-50 md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } bg-[#1F2937] border-r border-gray-800 text-gray-100`}
      >
        {/* Logo / Header */}
        <div className="p-6 flex items-center gap-3 border-b border-gray-800/85">
          <div className="w-10 h-10 bg-[#F4B400] rounded-xl flex items-center justify-center font-bold text-[#1F2937] text-xl shadow-lg shadow-[#F4B400]/10">
            S
          </div>
          <div>
            <h1 className="text-white font-black text-xl tracking-tight uppercase font-display leading-tight">
              Simpati
            </h1>
            <p className="text-[9px] text-[#F4B400] font-sans tracking-tight font-bold max-w-[150px] leading-tight">
              Sistem Monitoring Pegawai Terintegrasi
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-2.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-item-${item.id}`}
                onClick={() => handleMenuClick(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-r-lg transition-all duration-200 text-left cursor-pointer group relative ${
                  isActive
                    ? 'bg-[#F4B400]/10 border-l-4 border-[#F4B400] text-white font-bold'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border-l-4 border-transparent'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-105 ${isActive ? 'text-[#F4B400]' : 'text-gray-400 group-hover:text-amber-400'}`} />
                <span className="font-sans text-sm tracking-wide">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bento AI widget info block */}
        <div className="px-4 py-2">
          <div className="bg-white/10 rounded-2xl p-4 border border-white/5">
            <p className="text-xs text-[#F4B400] font-bold uppercase mb-1 tracking-wider">Simpati AI</p>
            <p className="text-white/70 text-xs leading-relaxed">
              Tanyakan apa saja tentang data ASN Anda.
            </p>
          </div>
        </div>

        {/* Footer / Theme Toggle */}
        <div className="p-4 border-t border-gray-800/80">
          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-800/50">
            <div className="flex items-center gap-2">
              {darkMode ? (
                <Moon className="w-4 h-4 text-amber-400" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
              <span className="text-xs font-semibold text-gray-300 font-sans">
                {darkMode ? 'Dark Mode' : 'Light Mode'}
              </span>
            </div>
            <button
              onClick={toggleDarkMode}
              className="w-10 h-6 flex items-center rounded-full p-0.5 cursor-pointer bg-gray-700 transition-colors duration-200"
              aria-label="Toggle dark mode"
            >
              <div
                className={`w-5 h-5 rounded-full bg-amber-500 shadow-md transform transition-transform duration-200 ${
                  darkMode ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="mt-4 flex items-center gap-2.5 px-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">
              Server: Online
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
