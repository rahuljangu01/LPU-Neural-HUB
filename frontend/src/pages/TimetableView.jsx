import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Clock, MapPin, BookOpen,
  Activity, Search, Zap, GraduationCap
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
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, [fetchGlobalSchedule]);

  const filteredSchedule = useMemo(() => {
    return schedule.filter(item =>
      item.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.batch?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.faculty?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [schedule, searchTerm]);

  const isClassLive = (item) => {
    if (item.day !== currentDay) return false;
    const now = currentTime.getHours() * 60 + currentTime.getMinutes();

    const parseTime = (tStr) => {
      let [h, m] = tStr.trim().split(':').map(Number);
      if (h >= 1 && h <= 7) h += 12;
      return h * 60 + m;
    };

    const [start, end] = item.timeSlot.split(' - ').map(parseTime);
    return now >= start && now < end;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-100 font-['Outfit']">

      <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 px-4 sm:px-6 md:px-8 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex items-center gap-4">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30"
              >
                <GraduationCap size={28} className="text-white"/>
              </motion.div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">LPU Neural HUB</span>
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white">
                  Class <span className="text-orange-500">Schedule</span>
                </h2>
              </div>
            </div>

            <div className="relative w-full lg:w-[400px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
              <input
                type="text"
                placeholder="Search Subject, Teacher or Batch..."
                className="w-full bg-white/10 border border-white/10 p-3 sm:p-4 pl-12 rounded-xl outline-none focus:border-orange-500 text-white text-sm placeholder:text-slate-500 backdrop-blur-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full"
            />
            <p className="text-slate-400 font-semibold text-sm">Loading schedule...</p>
          </div>
        ) : filteredSchedule.length === 0 ? (
          <div className="text-center py-40 bg-white rounded-2xl border border-slate-200">
            <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Zap size={40} className="text-slate-300"/>
            </div>
            <p className="text-slate-500 font-bold text-lg">No classes found</p>
            <p className="text-slate-400 text-sm mt-1">Try adjusting your search</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-slate-500 text-sm font-semibold">
                Showing {filteredSchedule.length} of {schedule.length} classes
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Activity size={14} className="text-orange-500 animate-pulse"/>
                Live updates enabled
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredSchedule.map((item, index) => {
                const live = isClassLive(item);
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                    className={`relative bg-white rounded-2xl border-2 overflow-hidden transition-all duration-300 ${
                      live ? 'border-orange-500 shadow-xl shadow-orange-500/20' : 'border-slate-200 hover:border-orange-300 hover:shadow-lg'
                    }`}
                  >
                    <div className={`h-1 ${live ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-gradient-to-r from-slate-300 to-slate-400'}`}/>

                    {live && (
                      <div className="absolute top-3 right-3">
                        <motion.span
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                          className="px-3 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-bold rounded-full uppercase"
                        >
                          Live
                        </motion.span>
                      </div>
                    )}

                    <div className="p-4 sm:p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          live ? 'bg-gradient-to-br from-orange-500 to-red-500' : 'bg-slate-800'
                        }`}>
                          <BookOpen size={24} className="text-white"/>
                        </div>
                        <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase ${
                          live ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {item.day}
                        </span>
                      </div>

                      <h4 className="text-lg font-bold text-slate-800 mb-4 line-clamp-2">
                        {item.subject}
                      </h4>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-3 text-slate-600">
                          <Clock size={16} className="text-orange-500"/>
                          <span className="text-sm font-semibold">{item.timeSlot}</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-600">
                          <MapPin size={16} className="text-orange-500"/>
                          <span className="text-sm font-semibold">Room {item.room}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center text-white font-bold text-xs`}>
                            {item.faculty?.name?.charAt(0) || 'U'}
                          </div>
                          <span className="text-xs font-semibold text-slate-600 truncate max-w-[100px]">
                            {item.faculty?.name || 'Teacher'}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-orange-500 bg-orange-50 px-3 py-1 rounded-full">
                          {item.batch}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <div className="px-4 sm:px-6 md:px-8 py-6 border-t border-slate-200">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-slate-400 text-xs font-semibold">
          <p>Total Classes: {schedule.length}</p>
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-orange-500 animate-pulse"/>
            System Online
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimetableView;