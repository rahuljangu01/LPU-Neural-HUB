import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  Clock, MapPin, BookOpen, 
  Activity, Search, Filter, Globe, Zap, ArrowUpRight 
} from 'lucide-react';
import { motion } from 'framer-motion';
import API from '../services/api';

const TimetableView = () => {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  const currentDay = currentTime.toLocaleDateString('en-US', { weekday: 'long' });

  const fetchGlobalSchedule = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get('/timetable');
      setSchedule(res.data);
    } catch (err) {
      console.error("Global Sync Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGlobalSchedule();
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Update every minute
    return () => clearInterval(timer);
  }, [fetchGlobalSchedule]);

  // --- 🎯 SMART SEARCH LOGIC ---
  const filteredSchedule = useMemo(() => {
    return schedule.filter(item => 
      item.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.batch.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.faculty?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [schedule, searchTerm]);

  // --- ⚡ LIVE CLASS CHECKER ---
  const isClassLive = (item) => {
    if (item.day !== currentDay) return false;
    const now = currentTime.getHours() * 60 + currentTime.getMinutes();
    
    const parseTime = (tStr) => {
      let [h, m] = tStr.trim().split(':').map(Number);
      if (h >= 1 && h <= 7) h += 12; // PM Fix
      return h * 60 + m;
    };

    const [start, end] = item.timeSlot.split(' - ').map(parseTime);
    return now >= start && now < end;
  };

  return (
    <div className="p-4 md:p-8 space-y-8 font-['Outfit'] bg-[#f8fafc] min-h-screen text-left">
      
      {/* 🛰️ HEADER & SEARCH HUB */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 border-b border-slate-200 pb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-red-600 p-1.5 rounded-lg text-white shadow-lg shadow-red-200">
               <Globe size={18} className="animate-spin-slow" />
            </div>
            <span className="text-[10px] font-black text-red-600 uppercase tracking-[0.3em] italic">Timetable System</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">
            Class <span className="text-red-600">Schedule</span>
          </h2>
        </div>

        {/* SEARCH BAR NODE */}
        <div className="relative w-full md:w-[400px] group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-500 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search Subject, Teacher or Batch..."
            className="w-full bg-white border-2 border-slate-100 p-4 pl-12 rounded-2xl outline-none focus:border-red-500 shadow-xl shadow-slate-200/50 font-bold text-sm transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
             <Filter size={14} className="text-slate-400"/>
          </div>
        </div>
      </div>

      {/* 📊 GRID FEED */}
      <div className="relative">
        {loading ? (
          <div className="flex flex-col items-center py-40 gap-4">
            <motion.div 
              animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full"
            />
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em]">Loading schedule...</p>
          </div>
        ) : filteredSchedule.length === 0 ? (
          <div className="text-center py-40 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 flex flex-col items-center gap-4">
             <Zap size={48} className="text-slate-200" />
             <p className="text-xs font-black uppercase text-slate-400 tracking-widest italic text-center">No classes found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredSchedule.map((item, index) => {
              const live = isClassLive(item);
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -8 }}
                  className={`relative group bg-white p-6 rounded-[2.5rem] border-2 transition-all duration-500 overflow-hidden shadow-sm
                    ${live ? 'border-red-500 shadow-red-100 shadow-2xl ring-4 ring-red-500/5' : 'border-slate-50 hover:border-red-200'}`}
                >
                  {/* LIVE INDICATOR GLOW */}
                  {live && (
                    <div className="absolute -top-12 -right-12 w-24 h-24 bg-red-500 blur-[40px] opacity-20 animate-pulse" />
                  )}

                  <div className="flex justify-between items-start mb-6">
                    <div className={`p-3 rounded-2xl shadow-lg transition-colors ${live ? 'bg-red-600 text-white' : 'bg-slate-900 text-white group-hover:bg-red-600'}`}>
                      <BookOpen size={20} />
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`text-[8px] font-black uppercase px-3 py-1 rounded-full tracking-widest mb-1 ${live ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 text-slate-400'}`}>
                          {live ? 'Live' : item.day}
                      </span>
                    </div>
                  </div>
                  
                  <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-tight mb-6 min-h-[50px] group-hover:text-red-600 transition-colors">
                    {item.subject}
                  </h4>
                  
                  <div className="space-y-3 mb-8">
                    <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500 uppercase tracking-tight">
                      <Clock size={16} className="text-red-500"/> {item.timeSlot}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500 uppercase tracking-tight">
                      <MapPin size={16} className="text-red-600"/> Room {item.room}
                    </div>
                  </div>

                  <div className="border-t border-slate-50 pt-5 flex items-center justify-between">
                    <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                      <div className="w-6 h-6 bg-red-600 rounded-lg flex items-center justify-center text-white text-[10px] font-black italic">
                        {item.faculty?.name?.charAt(0) || 'U'}
                      </div>
                      <span className="text-[10px] font-black text-slate-700 uppercase truncate max-w-[120px]">
                          {item.faculty?.name || 'Teacher'}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                       <p className="text-[7px] font-black text-slate-300 uppercase">Batch</p>
                       <span className="text-[10px] font-black text-red-600 uppercase italic">{item.batch}</span>
                    </div>
                  </div>
                  
                  <ArrowUpRight className="absolute bottom-6 right-6 text-slate-100 group-hover:text-red-500/20 transition-colors" size={40} />
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* 🛰️ FOOTER STATUS */}
      {!loading && (
        <div className="pt-10 flex flex-col md:flex-row justify-between items-center gap-4 opacity-30 border-t border-slate-200">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] italic">
                Total Classes: {schedule.length}
            </p>
            <div className="flex items-center gap-2">
                <Activity size={14} className="text-red-600 animate-pulse" />
                <span className="text-[9px] font-black uppercase text-slate-800 tracking-widest">System Updated</span>
            </div>
        </div>
      )}
    </div>
  );
};

export default TimetableView;