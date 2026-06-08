/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { Employee } from '../types';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Coins, 
  Award, 
  Gift, 
  FileX, 
  UserPlus,
  Compass
} from 'lucide-react';

interface CalendarTabProps {
  employees: Employee[];
  onSelectEmployee: (emp: Employee) => void;
  setCurrentTab: (tab: string) => void;
  darkMode: boolean;
}

export default function CalendarTab({
  employees,
  onSelectEmployee,
  setCurrentTab,
  darkMode
}: CalendarTabProps) {
  // Setup primary state for selected month/year: Defaults to June 2026 (matching our localized context!)
  const [currentDate, setCurrentDate] = useState<Date>(new Date('2026-06-04'));
  const [viewMode, setViewMode] = useState<'agenda' | 'grid'>('agenda'); // DEFAULT to agenda as requested!

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-indexed

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const daysOfWeek = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  // Navigate Months
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  // Build Month calculations
  const monthDaysAndOffset = useMemo(() => {
    // Determine first day of selected month
    const firstDay = new Date(currentYear, currentMonth, 1);
    const startOffset = firstDay.getDay(); // 0 is Sunday, 1 is Monday ...

    // Determine total days in month
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();

    return { startOffset, totalDays };
  }, [currentYear, currentMonth]);

  // Aggregate events for the active month
  const activeMonthEventsByDay = useMemo(() => {
    const events: { 
      [day: number]: { 
        type: 'KGB' | 'PANGKAT' | 'PENSIUN';
        label: string;
        employee: Employee;
        color: string;
      }[] 
    } = {};

    employees.forEach(emp => {
      // 1. KGB YAD: matching month & year
      const kgbDate = new Date(emp.kgbYAD);
      if (kgbDate.getFullYear() === currentYear && kgbDate.getMonth() === currentMonth) {
        const d = kgbDate.getDate();
        if (!events[d]) events[d] = [];
        events[d].push({
          type: 'KGB',
          label: `KGB Berkala: ${emp.nama}`,
          employee: emp,
          color: 'bg-amber-500/15 border-amber-500 text-amber-500 dark:text-amber-400'
        });
      }

      // 2. Kenaikan Pangkat YAD: matching month & year
      const kpDate = new Date(emp.pangkatYAD);
      if (kpDate.getFullYear() === currentYear && kpDate.getMonth() === currentMonth) {
        const d = kpDate.getDate();
        if (!events[d]) events[d] = [];
        events[d].push({
          type: 'PANGKAT',
          label: `Kenaikan Pangkat: ${emp.nama}`,
          employee: emp,
          color: 'bg-indigo-500/15 border-indigo-500 text-indigo-500 dark:text-indigo-400'
        });
      }

      // 3. Batas Usia Pensiun (TMT Pensiun): matching month & year
      if (emp.pensiunTMT) {
        const pensDate = new Date(emp.pensiunTMT);
        if (pensDate.getFullYear() === currentYear && pensDate.getMonth() === currentMonth) {
          const d = pensDate.getDate();
          if (!events[d]) events[d] = [];
          events[d].push({
            type: 'PENSIUN',
            label: `BOP Pensiun: ${emp.nama}`,
            employee: emp,
            color: 'bg-rose-500/15 border-rose-500 text-rose-500 dark:text-rose-400'
          });
        }
      }
    });

    return events;
  }, [employees, currentMonth, currentYear]);

  // Extract employees reaching Batas Usia Pensiun soon (in 2026 or 2027) for ASN Notifications
  const retiringEmployees = useMemo(() => {
    return employees
      .filter(emp => {
        if (!emp.pensiunTMT) return false;
        const pYear = new Date(emp.pensiunTMT).getFullYear();
        return pYear === 2026 || pYear === 2027; // Reaching retirement within our baseline years
      })
      .sort((a, b) => new Date(a.pensiunTMT).getTime() - new Date(b.pensiunTMT).getTime());
  }, [employees]);

  // Construct only days in the chosen month that have events to fulfill the event-only request
  const activeMonthDaysWithEvents = useMemo(() => {
    const list: { day: number; events: any[] }[] = [];
    const { totalDays } = monthDaysAndOffset;
    for (let d = 1; d <= totalDays; d++) {
      if (activeMonthEventsByDay[d] && activeMonthEventsByDay[d].length > 0) {
        list.push({
          day: d,
          events: activeMonthEventsByDay[d]
        });
      }
    }
    return list;
  }, [activeMonthEventsByDay, monthDaysAndOffset]);

  // Construct Day cells list for grid fallback
  const calendarCells = useMemo(() => {
    const { startOffset, totalDays } = monthDaysAndOffset;
    const cells: { day: number | null; key: string }[] = [];

    // Push preceding empty spacer slots
    for (let i = 0; i < startOffset; i++) {
      cells.push({ day: null, key: `space-${i}` });
    }

    // Push active day grid indices
    for (let d = 1; d <= totalDays; d++) {
      cells.push({ day: d, key: `day-${d}` });
    }

    return cells;
  }, [monthDaysAndOffset]);

  const handleDayEventClick = (emp: Employee) => {
    onSelectEmployee(emp);
    setCurrentTab('pegawai');
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* Calendar Header Control Bar & View Switcher */}
      <div className={`p-4 md:p-5 rounded-[20px] border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 ${
        darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-150 shadow-sm shadow-gray-100/50'
      }`}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#F4B400]/15 text-[#F4B400] rounded-xl shrink-0">
            <Calendar className="w-5.5 h-5.5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base md:text-lg tracking-wide font-display text-slate-800 dark:text-white">
              {monthNames[currentMonth]} {currentYear}
            </h3>
            <p className="text-xs text-gray-400 font-sans">Kalender agenda ASN terkonsolidasi otomatis</p>
          </div>
        </div>

        {/* Dynamic Controls / View Mode Toggles */}
        <div className="flex flex-wrap items-center gap-3">
          <div className={`p-1 rounded-xl flex items-center gap-1 border shrink-0 ${
            darkMode ? 'bg-gray-950 border-gray-800' : 'bg-gray-100 border-gray-200'
          }`}>
            <button
              onClick={() => setViewMode('agenda')}
              className={`p-1.5 px-3.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                viewMode === 'agenda'
                  ? (darkMode ? 'bg-gray-850 text-amber-400 shadow shadow-amber-500/10' : 'bg-white text-slate-850 shadow-sm')
                  : 'text-gray-400 dark:text-gray-500 hover:text-slate-800 dark:hover:text-gray-300'
              }`}
            >
              Agenda Hari Aktif
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 px-3.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? (darkMode ? 'bg-gray-850 text-amber-400 shadow shadow-amber-500/10' : 'bg-white text-slate-850 shadow-sm')
                  : 'text-gray-400 dark:text-gray-500 hover:text-slate-800 dark:hover:text-gray-300'
              }`}
            >
              Grid Kalender
            </button>
          </div>

          <div className="hidden sm:block h-6 w-[1.5px] bg-gray-200 dark:bg-gray-800" />

          {/* Month controllers */}
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevMonth}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                darkMode ? 'border-gray-700 hover:bg-gray-800 text-gray-200' : 'border-gray-200 hover:bg-gray-100 text-slate-800'
              }`}
              title="Bulan Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date('2026-06-04'))}
              className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                darkMode ? 'border-gray-700 hover:bg-gray-800 text-gray-200' : 'border-gray-220 hover:bg-gray-100 text-slate-750'
              }`}
            >
              Bulan Ini
            </button>
            <button
              onClick={handleNextMonth}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                darkMode ? 'border-gray-700 hover:bg-gray-800 text-gray-200' : 'border-gray-200 hover:bg-gray-100 text-slate-800'
              }`}
              title="Bulan Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Batas Usia Pensiun (BUP) ASN Notification Bar */}
      <div className={`p-5 rounded-[20px] border transition-all duration-300 ${
        darkMode ? 'bg-red-500/5 border-red-950/40' : 'bg-rose-50/20 border-rose-100'
      }`}>
        <div className="flex items-start md:items-center gap-3 mb-3">
          <div className="p-2 bg-rose-500/10 text-rose-500 rounded-xl shrink-0">
            <Gift className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm font-display tracking-tight text-rose-600 dark:text-rose-400">
              Notifikasi Batas Usia Pensiun (BUP) ASN
            </h4>
            <p className="text-[11px] text-gray-400 dark:text-gray-400 leading-relaxed font-sans mt-0.5">
              Daftar otomatis pegawai yang mendekati Batas Usia Pensiun tahun ini (2026/2027) untuk mempersiapkan kesiapan administratif.
            </p>
          </div>
        </div>

        {retiringEmployees.length === 0 ? (
          <div className="text-xs text-slate-400 text-center py-3">Tidak ada pegawai yang memasuki masa pensiun dalam waktu dekat.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-2">
            {retiringEmployees.slice(0, 3).map(emp => {
              const pensDate = new Date(emp.pensiunTMT);
              const formattedPens = pensDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
              return (
                <div 
                  key={emp.id}
                  onClick={() => handleDayEventClick(emp)}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-2.5 cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:-translate-y-0.5 active:scale-95 ${
                    darkMode ? 'bg-gray-850 hover:bg-gray-800 border-gray-800 hover:border-rose-950' : 'bg-white hover:bg-rose-50/10 border-gray-150 hover:border-rose-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img 
                      src={emp.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop'}
                      alt={emp.nama}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-xl object-cover shrink-0 border border-gray-200 dark:border-gray-800"
                    />
                    <div className="min-w-0">
                      <div className="font-extrabold text-xs text-slate-800 dark:text-white truncate">{emp.nama}</div>
                      <div className="text-[10px] text-gray-400 truncate mt-0.5">{emp.jabatan}</div>
                      <span className="text-[9px] font-bold font-sans text-rose-500 block mt-0.5">TMT: {formattedPens}</span>
                    </div>
                  </div>
                  <span className={`p-1 px-2 rounded-lg text-[8px] font-black uppercase text-center tracking-wider shrink-0 ${
                    darkMode ? 'bg-rose-950/40 text-rose-400' : 'bg-rose-50 text-rose-600'
                  }`}>
                    Pensiun
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Legends info panel */}
      <div className={`p-4 rounded-[20px] border flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold ${
        darkMode ? 'bg-gray-900 border-gray-800 text-gray-400' : 'bg-gray-50 border-gray-150 text-slate-500'
      }`}>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-amber-500/20 border border-amber-500 shrink-0" />
          Kenaikan Gaji Berkala (KGB)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-indigo-500/20 border border-indigo-500 shrink-0" />
          Kenaikan Pangkat (KP)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-rose-500/20 border border-rose-500 shrink-0" />
          Batas Usia Pensiun (TMT Pensiun)
        </span>
      </div>

      {/* Calendar Switch View Logic */}
      {viewMode === 'agenda' ? (
        <div className="space-y-4">
          {activeMonthDaysWithEvents.length === 0 ? (
            <div className={`p-10 rounded-[20px] border text-center font-sans ${
              darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-150'
            }`}>
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                <Calendar className="w-5 h-5 mx-auto text-[#F4B400]" />
              </div>
              <h4 className="text-sm font-bold text-slate-700 dark:text-gray-300">Tidak Ada Agenda Aktif</h4>
              <p className="text-xs text-gray-450 dark:text-gray-450 mt-1 max-w-md mx-auto leading-relaxed">
                Tidak ada agenda Kenaikan Gaji Berkala (KGB), Kenaikan Pangkat (KP), atau TMT Pensiun terjadwal pada bulan {monthNames[currentMonth]} {currentYear}.
              </p>
            </div>
          ) : (
            <div className="relative pl-6 border-l-2 border-gray-200 dark:border-gray-800 space-y-6">
              {activeMonthDaysWithEvents.map(({ day, events }) => {
                const isToday = day === 4 && currentMonth === 5 && currentYear === 2026;
                const formattedDate = new Date(currentYear, currentMonth, day).toLocaleDateString('id-ID', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                });

                return (
                  <div key={day} className="relative group">
                    {/* Bullet marker on timeline step */}
                    <span className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 transition-transform duration-100 group-hover:scale-110 ${
                      isToday 
                        ? 'bg-[#F4B400] border-[#F4B400] ring-4 ring-[#F4B400]/20' 
                        : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700'
                    }`} />

                    {/* Timeline Header Date */}
                    <div className="mb-3.5 flex flex-wrap items-center gap-2">
                      <h4 className={`font-extrabold text-sm tracking-tight font-display ${
                        isToday ? 'text-amber-500' : 'text-slate-800 dark:text-white'
                      }`}>
                        {formattedDate}
                      </h4>
                      {isToday && (
                        <span className="p-1 px-2.5 text-[8.5px] font-black uppercase tracking-wider leading-none rounded-lg bg-[#F4B400] text-slate-950">
                          Hari Ini
                        </span>
                      )}
                    </div>

                    {/* Events list for specific date step */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {events.map((evt: any, idx: number) => (
                        <div
                          key={idx}
                          onClick={() => handleDayEventClick(evt.employee)}
                          className={`p-4 rounded-xl border flex items-start gap-3.5 cursor-pointer group transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 ${
                            evt.type === 'KGB'
                              ? 'bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/20 dark:border-amber-500/30 font-sans'
                              : evt.type === 'PANGKAT'
                              ? 'bg-indigo-500/5 hover:bg-indigo-500/10 border-indigo-500/20 dark:border-indigo-500/30'
                              : 'bg-rose-500/5 hover:bg-rose-500/10 border-rose-500/20 dark:border-rose-500/30'
                          }`}
                        >
                          <div className={`p-2.5 rounded-lg shrink-0 mt-0.5 ${
                            evt.type === 'KGB'
                              ? 'bg-amber-500/10 text-amber-500'
                              : evt.type === 'PANGKAT'
                              ? 'bg-indigo-500/10 text-indigo-500'
                              : 'bg-rose-500/10 text-rose-500'
                          }`}>
                            {evt.type === 'KGB' ? (
                              <Coins className="w-4 h-4" />
                            ) : evt.type === 'PANGKAT' ? (
                              <Award className="w-4 h-4" />
                            ) : (
                              <Gift className="w-4 h-4" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-550 block mb-1">
                              {evt.type === 'KGB' ? 'Kenaikan Gaji Berkala' : evt.type === 'PANGKAT' ? 'Kenaikan Pangkat' : 'TMT Pensiun ASN'}
                            </span>
                            <h5 className="font-extrabold text-xs text-slate-800 dark:text-white truncate">
                              {evt.employee.nama}
                            </h5>
                            <p className="text-[10.5px] text-gray-450 truncate mt-0.5">
                              {evt.employee.jabatan}
                            </p>
                            <p className="text-[10px] font-mono font-medium text-gray-400 dark:text-gray-500 mt-1">
                              NIP/NRP: {evt.employee.nip}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Original Calendar Grid */
        <div className={`rounded-[20px] border shadow-sm overflow-hidden transition-all duration-300 ${
          darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-150'
        }`}>
          
          {/* Days of Week Header Sizing */}
          <div className="grid grid-cols-7 border-b border-gray-200 dark:divide-gray-800 divide-x divide-gray-200 dark:border-gray-800">
            {daysOfWeek.map((day, i) => (
              <div 
                key={day} 
                className={`py-3 text-center text-xs font-bold tracking-wider uppercase bg-gray-50 dark:bg-gray-850 ${
                  i === 0 ? 'text-rose-500' : 'text-gray-450'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Date box grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-gray-200 dark:divide-gray-800 border-t-0 border-l-0">
            {calendarCells.map((cell, index) => {
              const dayEvents = cell.day !== null ? (activeMonthEventsByDay[cell.day] || []) : [];
              const isToday = cell.day === 4 && currentMonth === 5 && currentYear === 2026; // June 4 2026 is today!

              return (
                <div 
                  key={cell.key}
                  className={`min-h-[100px] md:min-h-[120px] p-2 flex flex-col relative ${
                    cell.day === null 
                      ? 'bg-gray-50/40 dark:bg-gray-900/30' 
                      : isToday 
                      ? 'bg-[#F4B400]/10' 
                      : 'bg-white dark:bg-gray-900'
                  }`}
                >
                  {/* Day stamp index */}
                  {cell.day !== null && (
                    <span className={`text-xs font-bold font-mono tracking-tight shrink-0 self-start p-1.5 leading-none rounded-lg ${
                      isToday 
                        ? 'bg-[#F4B400] text-slate-950 shadow-md shadow-[#F4B400]/15 scale-110' 
                        : index % 7 === 0 
                        ? 'text-rose-500' 
                        : 'text-gray-400 dark:text-gray-200'
                    }`}>
                      {cell.day}
                      {isToday && <span className="ml-1 text-[8px] font-sans font-black uppercase tracking-tight">HARI INI</span>}
                    </span>
                  )}

                  {/* Sub event records rendering */}
                  {cell.day !== null && dayEvents.length > 0 && (
                    <div className="flex-1 mt-2.5 space-y-1.5 overflow-y-auto max-h-[85px] no-scrollbar">
                      {dayEvents.map((evt, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleDayEventClick(evt.employee)}
                          title={evt.label}
                          className={`p-1 px-1.5 text-[10px] rounded font-bold font-sans tracking-wide leading-snug border truncate text-ellipsis cursor-pointer transition-transform duration-150 hover:scale-[1.02] active:scale-95 ${evt.color}`}
                        >
                          {evt.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}

