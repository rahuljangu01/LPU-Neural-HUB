import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  Clock, MapPin, Activity, Download, LayoutGrid, ListTodo, 
  GraduationCap, BellRing, X, CheckCircle, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import API from '../services/api';
import { successToast, errorAlert } from '../services/alertService';

const timeSlots = ["09:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00", "01:00 - 02:00", "02:00 - 03:00", "03:00 - 04:00"];
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const StudentDashboard = () => {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('today'); 
  const [currentTime, setCurrentTime] = useState(new Date());
  const [reminder, setReminder] = useState(null); 
  const [lastNotifiedId, setLastNotifiedId] = useState(null);

  const userName = localStorage.getItem('userName') || 'Student';
  const userBatch = localStorage.getItem('userBatch') || 'D2421'; 
  const userUid = localStorage.getItem('userUid') || '';
  const currentDay = currentTime.toLocaleDateString('en-US', { weekday: 'long' });

  const getMinutes = (timeStr) => {
    if (!timeStr) return 0;
    let [h, m] = timeStr.trim().split(':').map(Number);
    if (h >= 1 && h <= 7) h += 12;
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
        Loading Timetable...
      </motion.p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 font-['Outfit']">
      
      {/* FLOATING NOTIFICATION */}
      <AnimatePresence>
        {reminder && (
          <motion.div 
            initial={{ opacity: 0, y: -100, x: '-50%' }} 
            animate={{ opacity: 1, y: 20, x: '-50%' }} 
            exit={{ opacity: 0, y: -100, x: '-50%' }} 
            transition={{ type: "spring", stiffness: 200, damping: 20 }} 
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
                  <p className="text-slate-400 text-xs">Room {reminder.room} • {reminder.timeSlot.split(' - ')[0]}</p>
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
          <div>
            <motion.div 
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="flex items-center gap-2 mb-2"
            >
              <Calendar size={14} className="text-orange-500"/>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{dayFormatted} • {dateFormatted}</span>
              <span className="text-slate-300">•</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{timeFormatted}</span>
            </motion.div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-800 tracking-tight">
              Hello, <motion.span 
                animate={{ color: ["#f97316", "#ea580c", "#f97316"] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="text-orange-500"
              >
                {userName.split(' ')[0]}
              </motion.span>
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="px-3 py-1 bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-[10px] font-bold rounded-full uppercase">{userBatch}</span>
              <span className="text-[10px] text-slate-400 font-medium">Reg: {userUid}</span>
            </div>
          </div>

          <div className="flex gap-2 bg-white/80 backdrop-blur-xl p-1.5 rounded-2xl shadow-lg border border-white/50">
            <button 
              onClick={() => setActiveTab('today')} 
              className={`px-5 sm:px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeTab === 'today' 
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30' 
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              <ListTodo size={16}/> Today
            </button>
            <button 
              onClick={() => setActiveTab('weekly')} 
              className={`px-5 sm:px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeTab === 'weekly' 
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30' 
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              <LayoutGrid size={16}/> Weekly
            </button>
          </div>
        </motion.div>

        {/* STATUS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* LIVE CLASS CARD */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className={`relative overflow-hidden rounded-3xl p-6 md:p-8 transition-all ${
              currentClass 
                ? 'bg-gradient-to-br from-slate-800 to-slate-900 shadow-2xl shadow-red-500/20 border border-red-500/30' 
                : 'bg-white/80 backdrop-blur-xl border border-slate-200/50 shadow-lg'
            }`}
          >
            {currentClass && (
              <motion.div 
                animate={{ opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute top-0 right-0 w-40 h-40 bg-red-500/20 rounded-full blur-3xl"
              />
            )}
            <div className="relative flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {currentClass ? (
                    <motion.div 
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="w-2 h-2 bg-red-500 rounded-full"
                    />
                  ) : null}
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${currentClass ? 'text-red-400' : 'text-slate-400'}`}>
                    {currentClass ? 'Live Now' : 'No Live Class'}
                  </span>
                </div>
                <h2 className={`text-xl sm:text-2xl md:text-3xl font-black ${currentClass ? 'text-white' : 'text-slate-300'}`}>
                  {currentClass?.subject || 'Waiting...'}
                </h2>
                {currentClass && (
                  <div className="flex items-center gap-4 mt-3">
                    <span className="flex items-center gap-1.5 text-slate-300 text-xs font-medium">
                      <Clock size={14} className="text-orange-400"/> {currentClass.timeSlot}
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-300 text-xs font-medium">
                      <MapPin size={14} className="text-red-400"/> Room {currentClass.room}
                    </span>
                  </div>
                )}
              </div>
              {currentClass && (
                <motion.div 
                  animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="bg-gradient-to-br from-red-500 to-orange-500 p-4 rounded-2xl shadow-lg shadow-red-500/30"
                >
                  <Activity size={28} className="text-white"/>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* UPCOMING CLASS CARD */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="relative overflow-hidden rounded-3xl p-6 md:p-8 bg-white/80 backdrop-blur-xl border border-slate-200/50 shadow-lg hover:shadow-xl hover:border-orange-200 transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Next Class</span>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-800 mt-1">
                  {upcomingClasses[0]?.subject || 'No More Classes'}
                </h2>
                {upcomingClasses[0] && (
                  <div className="flex items-center gap-4 mt-3">
                    <span className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
                      <Clock size={14} className="text-orange-500"/> {upcomingClasses[0].timeSlot}
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
                      <MapPin size={14} className="text-red-400"/> Room {upcomingClasses[0].room}
                    </span>
                  </div>
                )}
              </div>
              <div className="bg-gradient-to-br from-slate-100 to-slate-50 p-4 rounded-2xl border border-slate-200">
                <Clock size={28} className="text-slate-400"/>
              </div>
            </div>
          </motion.div>
        </div>

        {/* CONTENT HUB */}
        <AnimatePresence mode="wait">
          {activeTab === 'today' ? (
            <motion.div 
              key="today"
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-4">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">{currentDay} Schedule</h3>
                <div className="flex-1 h-px bg-slate-200"/>
              </div>

              {upcomingClasses.length === 0 && !currentClass ? (
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
                  <p className="text-slate-500 font-bold uppercase tracking-wider text-sm">All Classes Completed!</p>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  {currentClass && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-slate-800 to-slate-900 shadow-2xl border-2 border-orange-500/50 overflow-hidden relative"
                    >
                      <motion.div 
                        animate={{ opacity: [0.2, 0.4, 0.2] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="absolute top-0 right-0 w-60 h-60 bg-orange-500/20 rounded-full blur-3xl"
                      />
                      <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <motion.div 
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="bg-gradient-to-br from-orange-500 to-red-500 p-4 rounded-2xl shadow-lg shadow-orange-500/30"
                          >
                            <GraduationCap size={28} className="text-white"/>
                          </motion.div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full uppercase animate-pulse">Live</span>
                              <span className="text-orange-400 text-xs font-medium">{currentClass.day}</span>
                            </div>
                            <h4 className="text-white font-black text-xl md:text-2xl">{currentClass.subject}</h4>
                            <div className="flex items-center gap-4 mt-2">
                              <span className="flex items-center gap-1.5 text-slate-300 text-xs font-medium">
                                <Clock size={14} className="text-orange-400"/> {currentClass.timeSlot}
                              </span>
                              <span className="flex items-center gap-1.5 text-slate-300 text-xs font-medium">
                                <MapPin size={14} className="text-red-400"/> Room {currentClass.room}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm px-6 py-3 rounded-xl border border-white/10">
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Professor</p>
                          <p className="text-white font-bold">{currentClass.faculty?.name || 'TBA'}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  {upcomingClasses.map((cls, idx) => (
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
                            <GraduationCap size={24} className="text-orange-400 group-hover:text-white transition-colors"/>
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
                            </div>
                          </div>
                        </div>
                        <div className="bg-slate-50 px-5 py-2 rounded-lg border border-slate-100">
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Professor</p>
                          <p className="text-slate-700 font-semibold text-sm">{cls.faculty?.name || 'TBA'}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="weekly"
              initial={{ opacity: 0, scale: 0.98 }} 
              animate={{ opacity: 1, scale: 1 }}
              id="weekly-Timetable-capture" 
              className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-3xl p-4 sm:p-6 md:p-10 shadow-2xl border border-white/5 overflow-hidden relative"
            >
              <motion.div 
                animate={{ opacity: [0.1, 0.2, 0.1] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -top-20 -right-20 w-60 h-60 bg-orange-500/20 rounded-full blur-3xl"
              />
              
              <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-white/10">
                <div>
                  <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">Weekly Timetable</h3>
                  <p className="text-slate-400 text-sm mt-1">{userBatch} • {timetable.length} Sessions</p>
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
              
              <div className="overflow-x-auto">
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
                          day === currentDay ? 'text-orange-400' : 'text-slate-300'
                        }`}>
                          {day.slice(0, 3)}
                        </h1>
                        {timeSlots.map((slot, i) => {
                          const session = timetable.find(t => t.day === day && t.timeSlot === slot);
                          const isCurrentSlot = day === currentDay && currentClass?.timeSlot === slot;
                          return (
                            <motion.div 
                              key={i} 
                              whileHover={{ scale: 1.02 }}
                              className={`h-12 md:h-20 rounded-lg md:rounded-xl border flex flex-col items-center justify-center p-1 md:p-3 transition-all ${
                                session 
                                  ? isCurrentSlot 
                                    ? 'bg-gradient-to-br from-orange-500 to-red-500 border-white shadow-lg shadow-orange-500/30' 
                                    : 'bg-orange-500/20 border-orange-500/50'
                                  : 'bg-white/5 border-transparent'
                              }`}
                            >
                              {session ? (
                                <>
                                  <p className={`text-[6px] md:text-[10px] font-bold uppercase truncate w-full leading-tight ${isCurrentSlot ? 'text-white' : 'text-orange-400'}`}>
                                    {session.subject}
                                  </p>
                                  <div className={`mt-1 px-1.5 py-0.5 rounded text-[5px] md:text-[8px] font-bold ${
                                    isCurrentSlot ? 'bg-white text-orange-600' : 'bg-orange-500 text-white'
                                  }`}>
                                    R-{session.room}
                                  </div>
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
              </div>
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
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">LPU Neural HUB • Identity Verified</p>
        </motion.div>
      </div>
    </div>
  );
};

export default StudentDashboard;
