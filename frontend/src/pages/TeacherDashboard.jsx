import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  BookOpen, Clock, MapPin, Activity, Cpu, ShieldCheck, 
  Download, ListTodo, LayoutGrid, BellRing, X, CheckCircle, BrainCircuit,
  GraduationCap, Globe, Zap, BarChart3, Calendar, History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import API from '../services/api';
import { successToast, errorAlert } from '../services/alertService';

// --- 🛠️ GLOBAL CONSTANTS ---
const timeSlots = ["09:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00", "01:00 - 02:00", "02:00 - 03:00", "03:00 - 04:00"];
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const TeacherDashboard = () => {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [facultyData, setFacultyData] = useState(null);
  const [activeTab, setActiveTab] = useState('today'); 
  const [isZoomed, setIsZoomed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [reminder, setReminder] = useState(null); 
  const [lastNotifiedId, setLastNotifiedId] = useState(null);

  const facultyName = localStorage.getItem('userName') || 'Faculty Node';
  const currentDay = currentTime.toLocaleDateString('en-US', { weekday: 'long' });
  const currentMonthName = currentTime.toLocaleDateString('en-US', { month: 'long' });

  const getMinutes = (timeStr) => {
    if (!timeStr) return 0;
    let [h, m] = timeStr.trim().split(':').map(Number);
    if (h >= 1 && h <= 7) h += 12; 
    return h * 60 + m;
  };

  const fetchHubData = useCallback(async () => {
    try {
      setLoading(true);
      const [timeRes, userRes] = await Promise.all([
        API.get('/timetable'),
        API.get('/auth/users')
      ]);
      const myClasses = timeRes.data.filter(item => 
        item.facultyName === facultyName || item.faculty?.name === facultyName
      );
      setTimetable(myClasses);
      const profile = userRes.data.find(u => u.name === facultyName);
      setFacultyData(profile);
    } catch (err) {
      errorAlert("Connection Failed");
    } finally {
      setLoading(false);
    }
  }, [facultyName]);

  const stats = useMemo(() => {
    const today = timetable.filter(t => t.day === currentDay);
    const nowMin = currentTime.getHours() * 60 + currentTime.getMinutes();
    
    let current = null;
    let upcoming = [];
    today.forEach((cls) => {
      const parts = cls.timeSlot.split(' - ');
      if (nowMin >= getMinutes(parts[0]) && nowMin < getMinutes(parts[1])) current = cls;
      else if (nowMin < getMinutes(parts[0])) upcoming.push(cls);
    });

    const monthlyTarget = timetable.length * 4; 
    const dayOfMonth = currentTime.getDate();
    const conductanceRatio = Math.min(Math.round((dayOfMonth / 30) * 100), 100);
    const conducted = Math.round((monthlyTarget * conductanceRatio) / 100);

    return { 
      currentClass: current, 
      upcomingClasses: upcoming.sort((a, b) => getMinutes(a.timeSlot.split(' - ')[0]) - getMinutes(b.timeSlot.split(' - ')[0])),
      monthlyTarget,
      conducted,
      conductanceRatio
    };
  }, [timetable, currentDay, currentTime]);

  useEffect(() => { fetchHubData(); }, [fetchHubData]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      const nowTotalMin = now.getHours() * 60 + now.getMinutes();

      stats.upcomingClasses.forEach(cls => {
        const startMin = getMinutes(cls.timeSlot.split(' - ')[0]);
        if (startMin - nowTotalMin === 5 && lastNotifiedId !== cls._id) {
          setReminder(cls);
          setLastNotifiedId(cls._id);
          setTimeout(() => setReminder(null), 15000);
        }
      });
    }, 10000);
    return () => clearInterval(interval);
  }, [stats.upcomingClasses, lastNotifiedId]);

  // 🎯 FIXED: handleExport ID sync
  const handleExport = async () => {
    const element = document.getElementById('faculty-matrix-capture');
    if (!element) return;
    try {
      const canvas = await html2canvas(element, { 
        scale: 2, 
        backgroundColor: "#f8fafc",
        useCORS: true 
      });
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `Faculty_Matrix_${facultyName}.png`;
      link.click();
      successToast("Registry Exported!");
    } catch (err) { errorAlert("Fail", "Capture Error."); }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#f8fafc] gap-4">
        <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 font-['Outfit'] pr-4">Loading...</p>
    </div>
  );

  return (
    <div className="p-3 md:p-10 space-y-6 md:space-y-10 font-['Outfit'] min-h-screen bg-[#f8fafc] max-w-7xl mx-auto overflow-hidden transform-gpu">
      
      {/* 🔔 FLOATING REMINDER */}
      <AnimatePresence>
        {reminder && (
          <motion.div initial={{ opacity: 0, y: -100, x: '-50%' }} animate={{ opacity: 1, y: 20, x: '-50%' }} exit={{ opacity: 0, y: -100, x: '-50%' }} className="fixed top-0 left-1/2 z-[1000] w-[90%] max-w-md px-4 text-left">
            <div className="bg-[#020617] border-2 border-orange-500 rounded-3xl p-4 md:p-6 shadow-2xl flex items-center gap-4 text-white">
              <div className="bg-orange-600 p-2 md:p-3 rounded-2xl animate-bounce flex-shrink-0"><BellRing size={20}/></div>
              <div className="flex-1 overflow-hidden">
                <p className="text-[8px] md:text-[10px] font-black text-orange-500 uppercase tracking-widest leading-none mb-1 pr-2">Incoming Session (5m)</p>
                <h4 className="text-sm md:text-lg font-black uppercase italic leading-tight truncate pr-4">{reminder.subject}</h4>
                <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Batch {reminder.batch} • Room {reminder.room}</p>
              </div>
              <button onClick={() => setReminder(null)} className="p-1.5 hover:bg-white/10 rounded-full transition-colors flex-shrink-0"><X size={18}/></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-200 pb-6 md:pb-10 text-left">
        <div className="space-y-2 w-full md:w-auto">
            <div className="flex items-center gap-2 md:gap-3">
                <div className="bg-orange-600 p-1.5 rounded-lg text-white shadow-lg"><ShieldCheck size={16}/></div>
                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic pr-4">Department • {facultyData?.department}</span>
            </div>
            {/* Added pr-8 to fix Prof. Name clipping */}
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none pr-8">
              Prof. <span className="text-orange-600">{facultyName.split(' ')[0]}</span>
            </h1>
        </div>
        
        <div className="flex w-full md:w-auto bg-white p-1.5 rounded-2xl md:rounded-3xl shadow-xl border border-slate-100">
            <button onClick={() => setActiveTab('today')} className={`flex-1 md:flex-none px-4 md:px-10 py-3 md:py-4 rounded-xl md:rounded-2xl text-[8px] md:text-[10px] font-black uppercase italic transition-all flex items-center justify-center gap-2 pr-2 ${activeTab === 'today' ? 'bg-[#020617] text-white shadow-xl' : 'text-slate-500 hover:bg-slate-50'}`}><ListTodo size={14}/> Today</button>
            <button onClick={() => setActiveTab('matrix')} className={`flex-1 md:flex-none px-4 md:px-10 py-3 md:py-4 rounded-xl md:rounded-2xl text-[8px] md:text-[10px] font-black uppercase italic transition-all flex items-center justify-center gap-2 pr-2 ${activeTab === 'matrix' ? 'bg-[#020617] text-white shadow-xl' : 'text-slate-500 hover:bg-slate-50'}`}><LayoutGrid size={14}/> Weekly</button>
            <button onClick={() => setActiveTab('stats')} className={`flex-1 md:flex-none px-4 md:px-10 py-3 md:py-4 rounded-xl md:rounded-2xl text-[8px] md:text-[10px] font-black uppercase italic transition-all flex items-center justify-center gap-2 pr-2 ${activeTab === 'stats' ? 'bg-[#020617] text-white shadow-xl' : 'text-slate-500 hover:bg-slate-50'}`}><BarChart3 size={14}/> Stats</button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        
        {/* TAB 1: TODAY */}
        {activeTab === 'today' && (
          <motion.div key="today" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6 md:space-y-8 text-left">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Today', val: (stats.currentClass ? 1 : 0) + stats.upcomingClasses.length, icon: <Activity className="text-orange-600"/> },
                    { label: 'Weekly', val: `${timetable.length} Hrs`, icon: <Cpu className="text-blue-600"/> },
                    { label: 'Month', val: currentMonthName.slice(0,3), icon: <Calendar className="text-red-600"/> },
                    { label: 'Expertise', val: facultyData?.expertise?.[0] || 'Logic', icon: <GraduationCap className="text-emerald-600"/> }
                ].map((s, i) => (
                    <div key={i} className="bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-3 md:gap-4 hover:shadow-md transition-all">
                        <div className="bg-slate-50 p-2 md:p-3 rounded-xl flex-shrink-0">{s.icon}</div>
                        <div className="overflow-hidden"><p className="text-[7px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest pr-2">{s.label}</p><p className="text-xs md:text-sm font-black text-slate-800 italic mt-0.5 truncate pr-2">{s.val}</p></div>
                    </div>
                ))}
            </div>

            <div className={`p-8 md:p-12 rounded-[2.5rem] md:rounded-[4rem] border-2 transition-all flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden ${stats.currentClass ? 'bg-[#020617] border-orange-600 text-white' : 'bg-white border-slate-100'}`}>
                <div className="text-center md:text-left relative z-10 w-full">
                    <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                        <div className={`w-2 h-2 rounded-full ${stats.currentClass ? 'bg-red-500 animate-ping' : 'bg-slate-300'}`} />
                        <p className={`text-[10px] md:text-[11px] font-black uppercase tracking-[0.4em] pr-4 ${stats.currentClass ? 'text-orange-500' : 'text-slate-400'}`}>System Active</p>
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black uppercase italic leading-none tracking-tighter pr-6">{stats.currentClass ? stats.currentClass.subject : 'Class Starting Soon'}</h2>
                    {stats.currentClass && (
                      <div className="flex justify-center md:justify-start gap-4 md:gap-8 mt-6 text-slate-400 font-bold text-xs uppercase pr-4">
                        <span><Clock size={14} className="text-orange-600 inline mr-2"/> {stats.currentClass.timeSlot}</span>
                        <span><MapPin size={14} className="text-red-500 inline mr-2"/> Room {stats.currentClass.room}</span>
                        <span className="text-white italic pr-2"><Zap size={14} className="text-orange-500 inline mr-2"/> {stats.currentClass.batch}</span>
                      </div>
                    )}
                </div>
                {stats.currentClass && <div className="p-6 md:p-8 rounded-[2rem] bg-orange-600 text-white shadow-lg animate-pulse hidden md:block"><BrainCircuit size={40}/></div>}
            </div>

            <div className="space-y-4">
                {stats.upcomingClasses.map((cls, idx) => (
                    <div key={idx} className="p-6 md:p-8 bg-white border border-slate-100 rounded-[2.5rem] md:rounded-[3.5rem] shadow-sm hover:shadow-xl transition-all flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6 group">
                        <div className="flex items-center gap-5 md:gap-8 w-full md:w-auto">
                            <div className="bg-slate-900 text-orange-500 p-4 md:p-5 rounded-2xl md:rounded-3xl shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform"><BookOpen size={28}/></div>
                            <div className="flex-1 overflow-hidden">
                              <h4 className="text-lg md:text-2xl font-black text-slate-900 uppercase italic tracking-tighter truncate pr-6">{cls.subject}</h4>
                              <div className="flex gap-4 mt-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5 pr-1"><Clock size={14} className="text-orange-500"/> {cls.timeSlot}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5 pr-1"><MapPin size={14} className="text-red-500"/> Unit {cls.room}</span>
                              </div>
                            </div>
                        </div>
                        <div className="bg-slate-50 w-full md:w-auto px-6 py-2 rounded-xl border border-slate-100 text-center md:text-right">
                            <p className="text-[7px] md:text-[9px] font-black text-slate-400 uppercase mb-0.5 pr-2">Batch</p>
                            <p className="text-[10px] md:text-xs font-black text-slate-800 uppercase italic truncate pr-4">{cls.batch}</p>
                        </div>
                    </div>
                ))}
            </div>
          </motion.div>
        )}

        {/* TAB 2: WEEKLY MATRIX */}
        {activeTab === 'matrix' && (
          <motion.div key="matrix" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} id="faculty-matrix-capture" className="bg-white rounded-[2rem] md:rounded-[4rem] p-4 md:p-12 shadow-2xl border border-slate-100 flex flex-col overflow-hidden relative text-left">
             <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-slate-100 pb-8 gap-4">
                <div className="text-center md:text-left">
                  <h3 className="text-2xl md:text-4xl font-black uppercase italic tracking-tighter mb-1 pr-8">Weekly Classes</h3>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                {/* 🔍 Naya Zoom Toggle Button */}
                <button 
                    onClick={() => setIsZoomed(!isZoomed)} 
                    className={`flex-1 md:flex-none px-5 py-3 rounded-xl text-[10px] font-black uppercase italic transition-all flex items-center justify-center gap-2 shadow-lg ${isZoomed ? 'bg-red-600 text-white' : 'bg-white/10 text-slate-400'}`}
                >
                    {isZoomed ? 'Exit Zoom' : 'Zoom Matrix'}
                </button>

                <button onClick={handleExport} className="flex-1 md:flex-none bg-white/5 hover:bg-white text-slate-400 hover:text-black border border-white/10 px-5 py-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 shadow-2xl">
                    <Download size={18}/> DAWNLAOD
                </button>
            </div>
             </div>
             
             <div className={`w-full ${isZoomed ? 'overflow-x-auto overflow-y-hidden cursor-move' : 'overflow-hidden'}`}>
              <div className={`grid grid-cols-7 gap-1 md:gap-5 transition-all duration-500 ${isZoomed ? 'min-w-[1000px] py-10 scale-110' : 'w-full'}`}>
                    <div className="col-span-1 space-y-2 md:space-y-4 pt-10 md:pt-24 text-right pr-2 border-r border-slate-100">
                        {timeSlots.map(s => <div key={s} className="h-12 md:h-20 flex items-center justify-end text-[6px] md:text-[11px] font-black text-slate-400 uppercase italic tracking-tighter pr-2">{s.split(' - ')[0]}</div>)}
                    </div>
                    {days.map(day => (
                        <div key={day} className="col-span-1 space-y-2 md:space-y-4">
                            <h1 className={`text-[7px] md:text-xs font-black uppercase tracking-[0.1em] pb-4 md:pb-10 border-b border-slate-100 mb-4 md:mb-8 pr-2 ${day === currentDay ? 'text-orange-500 underline underline-offset-[10px] decoration-2' : 'text-slate-400'}`}>{day.slice(0, 3)}</h1>
                            {timeSlots.map((slot, i) => {
                                const s = timetable.find(t => t.day === day && t.timeSlot === slot);
                                const isLive = day === currentDay && stats.currentClass?.timeSlot === slot;
                                return (
                                    <div key={i} className={`h-12 md:h-20 rounded-md md:rounded-[2rem] border flex flex-col items-center justify-center p-0.5 md:p-4 transition-all duration-500 ${s ? (isLive ? 'bg-orange-600 border-white shadow-[0_0_20px_rgba(234,88,12,0.6)] z-20 scale-105 text-white' : 'bg-orange-50 border-orange-200 opacity-100') : 'bg-slate-50 border-transparent opacity-5'}`}>
                                        {s ? (<><p className={`text-[5px] md:text-[10px] font-black uppercase italic truncate w-full text-center leading-none pr-1 ${isLive ? 'text-white' : 'text-orange-600'}`}>{s.subject}</p><div className={`mt-0.5 md:mt-2 px-1 py-0 rounded-[2px] md:rounded text-[4px] md:text-[8px] font-black ${isLive ? 'bg-white text-orange-600' : 'bg-orange-600 text-white'}`}>{s.batch}</div></>) : <span className="text-[5px] opacity-10 italic pr-2">VOID</span>}
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

        {/* TAB 3: STATS */}
        {activeTab === 'stats' && (
          <motion.div key="stats" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-6 text-left">
            <div className="bg-white p-6 md:p-12 rounded-[2.5rem] md:rounded-[4rem] border border-slate-100 shadow-2xl">
                <div className="flex items-center gap-5 mb-10 border-l-4 border-orange-600 pl-6">
                   <BarChart3 className="text-orange-600" size={32}/>
                   <div>
                     <h3 className="text-2xl font-black uppercase italic text-slate-900 leading-none pr-8">Load Analytics</h3>
                     <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-widest pr-4">Monthly Conductance Hub • {currentMonthName}</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-8">
                        <div className="space-y-3">
                           <p className="text-[11px] font-black uppercase text-slate-500 tracking-widest flex justify-between pr-4">Work Efficiency <span>{stats.conductanceRatio}%</span></p>
                           <div className="relative h-4 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                               <motion.div initial={{ width: 0 }} animate={{ width: `${stats.conductanceRatio}%` }} className="absolute top-0 left-0 h-full bg-orange-600 shadow-lg" />
                           </div>
                        </div>
                        <div className="flex justify-between p-8 bg-[#020617] rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
                           <div className="text-center flex-1 border-r border-white/5">
                              <p className="text-[9px] font-black text-slate-500 uppercase pr-2">Monthly Target</p>
                              <p className="text-3xl font-black italic mt-1 pr-4">{stats.monthlyTarget}</p>
                           </div>
                           <div className="text-center flex-1">
                              <p className="text-[9px] font-black text-orange-500 uppercase pr-2">Actual Sessions</p>
                              <p className="text-3xl font-black italic mt-1 pr-4">{stats.conducted}</p>
                           </div>
                           <Zap className="absolute bottom-[-10%] right-[-10%] opacity-5" size={100}/>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-8 rounded-[3rem] border border-slate-100 relative group">
                        <p className="text-[11px] font-black uppercase text-slate-400 mb-6 flex items-center gap-2 pr-4"><Globe size={16} className="text-blue-500"/> Subject Expertise</p>
                        <div className="flex flex-wrap gap-2">
                           {facultyData?.expertise?.map((sub, i) => (
                             <span key={i} className="bg-white px-4 py-2 rounded-xl text-[10px] font-black uppercase border border-slate-200 text-slate-700 shadow-sm hover:border-orange-500 transition-all cursor-default pr-4 italic">{sub}</span>
                           ))}
                        </div>
                    </div>
                </div>

                <div className="mt-12 space-y-6">
                   <div className="flex items-center gap-4 opacity-40">
                     <p className="text-[11px] font-black uppercase italic flex items-center gap-2 pr-6"><History size={16}/> Class History</p>
                     <div className="flex-1 h-[1px] bg-slate-200" />
                   </div>
                   <div className="grid grid-cols-1 gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scroll">
                      {timetable.length === 0 ? <p className="py-10 text-center text-slate-300 font-black uppercase text-[10px] pr-4 italic">No activity found</p> : 
                        timetable.map((cls, i) => (
                         <div key={i} className="p-6 bg-white border border-slate-100 rounded-[2rem] flex flex-col md:flex-row justify-between items-center gap-4 hover:shadow-lg transition-all group">
                            <div className="flex items-center gap-6 text-left">
                                <div className="text-center bg-slate-50 p-2 rounded-xl border border-slate-200 min-w-[70px]"><p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter pr-1">{cls.day.slice(0,3)}</p></div>
                                <div className="text-left"><p className="text-lg font-black text-slate-900 uppercase italic leading-none pr-8">{cls.subject}</p><p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-widest flex items-center gap-2 pr-4"><MapPin size={10} className="text-red-500"/> Unit {cls.room} • <Zap size={10} className="text-orange-500"/> Batch {cls.batch}</p></div>
                            </div>
                            <div className="flex items-center gap-4"><CheckCircle size={18} className="text-emerald-500"/><span className="text-[10px] font-black text-emerald-600 uppercase pr-2">Done</span></div>
                         </div>
                        ))
                      }
                   </div>
                </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      <div className="pt-10 flex justify-center items-center gap-6 opacity-20 italic">
          <div className="flex items-center gap-2 text-slate-400"><ShieldCheck size={14} className="text-orange-600"/><p className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.5em] pr-6">Identity Secured • Neural Sync Active</p></div>
      </div>
    </div>
  );
};

export default TeacherDashboard;