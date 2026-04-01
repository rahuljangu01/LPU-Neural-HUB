import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  BookOpen, Clock, MapPin, Activity, Cpu, 
  Download, ListTodo, LayoutGrid, BellRing, X, CheckCircle, BrainCircuit,
  GraduationCap, Globe, BarChart3, Calendar, History, User, Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import API from '../services/api';
import { successToast, errorAlert } from '../services/alertService';
import ZoomableTimetable from '../components/ZoomableTimetable';

const timeSlots = [
  "09:00 - 10:00", 
  "10:00 - 11:00", 
  "11:00 - 12:00", 
  "12:00 - 01:00",  // Lunch Break
  "01:00 - 02:00", 
  "02:00 - 03:00", 
  "03:00 - 04:00", 
  "04:00 - 05:00"
];
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const TeacherDashboard = () => {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [facultyData, setFacultyData] = useState(null);
  const [activeTab, setActiveTab] = useState('today'); 
  const [currentTime, setCurrentTime] = useState(new Date());
  const [reminder, setReminder] = useState(null); 
  const [lastNotifiedId, setLastNotifiedId] = useState(null);

  const facultyName = localStorage.getItem('userName') || 'Faculty';
  const facultyUid = localStorage.getItem('userUid') || '';
  const currentDay = currentTime.toLocaleDateString('en-US', { weekday: 'long' });
  const currentMonthName = currentTime.toLocaleDateString('en-US', { month: 'long' });

  const getMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const match = timeStr.match(/(\d{1,2}):(\d{2})/);
    if (!match) return 0;
    let h = parseInt(match[1]);
    let m = parseInt(match[2]);
    // 12:00 PM is noon (no adjustment), 01:00-07:00 is morning so add 12 for PM
    if (h === 12) h = 12; // 12:00 stays as 12 (noon)
    else if (h >= 1 && h <= 7) h += 12; // 01:00-07:00 becomes 13:00-19:00 (PM)
    return h * 60 + m;
  };

  const isLunchBreak = (timeStr) => {
    return timeStr === '12:00 - 01:00';
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
    const today = timetable.filter(t => t.day === currentDay && !isLunchBreak(t.timeSlot));
    const nowMin = currentTime.getHours() * 60 + currentTime.getMinutes();
    
    let current = null;
    let upcoming = [];
    today.forEach((cls) => {
      const parts = cls.timeSlot.split(' - ');
      if (nowMin >= getMinutes(parts[0]) && nowMin < getMinutes(parts[1])) current = cls;
      else if (nowMin < getMinutes(parts[0])) upcoming.push(cls);
    });

    const monthlyTarget = today.length * 4; 
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
    }, 60000);
    return () => clearInterval(interval);
  }, [stats.upcomingClasses, lastNotifiedId]);

  const handleExport = async () => {
    const element = document.getElementById('faculty-matrix-capture');
    if (!element) return;
    try {
      const canvas = await html2canvas(element, { 
        scale: 2, 
        backgroundColor: "#0f172a",
        useCORS: true 
      });
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `Faculty_Matrix_${facultyName}.png`;
      link.click();
      successToast("Timetable Downloaded!");
    } catch (err) { errorAlert("Fail", "Capture Error."); }
  };

  const dayFormatted = currentTime.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  const dateFormatted = currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
  const timeFormatted = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 gap-4">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full"
      />
      <motion.p 
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="text-xs font-bold uppercase tracking-[0.3em] text-orange-400"
      >
        Loading Faculty Portal...
      </motion.p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 font-['Outfit']">
      
      {/* FLOATING REMINDER */}
      <AnimatePresence>
        {reminder && (
          <motion.div 
            initial={{ opacity: 0, y: -100, x: '-50%' }} 
            animate={{ opacity: 1, y: 20, x: '-50%' }} 
            exit={{ opacity: 0, y: -100, x: '-50%' }} 
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[1000] w-[95%] max-w-md"
          >
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 backdrop-blur-xl border border-orange-500/30 rounded-2xl p-4 shadow-2xl shadow-orange-500/20">
              <div className="flex items-center gap-4">
                <motion.div 
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="bg-gradient-to-br from-orange-500 to-red-500 p-3 rounded-xl shadow-lg shadow-orange-500/30"
                >
                  <BellRing size={22} className="text-white"/>
                </motion.div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">Class in 5 Minutes</p>
                  <h4 className="text-white font-bold text-lg">{reminder.subject}</h4>
                  <p className="text-slate-400 text-xs">{reminder.batch} • Room {reminder.room}</p>
                </div>
                <button onClick={() => setReminder(null)} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
                  <X size={18} className="text-white"/>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8 space-y-6 md:space-y-8">
        
        {/* HEADER */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div className="flex items-center gap-4">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30"
            >
              <User size={28} className="text-white"/>
            </motion.div>
            <div>
              <motion.div 
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="flex items-center gap-2 mb-1"
              >
                <Calendar size={14} className="text-orange-500"/>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{dayFormatted} • {dateFormatted}</span>
                <span className="text-slate-300">•</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{timeFormatted}</span>
              </motion.div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-800 tracking-tight">
                <motion.span 
                  animate={{ color: ["#f97316", "#ea580c", "#f97316"] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  {facultyName}
                </motion.span>
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="px-3 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-bold rounded-full uppercase">{facultyData?.department || 'Faculty'}</span>
                <span className="text-[10px] text-slate-400 font-medium">ID: {facultyUid}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 bg-white/80 backdrop-blur-xl p-1.5 rounded-2xl shadow-lg border border-white/50">
            {[
              { id: 'today', icon: ListTodo, label: 'Today' },
              { id: 'matrix', icon: LayoutGrid, label: 'Weekly' },
              { id: 'stats', icon: BarChart3, label: 'Stats' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)} 
                className={`px-4 sm:px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                  activeTab === tab.id 
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30' 
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <tab.icon size={16}/> {tab.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* TAB CONTENT */}
        <AnimatePresence mode="wait">
          
          {/* TODAY TAB */}
          {activeTab === 'today' && (
            <motion.div 
              key="today"
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* STATS CARDS */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Today', val: (stats.currentClass ? 1 : 0) + stats.upcomingClasses.length, icon: Activity, color: 'from-orange-500 to-red-500' },
                    { label: 'Weekly', val: `${timetable.length} Classes`, icon: Cpu, color: 'from-blue-500 to-cyan-500' },
                    { label: 'Month', val: currentMonthName.slice(0,3), icon: Calendar, color: 'from-purple-500 to-pink-500' },
                    { label: 'Expertise', val: facultyData?.expertise?.[0] || 'Logic', icon: GraduationCap, color: 'from-emerald-500 to-teal-500' }
                ].map((s, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ y: -5 }}
                    className="bg-white/80 backdrop-blur-xl p-5 rounded-2xl border border-white/50 shadow-lg hover:shadow-xl transition-all"
                  >
                    <div className={`w-10 h-10 bg-gradient-to-br ${s.color} rounded-xl flex items-center justify-center mb-3 shadow-lg`}>
                      <s.icon size={20} className="text-white"/>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
                    <p className="text-lg font-black text-slate-800 mt-1">{s.val}</p>
                  </motion.div>
                ))}
              </div>

              {/* LIVE CLASS CARD */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`relative overflow-hidden rounded-3xl p-6 md:p-8 transition-all ${
                  stats.currentClass 
                    ? 'bg-gradient-to-br from-slate-800 to-slate-900 shadow-2xl shadow-red-500/20 border-2 border-red-500/30' 
                    : 'bg-white/80 backdrop-blur-xl border border-slate-200/50 shadow-lg'
                }`}
              >
                {stats.currentClass && (
                  <motion.div 
                    animate={{ opacity: [0.2, 0.4, 0.2] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute top-0 right-0 w-60 h-60 bg-red-500/20 rounded-full blur-3xl"
                  />
                )}
                <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {stats.currentClass && (
                      <motion.div 
                        animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="bg-gradient-to-br from-red-500 to-orange-500 p-4 rounded-2xl shadow-lg shadow-red-500/30"
                      >
                        <BrainCircuit size={28} className="text-white"/>
                      </motion.div>
                    )}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        {stats.currentClass && (
                          <motion.div 
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                            className="w-2 h-2 bg-red-500 rounded-full"
                          />
                        )}
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${stats.currentClass ? 'text-red-400' : 'text-slate-400'}`}>
                          {stats.currentClass ? 'Live Now' : 'No Live Class'}
                        </span>
                      </div>
                      <h2 className={`text-2xl md:text-4xl font-black ${stats.currentClass ? 'text-white' : 'text-slate-300'}`}>
                        {stats.currentClass?.subject || 'Waiting for class...'}
                      </h2>
                      {stats.currentClass && (
                        <div className="flex items-center gap-6 mt-3">
                          <span className="flex items-center gap-1.5 text-slate-300 text-xs font-medium">
                            <Clock size={14} className="text-orange-400"/> {stats.currentClass.timeSlot}
                          </span>
                          <span className="flex items-center gap-1.5 text-slate-300 text-xs font-medium">
                            <MapPin size={14} className="text-red-400"/> Room {stats.currentClass.room}
                          </span>
                          <span className="flex items-center gap-1.5 text-slate-300 text-xs font-medium">
                            <Users size={14} className="text-orange-400"/> {stats.currentClass.batch}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  {!stats.currentClass && (
                    <div className="bg-slate-100 p-4 rounded-2xl">
                      <BrainCircuit size={28} className="text-slate-300"/>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* UPCOMING CLASSES */}
              {stats.upcomingClasses.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Upcoming Classes</h3>
                  {stats.upcomingClasses.map((cls, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-5 md:p-6 rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200/50 shadow-lg hover:shadow-xl hover:border-orange-200 transition-all group"
                    >
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="bg-slate-800 group-hover:bg-gradient-to-br group-hover:from-orange-500 group-hover:to-red-500 p-3 rounded-xl transition-all duration-300">
                            <BookOpen size={24} className="text-orange-400 group-hover:text-white transition-colors"/>
                          </div>
                          <div>
                            <h4 className="text-slate-800 font-bold text-lg group-hover:text-orange-600 transition-colors">{cls.subject}</h4>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
                                <Clock size={14} className="text-orange-500"/> {cls.timeSlot}
                              </span>
                              <span className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
                                <MapPin size={14} className="text-red-400"/> Room {cls.room}
                              </span>
                              <span className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
                                <Users size={14} className="text-purple-400"/> {cls.batch}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="bg-slate-50 px-5 py-2 rounded-lg border border-slate-100">
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Batch</p>
                          <p className="text-slate-700 font-semibold text-sm">{cls.batch}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {stats.upcomingClasses.length === 0 && !stats.currentClass && (
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="py-20 bg-white/60 backdrop-blur-xl rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-4"
                >
                  <motion.div 
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30"
                  >
                    <CheckCircle size={32} className="text-white"/>
                  </motion.div>
                  <p className="text-slate-500 font-bold uppercase tracking-wider text-sm">No Classes Today!</p>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* WEEKLY MATRIX TAB */}
          {activeTab === 'matrix' && (
            <motion.div 
              key="matrix"
              initial={{ opacity: 0, scale: 0.98 }} 
              animate={{ opacity: 1, scale: 1 }}
              id="faculty-matrix-capture" 
              className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-3xl p-4 sm:p-6 md:p-10 shadow-2xl border border-white/5 overflow-hidden relative"
            >
              <motion.div 
                animate={{ opacity: [0.1, 0.2, 0.1] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -top-20 -right-20 w-60 h-60 bg-orange-500/20 rounded-full blur-3xl"
              />
              
              <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-white/10">
                <div>
                  <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">Weekly Schedule</h3>
                  <p className="text-slate-400 text-sm mt-1">{timetable.length} Classes This Week</p>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleExport}
                  className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 rounded-xl text-white font-bold text-sm shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all"
                >
                  <Download size={18}/> Download
                </motion.button>
              </div>
              
              <ZoomableTimetable>
                <div className="min-w-[700px]">
                  <div className="grid grid-cols-7 gap-2 md:gap-4">
                    <div className="col-span-1 space-y-2 md:space-y-4 pt-8 md:pt-16 text-right pr-2">
                      {timeSlots.map(s => (
                        <div key={s} className="h-12 md:h-20 flex items-center justify-end text-[8px] md:text-xs font-bold text-slate-500 uppercase">{s.split(' - ')[0]}</div>
                      ))}
                    </div>
                    {days.map(day => (
                      <div key={day} className="col-span-1 space-y-2 md:space-y-4 text-center">
                        <h1 className={`text-[10px] md:text-sm font-bold uppercase tracking-wider pb-4 md:pb-8 border-b border-white/5 mb-4 md:mb-8 ${
                          day === currentDay ? 'text-red-400' : 'text-slate-300'
                        }`}>
                          {day.slice(0, 3)}
                        </h1>
                        {timeSlots.map((slot, i) => {
                          const session = timetable.find(t => t.day === day && t.timeSlot === slot);
                          const isLive = day === currentDay && stats.currentClass?.timeSlot === slot;
                          return (
                            <motion.div 
                              key={i} 
                              whileHover={{ scale: 1.02 }}
                              className={`h-14 md:h-24 rounded-lg md:rounded-xl border flex flex-col items-center justify-center p-1 md:p-3 transition-all ${
                                session 
                                  ? isLive 
                                    ? 'bg-gradient-to-br from-red-500 to-rose-600 border-white shadow-lg shadow-red-500/30' 
                                    : 'bg-red-500/20 border-red-500/50'
                                  : 'bg-white/5 border-transparent'
                              }`}
                            >
                              {session ? (
                                <>
                                  <p className={`text-[6px] md:text-[9px] font-bold uppercase truncate w-full leading-tight ${isLive ? 'text-white' : 'text-red-400'}`}>
                                    {session.subject}
                                  </p>
                                  <p className={`text-[5px] md:text-[7px] truncate w-full ${isLive ? 'text-red-200' : 'text-red-300'}`}>
                                    {session.subjectCode}
                                  </p>
                                  <div className={`mt-0.5 md:mt-1 px-1 md:px-2 py-0.5 rounded text-[5px] md:text-[7px] font-bold ${
                                    isLive ? 'bg-white text-red-600' : 'bg-red-500 text-white'
                                  }`}>
                                    R-{session.room}
                                  </div>
                                  {session.batch && (
                                    <p className={`text-[4px] md:text-[6px] mt-0.5 ${isLive ? 'text-white/70' : 'text-slate-400'}`}>
                                      {session.batch}
                                    </p>
                                  )}
                                </>
                              ) : (
                                <span className="text-[5px] text-slate-600 uppercase">-</span>
                              )}
                            </motion.div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </ZoomableTimetable>
            </motion.div>
          )}

          {/* STATS TAB */}
          {activeTab === 'stats' && (
            <motion.div 
              key="stats"
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* ANALYTICS CARD */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-slate-200/50 shadow-xl"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                    <BarChart3 size={20} className="text-white"/>
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800">Load Analytics</h3>
                    <p className="text-xs text-slate-500">{currentMonthName} Performance</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* PROGRESS BAR */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-600">Work Efficiency</span>
                      <span className="text-lg font-black text-orange-500">{stats.conductanceRatio}%</span>
                    </div>
                    <div className="relative h-4 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${stats.conductanceRatio}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full shadow-lg shadow-orange-500/30"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div className="bg-slate-800 p-6 rounded-2xl text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Target</p>
                        <p className="text-3xl font-black text-white mt-1">{stats.monthlyTarget}</p>
                      </div>
                      <div className="bg-gradient-to-br from-orange-500 to-red-500 p-6 rounded-2xl text-center">
                        <p className="text-[10px] font-bold text-orange-100 uppercase">Completed</p>
                        <p className="text-3xl font-black text-white mt-1">{stats.conducted}</p>
                      </div>
                    </div>
                  </div>

                  {/* EXPERTISE */}
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-2 mb-4">
                      <Globe size={16} className="text-blue-500"/>
                      <span className="text-sm font-bold text-slate-600">Subject Expertise</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {facultyData?.expertise?.map((sub, i) => (
                        <motion.span 
                          key={i}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.1 }}
                          whileHover={{ scale: 1.05 }}
                          className="px-4 py-2 bg-white rounded-xl text-xs font-bold uppercase border border-slate-200 text-slate-700 shadow-sm hover:border-orange-500 hover:text-orange-600 cursor-default transition-all"
                        >
                          {sub}
                        </motion.span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* CLASS HISTORY */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-slate-200/50 shadow-xl"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <History size={20} className="text-slate-400"/>
                    <h3 className="text-lg font-black text-slate-800">Class History</h3>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">{timetable.length} Classes</span>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scroll">
                  {timetable.length === 0 ? (
                    <p className="py-10 text-center text-slate-300 font-bold uppercase text-sm">No classes scheduled</p>
                  ) : timetable.map((cls, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-orange-200 hover:bg-white transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="bg-white px-3 py-2 rounded-lg border border-slate-200 text-center min-w-[60px]">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">{cls.day?.slice(0,3)}</p>
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 group-hover:text-orange-600 transition-colors">{cls.subject}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                <MapPin size={10} className="text-red-400"/> Room {cls.room}
                              </span>
                              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                <Users size={10} className="text-purple-400"/> {cls.batch}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle size={16} className="text-emerald-500"/>
                          <span className="text-[10px] font-bold text-emerald-600 uppercase">Done</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FOOTER */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center items-center gap-3 pt-4"
        >
          <motion.div 
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-2 h-2 bg-emerald-500 rounded-full"
          />
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">LPU Neural HUB • Faculty Portal</p>
        </motion.div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
