import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  Clock, MapPin, Activity, Download, LayoutGrid, ListTodo, ShieldCheck, 
  GraduationCap, BellRing, X, CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import API from '../services/api';
import { successToast, errorAlert } from '../services/alertService';

// --- 🛠️ GLOBAL CONSTANTS ---
const timeSlots = ["09:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00", "01:00 - 02:00", "02:00 - 03:00", "03:00 - 04:00"];
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const StudentDashboard = () => {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('today'); 
  const [isZoomed, setIsZoomed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [reminder, setReminder] = useState(null); 
  const [lastNotifiedId, setLastNotifiedId] = useState(null);

  const userName = localStorage.getItem('userName') || 'Student';
  const userBatch = localStorage.getItem('userBatch') || 'D2421'; 
  const currentDay = currentTime.toLocaleDateString('en-US', { weekday: 'long' });

  const getMinutes = (timeStr) => {
    if (!timeStr) return 0;
    let [h, m] = timeStr.trim().split(':').map(Number);
    if (h >= 1 && h <= 7) h += 12; // PM Fix
    return h * 60 + m;
  };

  const fetchSchedule = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get('/timetable');
      const myBatchSchedule = res.data.filter(t => t.batch === userBatch);
      setTimetable(myBatchSchedule);
    } catch (err) { 
      errorAlert("Sync Fail", "Academic node unreachable.");
    } finally {
      setLoading(false);
    }
  }, [userBatch]);

  const { currentClass, upcomingClasses } = useMemo(() => {
    const today = timetable.filter(t => t.day === currentDay);
    const nowH = currentTime.getHours();
    const nowM = currentTime.getMinutes();
    const nowTotalMin = nowH * 60 + nowM;
    
    let current = null;
    let upcoming = [];

    today.forEach((cls) => {
      const parts = cls.timeSlot.split(' - ');
      const startMin = getMinutes(parts[0]);
      const endMin = getMinutes(parts[1]);

      if (nowTotalMin >= startMin && nowTotalMin < endMin) {
        current = cls;
      }
      else if (nowTotalMin < startMin) {
        upcoming.push(cls);
      }
    });

    return { 
      currentClass: current, 
      upcomingClasses: upcoming.sort((a, b) => getMinutes(a.timeSlot.split(' - ')[0]) - getMinutes(b.timeSlot.split(' - ')[0])) 
    };
  }, [timetable, currentDay, currentTime]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  useEffect(() => {
    // 🚀 Performance Fix: Clock updates every 1 min to prevent lag
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      const nowTotalMin = now.getHours() * 60 + now.getMinutes();

      upcomingClasses.forEach(cls => {
        const startTimeStr = cls.timeSlot.split(' - ')[0]; 
        const startMin = getMinutes(startTimeStr);
        const timeDiff = startMin - nowTotalMin;

        if (timeDiff === 5 && lastNotifiedId !== cls._id) {
          setReminder(cls);
          setLastNotifiedId(cls._id);
          setTimeout(() => setReminder(null), 15000);
        }
      });
    }, 60000); 
    return () => clearInterval(interval);
  }, [upcomingClasses, lastNotifiedId]);

  // 🎯 FIXED: handleExport ID and Options
  const handleExport = async () => {
    const element = document.getElementById('weekly-Timetable-capture');
    if (!element) return;
    try {
      const canvas = await html2canvas(element, { 
        scale: 2, 
        backgroundColor: "#020617",
        logging: false,
        useCORS: true
      });
      const link = document.createElement('a');
      link.download = `Timetable_${userBatch}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      successToast("Timetable Dawnloaded!");
    } catch (err) { errorAlert("Fail", "Capture Error."); }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#f8fafc] gap-4">
        <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 font-['Outfit'] pr-4">Syncing Timetable...</p>
    </div>
  );

  return (
    <div className="p-3 md:p-10 space-y-6 md:space-y-10 font-['Outfit'] min-h-screen bg-[#f8fafc] max-w-7xl mx-auto overflow-hidden transform-gpu">
      
      {/* 🔔 FLOATING NOTIFICATION */}
      <AnimatePresence>
        {reminder && (
          <motion.div initial={{ opacity: 0, y: -100, x: '-50%' }} animate={{ opacity: 1, y: 20, x: '-50%' }} transition={{ type: "spring", stiffness: 200, damping: 20 }} exit={{ opacity: 0, y: -100, x: '-50%' }} className="fixed top-0 left-1/2 z-[1000] w-[90%] max-w-md px-4">
            <div className="bg-[#020617] border-2 border-orange-500 rounded-3xl p-4 md:p-6 shadow-2xl flex items-center gap-4 text-white">
              <div className="bg-orange-600 p-2 md:p-3 rounded-2xl animate-bounce flex-shrink-0"><BellRing size={20}/></div>
              <div className="flex-1 text-left overflow-hidden">
                <p className="text-[8px] md:text-[10px] font-black text-orange-500 uppercase tracking-widest leading-none mb-1 pr-2">Incoming Session (5m)</p>
                <h4 className="text-sm md:text-lg font-black uppercase italic leading-tight truncate pr-4">{reminder.subject}</h4>
                <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Room {reminder.room} • {reminder.timeSlot.split(' - ')[0]}</p>
              </div>
              <button onClick={() => setReminder(null)} className="p-1.5 hover:bg-white/10 rounded-full transition-colors flex-shrink-0"><X size={18}/></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-slate-200 pb-6 md:pb-10">
        <div className="text-left space-y-2 w-full md:w-auto">
            <div className="flex items-center gap-3">
                <div className="bg-orange-600 p-1.5 rounded-lg text-white shadow-lg"><ShieldCheck size={18}/></div>
                <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic truncate pr-4">Academic Batch • {userBatch}</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none pr-8">
              Hello, <span className="text-orange-600">{userName.split(' ')[0]}</span>
            </h1>
        </div>
        
        <div className="flex w-full md:w-auto bg-white p-1.5 rounded-2xl md:rounded-3xl shadow-xl border border-slate-100">
            <button onClick={() => setActiveTab('today')} className={`flex-1 md:flex-none px-6 md:px-10 py-3 md:py-4 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase italic transition-all flex items-center justify-center gap-2 pr-4 ${activeTab === 'today' ? 'bg-[#020617] text-white shadow-xl' : 'text-slate-500 hover:bg-slate-50'}`}><ListTodo size={16}/> Today</button>
            <button onClick={() => setActiveTab('weekly')} className={`flex-1 md:flex-none px-6 md:px-10 py-3 md:py-4 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase italic transition-all flex items-center justify-center gap-2 pr-4 ${activeTab === 'weekly' ? 'bg-[#020617] text-white shadow-xl' : 'text-slate-500 hover:bg-slate-50'}`}><LayoutGrid size={16}/> Weekly</button>
        </div>
      </div>

      {/* --- LIVE STATUS ROW --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className={`p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border-2 transition-all flex items-center justify-between shadow-sm ${currentClass ? 'bg-[#020617] border-orange-600 text-white' : 'bg-white border-slate-100 opacity-60'}`}>
              <div className="text-left overflow-hidden">
                  <p className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest mb-2 ${currentClass ? 'text-orange-500' : 'text-slate-400'}`}>Live Class</p>
                  {currentClass ? (
                      <h2 className="text-xl md:text-3xl font-black uppercase italic leading-none tracking-tighter truncate pr-6">{currentClass.subject}</h2>
                  ) : <h2 className="text-xl md:text-3xl font-black uppercase italic text-slate-300 pr-6">Waiting for Class</h2>}
              </div>
              {currentClass && <div className="bg-orange-600 p-3 md:p-4 rounded-2xl animate-pulse flex-shrink-0 ml-2"><Activity size={24} className="text-white"/></div>}
          </div>

          <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-slate-100 shadow-sm flex items-center justify-between text-left group hover:border-orange-500 transition-all">
              <div className="overflow-hidden">
                  <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic pr-4">Upcoming Class</p>
                  {upcomingClasses.length > 0 ? (
                      <h2 className="text-xl md:text-3xl font-black uppercase italic text-slate-800 leading-none tracking-tighter truncate pr-6">{upcomingClasses[0].subject}</h2>
                  ) : <h2 className="text-xl md:text-3xl font-black uppercase italic text-slate-200 pr-6">Cycle End</h2>}
              </div>
              {upcomingClasses.length > 0 && <div className="bg-slate-50 p-3 md:p-4 rounded-2xl text-slate-300 group-hover:text-orange-500 transition-colors flex-shrink-0 ml-2"><Clock size={24}/></div>}
          </div>
      </div>

      {/* --- CONTENT HUB --- */}
      <AnimatePresence mode="wait">
        {activeTab === 'today' ? (
          <motion.div key="pipeline" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
             <div className="flex items-center gap-4 px-4 md:px-6 opacity-40 mb-4 md:mb-6">
                <p className="text-[9px] md:text-[10px] font-black uppercase italic pr-4">{currentDay} Class</p>
                <div className="flex-1 h-[1px] bg-slate-200" />
             </div>

             {upcomingClasses.length === 0 && !currentClass ? (
                <div className="py-24 md:py-40 bg-white rounded-[3rem] md:rounded-[4rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center gap-4 opacity-30 text-slate-400 text-center">
                    <CheckCircle size={50} className="text-emerald-500"/><p className="text-xs md:text-sm font-black uppercase tracking-[0.4em] pr-4">All Sessions Decoded • Cycle Complete</p>
                </div>
             ) : (
                <div className="space-y-3 md:space-y-4">
                    {currentClass && (
                        <div className="p-6 md:p-8 rounded-[2.5rem] md:rounded-[3.5rem] border-2 border-orange-600 bg-white shadow-2xl flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6 text-left">
                            <div className="flex items-center gap-5 md:gap-8 w-full md:w-auto">
                                <div className="bg-orange-600 text-white p-4 md:p-5 rounded-2xl md:rounded-3xl shadow-lg flex-shrink-0"><GraduationCap size={28}/></div>
                                <div className="flex-1 overflow-hidden">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h4 className="text-xl md:text-2xl font-black text-slate-900 uppercase italic tracking-tighter truncate leading-tight pr-6">{currentClass.subject}</h4>
                                        <span className="bg-orange-600 text-white text-[7px] md:text-[9px] font-black px-2 py-0.5 rounded-full uppercase animate-pulse flex-shrink-0">Live</span>
                                    </div>
                                    <div className="flex gap-4">
                                        <span className="text-[9px] md:text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5"><Clock size={14} className="text-orange-500"/> {currentClass.timeSlot}</span>
                                        <span className="text-[9px] md:text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5"><MapPin size={14} className="text-red-500"/> Room {currentClass.room}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-slate-50 w-full md:w-auto px-6 py-2 rounded-xl border border-slate-100 text-center md:text-right">
                                <p className="text-[7px] md:text-[9px] font-black text-slate-400 uppercase mb-0.5 pr-2">Prof.</p>
                                <p className="text-[10px] md:text-xs font-black text-slate-800 uppercase italic truncate pr-4">{currentClass.faculty?.name || 'Academic Expert'}</p>
                            </div>
                        </div>
                    )}
                    {upcomingClasses.map((cls, idx) => (
                        <div key={idx} className="p-6 md:p-8 bg-white border border-slate-100 rounded-[2.5rem] md:rounded-[3.5rem] shadow-sm hover:shadow-xl transition-all flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6 group text-left">
                            <div className="flex items-center gap-5 md:gap-8 w-full md:w-auto">
                                <div className="bg-slate-900 text-orange-500 p-4 md:p-5 rounded-2xl md:rounded-3xl shadow-lg group-hover:scale-110 transition-transform flex-shrink-0"><GraduationCap size={28}/></div>
                                <div className="flex-1 overflow-hidden">
                                    <h4 className="text-xl md:text-2xl font-black text-slate-900 uppercase italic tracking-tighter truncate leading-tight group-hover:text-orange-600 transition-colors pr-6">{cls.subject}</h4>
                                    <div className="flex gap-4 mt-1">
                                        <span className="text-[9px] md:text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5"><Clock size={14} className="text-orange-500"/> {cls.timeSlot}</span>
                                        <span className="text-[9px] md:text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5"><MapPin size={14} className="text-red-500"/> Unit {cls.room}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-slate-50 w-full md:w-auto px-6 py-2 rounded-xl border border-slate-100 text-center md:text-right">
                                <p className="text-[7px] md:text-[9px] font-black text-slate-400 uppercase mb-0.5 pr-2">Prof.</p>
                                <p className="text-[10px] md:text-xs font-black text-slate-800 uppercase italic truncate pr-4">{cls.faculty?.name || 'Academic Expert'}</p>
                            </div>
                        </div>
                    ))}
                </div>
             )}
          </motion.div>
        ) : (
          /* --- WEEKLY MATRIX --- */
          <motion.div key="matrix" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} id="weekly-Timetable-capture" className="bg-[#020617] rounded-[2rem] md:rounded-[4rem] p-4 md:p-12 shadow-2xl border border-white/5 flex flex-col overflow-hidden text-white relative">
             <div className="flex flex-col md:flex-row justify-between items-center mb-8 md:mb-12 border-b border-white/5 pb-8 relative z-10 gap-4">
                <div className="text-center md:text-left">
                    <h3 className="text-2xl md:text-4xl font-black uppercase italic tracking-tighter mb-1 leading-none pr-8 text-white">WEEKLY TIMETABLE</h3>
                </div>
                <button onClick={handleExport} className="w-full md:w-auto bg-white/5 hover:bg-white text-slate-400 hover:text-black border border-white/10 px-6 md:px-10 py-3 md:py-5 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase transition-all italic flex items-center justify-center gap-4 shadow-2xl group pr-4">
                    <Download size={18}/> DAWNLAOD
                </button>
             </div>
             
             <div className="w-full overflow-hidden">
                <div className="grid grid-cols-7 gap-1 md:gap-5 w-full">
                    <div className="col-span-1 space-y-2 md:space-y-4 pt-12 md:pt-24 text-right pr-2 border-r border-white/5">
                        {timeSlots.map(s => <div key={s} className="h-12 md:h-20 flex items-center justify-end text-[6px] md:text-[11px] font-black text-slate-600 uppercase italic tracking-tighter pr-4">{s.split(' - ')[0]}</div>)}
                    </div>
                    {days.map(day => (
                        <div key={day} className="col-span-1 space-y-2 md:space-y-4 text-center">
                            <h1 className={`text-[7px] md:text-xs font-black uppercase tracking-[0.1em] pb-4 md:pb-10 border-b border-white/5 mb-4 md:mb-8 pr-4 ${day === currentDay ? 'text-orange-500 underline underline-offset-[10px] decoration-2' : 'text-slate-50'}`}>{day.slice(0, 3)}</h1>
                            {timeSlots.map((slot, i) => {
                                const session = timetable.find(t => t.day === day && t.timeSlot === slot);
                                const isCurrentSlot = day === currentDay && currentClass?.timeSlot === slot;
                                return (
                                    <div key={i} className={`h-12 md:h-20 rounded-md md:rounded-[2rem] border flex flex-col items-center justify-center p-0.5 md:p-4 transition-all duration-500 ${session ? (isCurrentSlot ? 'bg-orange-600 border-white shadow-[0_0_20px_rgba(234,88,12,0.6)] z-20 scale-105' : 'bg-orange-600/10 border-orange-500/30 opacity-100') : 'bg-white/5 border-transparent opacity-5'}`}>
                                        {session ? (
                                            <>
                                                <p className={`text-[5px] md:text-[10px] font-black uppercase italic truncate w-full text-center leading-none pr-2 ${isCurrentSlot ? 'text-white' : 'text-orange-500'}`}>{session.subject}</p>
                                                <div className={`mt-0.5 md:mt-2 px-1 py-0 rounded-[2px] md:rounded text-[4px] md:text-[8px] font-black ${isCurrentSlot ? 'bg-white text-orange-600' : 'bg-orange-600 text-white'}`}>R-{session.room}</div>
                                            </>
                                        ) : <span className="text-[5px] opacity-10 italic pr-4">VOID</span>}
                                    </div>
                                )
                            })}
                        </div>
                    ))}
                </div>
             </div>
             <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-orange-600/5 blur-[120px] rounded-full" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pt-10 pb-6 flex justify-center items-center gap-6 opacity-20 italic">
          <div className="flex items-center gap-2"><ShieldCheck size={14} className="text-orange-600"/><p className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.5em] pr-4">Identity Secured</p></div>
      </div>
    </div>
  );
};

export default StudentDashboard;