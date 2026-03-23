import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Trash2, Building2, Clock, User as UserIcon, Activity, 
  ArrowLeft, Search, CheckCircle2,
  Brain, Cpu, Briefcase, 
  Settings2, RefreshCw, Wand2, TrendingUp,
  LayoutGrid, Download, Megaphone, Send, History, Globe, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import API from '../services/api';
import { successToast, errorAlert, confirmDialog } from '../services/alertService';

const HODDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [view, setView] = useState('main'); 
  const [isGenerating, setIsGenerating] = useState(false);
  const [genStep, setGenStep] = useState(0);
  
  // --- DATABASE & ENGINE STATES ---
  const [variants, setVariants] = useState([]); 
  const [activeVariantIndex, setActiveVariantIndex] = useState(0); 
  const [faculties, setFaculties] = useState([]);
  const [currentSchedule, setCurrentSchedule] = useState([]); 
  const [rooms, setRooms] = useState([]);
  const [subjectList, setSubjectList] = useState([]);
  const [messages, setMessages] = useState([]);
  const [batches, setBatches] = useState([]); 
  const [availableRooms, setAvailableRooms] = useState([]);
  const [msgContent, setMsgContent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // AI PARAMETERS
  const [params, setParams] = useState({ 
    maxLoad: 6, 
    leaveBuffer: true, 
    batchId: 'all',
    fixedSlots: {} 
  });
  const [query, setQuery] = useState({ day: 'Monday', timeSlot: '09:00 - 10:00' });

  const timeSlots = ["09:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00", "01:00 - 02:00", "02:00 - 03:00", "03:00 - 04:00"];
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const aiSteps = ["Applying Parameters", "Mapping Fixed Slots", "Resolving Clashes", "Finalizing Timetable"];

  // 1. DATA FETCHING
  const fetchHubIntel = useCallback(async () => {
    try {
      const [u, s, m, r, b, sub] = await Promise.all([
        API.get('/auth/users').catch(() => ({ data: [] })), 
        API.get('/timetable').catch(() => ({ data: [] })),
        API.get('/messages').catch(() => ({ data: [] })),
        API.get('/rooms').catch(() => ({ data: [] })),
        API.get('/batches').catch(() => ({ data: [] })),
        API.get('/subjects').catch(() => ({ data: [] }))
      ]);
      setFaculties(u.data.filter(user => user.role === 'faculty' || user.role === 'hod'));
      setCurrentSchedule(s.data);
      setMessages(m.data);
      setRooms(r.data);
      setBatches(b.data || []);
      setSubjectList(sub.data || []);
    } catch (err) { console.error("Neural Sync Error"); }
  }, []);

  useEffect(() => { 
    fetchHubIntel(); 
    const path = location.pathname;
    if (path === '/hod/optimizer') setView('optimizer_hub');
    else if (path === '/hod/broadcast') setView('broadcast');
    else if (path === '/hod/monitor') setView('monitor');
    else if (path === '/hod/availability') setView('scanner');
    else if (path === '/hod/personnel') setView('personnel');
    else setView('main');
  }, [fetchHubIntel, location.pathname]);

  // 2. ANALYTICS & FILTERS
  const analytics = useMemo(() => {
    const totalPossibleSlots = (rooms.length || 1) * 6 * 7; 
    return { util: totalPossibleSlots > 0 ? Math.min(Math.round((currentSchedule.length / totalPossibleSlots) * 100), 100) : 0 };
  }, [rooms, currentSchedule]);

  const filteredFaculties = useMemo(() => {
    return faculties.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [faculties, searchTerm]);

  const selectedBatchSubjects = useMemo(() => {
    if (params.batchId === 'all') return [];
    const foundBatch = batches.find(b => b._id === params.batchId);
    if (!foundBatch) return [];
    return subjectList.filter(s => foundBatch.subjects.includes(s._id));
  }, [params.batchId, batches, subjectList]);

  const groupedSchedule = useMemo(() => {
    return currentSchedule.reduce((acc, curr) => {
      const batchName = curr.batch || 'UNASSIGNED';
      if (!acc[batchName]) acc[batchName] = [];
      acc[batchName].push(curr);
      return acc;
    }, {});
  }, [currentSchedule]);

  // 3. HANDLERS
  const executeNeuralEngine = async () => {
    if (!(await confirmDialog("Generate Timetable?", "AI will create 3 optimized timetable options for you."))) return;
    setIsGenerating(true);
    let step = 0;
    const interval = setInterval(() => { if (step < 4) { step++; setGenStep(step); } }, 800);
    try {
      const res = await API.post('/scheduler/generate', params);
      setTimeout(() => {
        clearInterval(interval);
        if (res.data.variants && res.data.variants[0].schedule.length > 0) {
          setVariants(res.data.variants);
          setView('optimizer_results');
          successToast("Neural Optimization Complete!");
        } else {
          errorAlert("NaN Result", "AI found 0 valid combinations.");
        }
        setIsGenerating(false);
      }, 2500); 
    } catch (err) { clearInterval(interval); setIsGenerating(false); errorAlert("Logic Fail", "Conflict in constraints."); }
  };

  const handleApproveVariant = async () => {
    if (await confirmDialog("Deploy Timetable?", "This will finalize the official schedule.")) {
      try {
        await API.post('/timetable/add-bulk', { schedule: variants[activeVariantIndex].schedule });
        successToast("Timetable Locked & Scheduled!");
        fetchHubIntel();
        navigate('/hod/monitor');
      } catch (err) { errorAlert("Error", "Deployment failed."); }
    }
  };

  const handlePurgeNode = async (id) => {
    if (await confirmDialog("Remove Slot?", "Remove this single slot?")) {
      try { await API.delete(`/timetable/${id}`); successToast("Slot Removed."); fetchHubIntel(); }
      catch (err) { errorAlert("Error", "Action denied."); }
    }
  };

  const handlePurgeEntireMatrix = async () => {
    if (await confirmDialog("Remove ALL?", "This will delete the entire timetable!")) {
      setIsGenerating(true); 
      try {
        await Promise.all(currentSchedule.map(s => API.delete(`/timetable/${s._id}`)));
        successToast("Timetable Wiped!"); fetchHubIntel();
      } catch (err) { errorAlert("Error", "Wipe failed."); }
      finally { setIsGenerating(false); }
    }
  };

  const handlePurgeBatch = async (batchName, batchClasses) => {
    if (await confirmDialog(`Delete ${batchName}?`, "Delete all classes for this cluster?")) {
      setIsGenerating(true); 
      try {
        await Promise.all(batchClasses.map(s => API.delete(`/timetable/${s._id}`)));
        successToast(`${batchName} Deleted!`); fetchHubIntel();
      } catch (err) { errorAlert("Error", "Delete failed."); }
      finally { setIsGenerating(false); }
    }
  };

  const handleDownloadTimetable = async (batchName) => {
    const element = document.getElementById(`timetable-${batchName}`);
    if (!element) return;
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(element, { scale: 2, backgroundColor: "#ffffff" });
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `Timetable_${batchName}.png`;
      link.click();
      successToast("Timetable Dawnloaded!");
    } catch (err) { errorAlert("Export Failed", "Capture error."); }
    finally { setIsGenerating(false); }
  };

  const findRooms = async () => {
    try {
      const res = await API.get(`/timetable/availability?day=${query.day}&timeSlot=${query.timeSlot}`);
      setAvailableRooms(res.data.filter(r => r.isAvailable));
      setView('scanner_results'); successToast("Scan Completed.");
    } catch (err) { errorAlert("Error", "Scan failed."); }
  };

  const sendBroadcast = async (e) => {
    e.preventDefault();
    try {
      await API.post('/messages', { senderName: localStorage.getItem('userName'), senderRole: 'HOD', content: msgContent });
      successToast("Message Sent!"); setMsgContent(''); fetchHubIntel();
    } catch (err) { errorAlert("Failed", "Transmission error."); }
  };

  const isDarkModeView = ['optimizer_hub', 'optimizer_results', 'scanner', 'scanner_results', 'broadcast', 'monitor', 'personnel'].includes(view);

  return (
    <div className={`h-[calc(100vh-80px)] overflow-y-auto flex flex-col p-3 md:p-6 transition-colors duration-500 font-['Outfit'] bg-[#f8fafc] text-slate-800`}>
      
      {/* 🚀 AI GENERATION OVERLAY */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[500] bg-[#0a0a0c]/95 backdrop-blur-md flex flex-col items-center justify-center text-white text-center px-4">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="w-16 h-16 md:w-24 md:h-24 border-t-2 border-red-600 rounded-full flex items-center justify-center mb-6 shadow-2xl bg-red-900/10">
               <Brain size={32} className="text-red-500 animate-pulse md:w-10 md:h-10"/>
            </motion.div>
            <h1 className="text-xs md:text-base font-black uppercase italic tracking-[0.4em] text-red-500 pr-4">{genStep < aiSteps.length ? aiSteps[genStep] : 'Finalizing Matrix'}...</h1>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        
        {/* --- MAIN HUB VIEW --- */}
        {view === 'main' && (
          <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col gap-4 md:gap-6 max-w-7xl mx-auto w-full">
            <div className="bg-[#0a0a0c] p-4 md:p-6 rounded-2xl md:rounded-3xl text-white flex flex-col sm:flex-row items-center justify-between border border-slate-800 gap-4 shadow-xl">
                <div className="flex items-center gap-4 md:gap-6 text-left w-full sm:w-auto">
                    <div className="bg-red-600/20 p-3 md:p-4 rounded-xl md:rounded-2xl border border-red-600/30 text-red-500 flex-shrink-0"><Cpu size={24}/></div>
                    <div className="overflow-hidden">
                      <h1 className="text-xs md:text-sm font-black uppercase italic tracking-widest leading-none pr-4">Dashboard</h1>
                      <p className="text-[8px] md:text-[9px] text-slate-400 font-bold uppercase mt-1 md:mt-2 tracking-widest italic flex items-center gap-2 truncate pr-4"><TrendingUp size={10} className="text-emerald-500"/> System Active</p>
                    </div>
                </div>
                <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                  <div className="bg-white/5 px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl border border-white/10 text-center flex-1 sm:flex-none sm:min-w-[120px]">
                      <p className="text-[7px] md:text-[8px] font-black text-red-500 uppercase italic pr-2">Utilization</p>
                      <p className="text-lg md:text-2xl font-black italic pr-2">{analytics.util}%</p>
                  </div>
                  <RefreshCw className="text-slate-500 hover:rotate-180 transition-all cursor-pointer flex-shrink-0" size={18} onClick={fetchHubIntel}/>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 pb-10 text-left">
                <div onClick={() => setView('personnel')} className="bg-orange-600 p-6 md:p-8 rounded-2xl md:rounded-3xl text-white shadow-xl flex justify-between items-center cursor-pointer transition-all hover:scale-[1.02]">
                    <div className="overflow-hidden"><h1 className="text-xs md:text-sm font-black uppercase italic truncate pr-4">Faculty Record</h1><p className="text-[9px] md:text-[10px] font-bold opacity-60 pr-4">Manage Workload</p></div>
                    <Briefcase size={24} className="flex-shrink-0"/>
                </div>
                <div onClick={() => setView('optimizer_hub')} className="bg-red-600 p-6 md:p-8 rounded-2xl md:rounded-3xl text-white shadow-xl flex justify-between items-center cursor-pointer transition-all hover:scale-[1.02]">
                    <div className="overflow-hidden"><h1 className="text-xs md:text-sm font-black uppercase italic truncate pr-4">Timetable Generator</h1><p className="text-[9px] md:text-[10px] font-bold opacity-60 pr-4">Execute AI</p></div>
                    <Wand2 size={24} className="flex-shrink-0"/>
                </div>
                <div onClick={() => setView('scanner')} className="bg-blue-600 p-6 md:p-8 rounded-2xl md:rounded-3xl text-white shadow-xl flex justify-between items-center cursor-pointer transition-all hover:scale-[1.02]">
                    <div className="overflow-hidden"><h1 className="text-xs md:text-sm font-black uppercase italic truncate pr-4">Search Class Room</h1><p className="text-[9px] md:text-[10px] font-bold opacity-60 pr-4">Room Search</p></div>
                    <Building2 size={24} className="flex-shrink-0"/>
                </div>
                <div onClick={() => setView('monitor')} className="bg-[#0f172a] p-6 md:p-8 rounded-2xl md:rounded-3xl text-white shadow-xl flex justify-between items-center cursor-pointer transition-all hover:scale-[1.02]">
                    <div className="overflow-hidden"><h1 className="text-xs md:text-sm font-black uppercase italic truncate pr-4">All Schedules</h1><p className="text-[9px] md:text-[10px] font-bold opacity-60 pr-4">View Timetable</p></div>
                    <Activity size={24} className="flex-shrink-0"/>
                </div>
            </div>
          </motion.div>
        )}

        {/* --- PERSONNEL VIEW --- */}
        {view === 'personnel' && (
          <motion.div key="personnel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6 w-full max-w-7xl mx-auto py-2">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 border-b border-slate-200 pb-4">
                <button onClick={() => setView('main')} className="w-full sm:w-auto flex items-center justify-center gap-2 text-slate-400 hover:text-red-500 font-black uppercase text-[10px] tracking-widest transition-all pr-2"><ArrowLeft size={16}/> Back</button>
                <div className="relative w-full sm:w-72">
                   <Search className="absolute left-3 top-2.5 text-slate-400" size={14}/>
                   <input type="text" placeholder="Search Faculty..." className="w-full bg-white border border-slate-200 p-2 pl-10 rounded-xl text-xs outline-none focus:border-red-600 text-slate-800 shadow-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
             </div>
             <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 text-left px-1">
                {filteredFaculties.map(f => (
                  <div key={f._id} className="bg-[#0a0a0c] border border-slate-800 p-4 md:p-6 rounded-2xl md:rounded-[2rem] relative group hover:border-red-600 transition-all overflow-hidden shadow-2xl">
                     <div className="flex justify-between items-start mb-4">
                        <div className="p-2 md:p-3 bg-red-600/20 rounded-xl text-red-500 flex-shrink-0"><UserIcon size={18}/></div>
                        <span className="text-[6px] md:text-[9px] font-black uppercase bg-white/5 px-2 md:px-3 py-1 rounded-full text-slate-500 truncate ml-2 pr-2">{f.department}</span>
                     </div>
                     <h3 className="text-xs md:text-lg font-black uppercase italic text-white truncate pr-4">{f.name}</h3>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {f.expertise?.slice(0, 3).map((exp, i) => (
                          <span key={i} className="text-[7px] font-bold bg-white/10 text-slate-300 px-1.5 py-0.5 rounded uppercase">{exp}</span>
                        ))}
                      </div>
                      <p className="text-[8px] md:text-[10px] font-bold text-slate-500 uppercase mt-2 italic truncate pr-4">{f.role}</p>
                     <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-white/5 flex justify-between items-center">
                        <div className="text-left overflow-hidden"><p className="text-[6px] md:text-[8px] font-black text-slate-600 uppercase pr-1">Max</p><p className="text-[10px] md:text-sm font-black italic text-white pr-2">{f.maxWorkload}h</p></div>
                        <div className="text-right overflow-hidden"><p className="text-[6px] md:text-[8px] font-black text-slate-600 uppercase pr-1">Buffer</p><p className="text-[10px] md:text-sm font-black italic text-white pr-2">{f.avgLeaves}d</p></div>
                     </div>
                  </div>
                ))}
             </div>
          </motion.div>
        )}

        {/* --- OPTIMIZER HUB --- */}
        {view === 'optimizer_hub' && (
          <motion.div key="optimizer" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center w-full max-w-4xl mx-auto py-4">
             <div className="bg-[#0a0a0c] p-6 md:p-10 rounded-3xl md:rounded-[3rem] text-center relative border border-slate-800 shadow-2xl w-full">
                <button onClick={() => setView('main')} className="absolute top-4 left-4 border border-slate-700 text-slate-400 px-3 py-1.5 md:px-5 md:py-2 rounded-xl font-black uppercase text-[8px] md:text-[10px] tracking-widest transition-all hover:bg-slate-800 flex items-center gap-2">
                   <ArrowLeft size={14}/> BACK
                </button>
                <Settings2 size={32} className="text-red-600 mx-auto mb-4 md:mb-6 mt-6"/>
                <h1 className="text-lg md:text-2xl font-black uppercase italic tracking-widest mb-6 md:mb-10 text-white pr-4">AI Engine Parameters</h1>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 text-left mb-8">
                    <div className="space-y-2">
                        <label className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic ml-2 pr-4">For Batch</label>
                        <select className="w-full p-4 md:p-5 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl text-white outline-none focus:border-red-600 font-black shadow-sm text-xs" 
                                value={params.batchId} 
                                onChange={e => setParams({...params, batchId: e.target.value, fixedSlots: {}})}>
                            <option value="all" className='bg-black'>ALL BATCH</option>
                            {batches.map(b => <option key={b._id} value={b._id} className='bg-black'>{b.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic ml-2 pr-4">Daily Max Class</label>
                        <input type="number" className="w-full p-4 md:p-5 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl text-white outline-none focus:border-red-600 font-black shadow-sm text-xs" 
                               value={params.maxLoad} onChange={e => setParams({...params, maxLoad: e.target.value})} />
                    </div>

                    <AnimatePresence>
                      {params.batchId !== 'all' && selectedBatchSubjects.length > 0 && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} 
                                    className="col-span-1 md:col-span-2 space-y-4 bg-white/5 p-4 md:p-6 rounded-2xl border border-white/10 text-left overflow-hidden">
                          <h4 className="text-[8px] md:text-[10px] font-black uppercase italic text-red-600 tracking-widest flex items-center gap-2 pr-4">
                            <LayoutGrid size={14}/> Fixed Subject Slots (Optional)
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {selectedBatchSubjects.map((sub, idx) => (
                              <div key={idx} className="flex flex-col gap-2 p-3 bg-white/[0.03] border border-white/5 rounded-xl transition-all hover:border-red-600">
                                <label className="text-[7px] md:text-[9px] font-black text-slate-300 uppercase truncate pr-2">
                                  {sub.name} <span className="text-slate-600 text-[6px]">({sub.code})</span>
                                </label>
                                <select 
                                  className="p-2 bg-black border border-white/10 rounded-lg text-[9px] md:text-[11px] font-black outline-none focus:border-red-600 text-white"
                                  value={params.fixedSlots[sub.name] || 'none'}
                                  onChange={(e) => setParams({
                                    ...params, 
                                    fixedSlots: {...params.fixedSlots, [sub.name]: e.target.value}
                                  })}
                                >
                                  <option value="none" className="bg-black">ANY TIME</option>
                                  {timeSlots.map(slot => (
                                    <option key={slot} value={slot} className="bg-black">{slot}</option>
                                  ))}
                                </select>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="space-y-2 col-span-1 md:col-span-2">
                        <label className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic ml-2 pr-4">Leave Handling</label>
                        <select className="w-full p-4 md:p-5 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl text-white outline-none focus:border-red-600 font-black shadow-sm text-xs" 
                                value={params.leaveBuffer} onChange={e => setParams({...params, leaveBuffer: e.target.value === 'true'})}>
                            <option value={true} className='bg-black'>Flexible Scheduling</option>
                            <option value={false} className='bg-black'>Fixed Schedule</option>
                        </select>
                    </div>
                </div>
                <button onClick={executeNeuralEngine} className="w-full md:w-auto bg-red-600 hover:bg-red-700 py-4 md:py-6 px-10 rounded-xl md:rounded-2xl text-[9px] md:text-[11px] font-black uppercase text-white transition-all italic flex items-center justify-center gap-3 mx-auto shadow-xl">
                  <Wand2 size={18}/> Generate Timetable
                </button>
             </div>
          </motion.div>
        )}

        {/* --- OPTIMIZER RESULTS --- */}
        {view === 'optimizer_results' && (
          <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="h-full flex flex-col gap-4 md:gap-6 w-full max-w-7xl mx-auto">
             <div className="bg-white rounded-2xl md:rounded-3xl border border-slate-200 shadow-2xl p-4 md:p-8 flex flex-col flex-1 overflow-hidden">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-slate-100 pb-6 mb-6">
                    <div className="text-left w-full lg:w-auto">
                        <button onClick={() => setView('optimizer_hub')} className="text-slate-500 hover:text-red-500 flex items-center gap-2 font-black uppercase text-[8px] tracking-widest mb-2 pr-2"><ArrowLeft size={12}/> Reset Params</button>
                        <h1 className="text-sm md:text-lg font-black uppercase italic tracking-widest flex items-center gap-3 text-slate-800 truncate pr-4"> <Brain className="text-red-600 flex-shrink-0" size={20}/> Timetable Option 0{activeVariantIndex + 1}</h1>
                    </div>
                    <div className="flex items-center justify-between lg:justify-end w-full lg:w-auto gap-4 md:gap-6">
                        <div className="text-left md:text-right flex-shrink-0"><p className="text-[7px] md:text-[10px] font-black text-emerald-600 uppercase italic pr-2">Utilization</p><p className="text-xl md:text-3xl font-black text-slate-800 italic pr-4">{variants[activeVariantIndex]?.utilizationScore || '0%'}</p></div>
                        <button onClick={handleApproveVariant} className="flex-1 lg:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-4 md:px-8 py-3 md:py-4 rounded-xl text-[8px] md:text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 italic"><CheckCircle2 size={16}/> Approve</button>
                    </div>
                </div>

                <div className="flex gap-2 md:gap-3 mb-6 overflow-x-auto pb-2 custom-scroll-dark">
                    {variants.map((v, i) => (
                        <button key={i} onClick={() => setActiveVariantIndex(i)} className={`px-4 md:px-8 py-2 md:py-3 rounded-lg text-[8px] md:text-[10px] font-black uppercase transition-all whitespace-nowrap flex-shrink-0 ${activeVariantIndex === i ? 'bg-[#0a0a0c] text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>Variant 0{i+1}</button>
                    ))}
                </div>

                <div className="flex-1 overflow-x-auto bg-[#121214] rounded-xl border border-slate-800 p-2 md:p-4">
                    <div className="grid grid-cols-7 gap-1 md:gap-3 min-w-[700px] md:min-w-[800px]">
                        <div className="col-span-1 space-y-1 md:space-y-2 pt-8 md:pt-10"> 
                            {timeSlots.map(s => <div key={s} className="h-12 md:h-16 flex items-center justify-end pr-2 md:pr-4 text-[6px] md:text-[9px] font-black text-slate-500 border-r border-slate-800 uppercase italic truncate pr-4"><Clock size={10} className="mr-1 text-red-500/50"/> {s.split(' - ')[0]}</div>)} 
                        </div>
                        {days.map(d => ( 
                            <div key={d} className="col-span-1 space-y-1 md:space-y-2 text-center"> 
                                <h1 className="text-[7px] md:text-[10px] font-black uppercase italic tracking-widest text-white pb-2 md:pb-4 border-b border-slate-800 mb-1 md:mb-2 pr-2">{d.slice(0,3)}</h1> 
                                {timeSlots.map((s, i) => {
                                    const session = variants[activeVariantIndex]?.schedule.find(cs => cs.day === d && cs.timeSlot === s);
                                    return (
                                        <div key={i} className={`h-12 md:h-16 rounded-lg border flex flex-col items-center justify-center p-1 md:p-2 shadow-sm overflow-hidden ${session ? 'bg-red-600/10 border-red-500/40 opacity-100' : 'bg-[#1a1a1f] border-slate-800 opacity-20'}`}>
                                            {session ? ( <> <p className="text-[6px] md:text-[9px] font-black text-white uppercase italic truncate w-full px-1 pr-2">{session.subject}</p> <span className="text-[5px] md:text-[8px] text-red-400 font-bold pr-2">R-{session.room}</span> <div className="mt-0.5 flex items-center gap-1 text-[5px] text-slate-500 uppercase font-black truncate w-full justify-center pr-1"> <UserIcon size={6}/> {session.facultyName.split(' ')[0]} </div> </> ) : ( <span className="text-[6px] md:text-[8px] font-black text-white/5 italic uppercase pr-2">VOID</span> )}
                                        </div>
                                    )
                                })} 
                            </div> 
                        ))}
                    </div>
                </div>
             </div>
          </motion.div>
        )}

        {/* --- MONITOR VIEW --- */}
        {view === 'monitor' && (
          <motion.div key="monitor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-7xl mx-auto space-y-6 md:space-y-8">
             <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4 border-b border-slate-200 pb-6">
                <button onClick={() => setView('main')} className="flex items-center gap-2 border border-slate-200 text-slate-600 px-3 md:px-5 py-2 rounded-xl font-black uppercase text-[8px] md:text-[10px] tracking-widest transition-all hover:bg-white shadow-sm pr-2"><ArrowLeft size={14}/> BACK</button>
                <h2 className="text-[10px] md:sm font-black uppercase italic tracking-tighter text-red-600 border border-red-100 bg-red-50 px-4 md:px-6 py-2 rounded-xl flex items-center gap-3 shadow-sm truncate w-full lg:w-auto justify-center pr-4">Official Timetable <Activity size={16} className="text-red-500 animate-pulse flex-shrink-0"/></h2>
                {currentSchedule.length > 0 && <button onClick={handlePurgeEntireMatrix} className="w-full lg:w-auto bg-red-600 hover:bg-red-700 text-white px-4 py-2 md:py-3 rounded-xl text-[8px] font-black uppercase transition-all flex items-center justify-center gap-2 italic shadow-lg active:scale-95 pr-2"><Trash2 size={16}/>Remove All Timetable</button>}
             </div>

             <div className="space-y-8 md:space-y-12">
                {Object.keys(groupedSchedule).length === 0 ? (
                    <div className="py-20 md:py-32 text-center opacity-40 flex flex-col items-center gap-4 text-slate-400 bg-white rounded-2xl md:rounded-[3rem] border-2 border-dashed shadow-sm mx-2"><Activity size={48} className="md:w-16 md:h-16"/><p className="text-[10px] font-black uppercase tracking-widest italic pr-4">No Timetable found</p></div>
                ) : (
                    Object.keys(groupedSchedule).map((batchName, idx) => {
                       const batchClasses = groupedSchedule[batchName];
                       return (
                           <div key={idx} id={`timetable-${batchName}`} className="bg-white border border-slate-200 rounded-2xl md:rounded-[3rem] p-4 md:p-8 shadow-xl mx-2">
                               <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6 border-l-4 border-red-600 pl-4">
                                   <div className="flex items-center gap-3">
                                      <LayoutGrid className="text-red-500" size={20}/><h3 className="text-sm md:text-xl font-black uppercase italic text-slate-800 tracking-tighter truncate pr-6">BATCH: {batchName}</h3>
                                   </div>
                                   <div className="flex items-center justify-between w-full sm:w-auto gap-3">
                                      <span className="bg-slate-100 text-slate-500 px-2 md:px-3 py-1 text-[8px] md:text-[10px] font-black uppercase rounded-lg pr-2">{batchClasses.length} Class</span>
                                      <div className="flex gap-2">
                                          <button onClick={() => handleDownloadTimetable(batchName)} className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 shadow-sm hover:bg-emerald-600 hover:text-white transition-all"><Download size={14} /></button>
                                          <button onClick={() => handlePurgeBatch(batchName, batchClasses)} className="p-2 bg-red-50 text-red-600 rounded-xl border border-red-100 shadow-sm hover:bg-red-600 hover:text-white transition-all"><Trash2 size={14} /></button>
                                      </div>
                                   </div>
                               </div>
                               <div className="overflow-x-auto bg-[#121214] rounded-xl border border-slate-800 p-3 md:p-6 shadow-2xl custom-scroll-dark">
                                   <div className="grid grid-cols-7 gap-1 md:gap-3 min-w-[700px] md:min-w-[800px]">
                                       <div className="col-span-1 space-y-1 md:space-y-2 pt-8 md:pt-10"> 
                                           {timeSlots.map(s => <div key={s} className="h-12 md:h-16 flex items-center justify-end pr-2 md:pr-4 text-[6px] md:text-[9px] font-black text-slate-500 border-r border-slate-800 uppercase italic truncate pr-4"><Clock size={10} className="mr-1 text-red-500/50"/> {s.split(' - ')[0]}</div>)} 
                                       </div>
                                       {days.map(d => ( 
                                           <div key={d} className="col-span-1 space-y-1 md:space-y-2 text-center"> 
                                               <h1 className="text-[7px] md:text-[10px] font-black uppercase italic tracking-widest text-white pb-2 md:pb-4 border-b border-slate-800 mb-1 md:mb-2 pr-2">{d.slice(0,3)}</h1> 
                                               {timeSlots.map((s, i) => {
                                                   const session = batchClasses.find(cs => cs.day === d && cs.timeSlot === s);
                                                   return (
                                                       <div key={i} className={`h-12 md:h-16 rounded-lg border flex flex-col items-center justify-center p-1 md:p-2 shadow-sm relative group transition-all overflow-hidden ${session ? 'bg-red-600/10 border-red-500/40 opacity-100 hover:border-red-500' : 'bg-[#1a1a1f] border-slate-800 opacity-20'}`}>
                                                           {session ? ( 
                                                               <><p className="text-[6px] md:text-[9px] font-black text-white uppercase italic truncate w-full px-1 pr-2">{session.subject}</p> <span className="text-[5px] md:text-[8px] text-red-400 font-bold pr-2">R-{session.room}</span><div className="mt-0.5 flex items-center gap-1 text-[5px] text-slate-500 uppercase font-black truncate w-full justify-center pr-1"><UserIcon size={6}/> {session.facultyName?.split(' ')[0] || (session.faculty ? session.faculty.name.split(' ')[0] : 'Expert')}</div><button onClick={() => handlePurgeNode(session._id)} className="absolute -top-1 -right-1 bg-red-600 text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-xl"><Trash2 size={10}/></button></> 
                                                           ) : ( <span className="text-[6px] md:text-[8px] font-black text-white/5 italic uppercase pr-2">VOID</span> )}
                                                       </div>
                                                   )
                                               })} 
                                           </div> 
                                       ))}
                                   </div>
                               </div>
                           </div>
                       );
                    })
                )}
             </div>
          </motion.div>
        )}

        {/* --- SCANNER VIEW --- */}
        {view === 'scanner' && (
          <motion.div key="scanner" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-xl mx-auto w-full pt-4 relative px-2">
             <button onClick={() => setView('main')} className="absolute top-2 left-2 text-slate-400 hover:text-blue-500 flex items-center gap-2 font-black uppercase text-[10px] tracking-widest transition-all mb-4"><ArrowLeft size={16}/> Back</button>
             <div className="bg-white p-6 md:p-10 rounded-2xl md:rounded-[3rem] border border-slate-200 shadow-2xl text-center mt-10">
                <Building2 className="mx-auto mb-4 md:mb-6 text-blue-600" size={32}/>
                <h2 className="text-lg md:text-2xl font-black uppercase italic tracking-widest mb-6 md:mb-10 text-slate-800 pr-4">Room Scanner</h2>
                <div className="space-y-4 md:space-y-6 mb-8 md:mb-10 text-left">
                   <div className="space-y-2"><label className="text-[8px] md:text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest pr-2">Select Day</label><select className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl outline-none focus:border-blue-600 font-black text-slate-800 text-xs" value={query.day} onChange={e => setQuery({...query, day: e.target.value})}>{days.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                   <div className="space-y-2"><label className="text-[8px] md:text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest pr-2">Time Slot</label><select className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl outline-none focus:border-blue-600 font-black text-slate-800 text-xs" value={query.timeSlot} onChange={e => setQuery({...query, timeSlot: e.target.value})}>{timeSlots.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                </div>
                <button onClick={findRooms} className="w-full bg-blue-600 py-4 rounded-xl font-black uppercase italic tracking-widest shadow-xl shadow-blue-200 text-white text-[10px]">Find Room</button>
             </div>
          </motion.div>
        )}

        {/* --- SCANNER RESULTS --- */}
        {view === 'scanner_results' && (
  <motion.div 
    key="scanner_res" 
    initial={{ opacity: 0, y: 20 }} 
    animate={{ opacity: 1, y: 0 }} 
    exit={{ opacity: 0, y: -20 }} 
    className="w-full max-w-6xl mx-auto space-y-6 md:space-y-8 px-2 py-4"
  >
     {/* HEADER: Reset & Count */}
     <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <button 
          onClick={() => setView('scanner')} 
          className="w-full sm:w-auto flex items-center justify-center gap-2 text-slate-400 hover:text-blue-500 font-black uppercase text-[10px] tracking-widest transition-all pr-2"
        >
           <ArrowLeft size={16}/> RESET SCANNER
        </button>
        <p className="text-[10px] font-black uppercase italic tracking-[0.2em] text-blue-600 pr-6">
          {availableRooms.length} Available Nodes Found
        </p>
     </div>

     {/* GRID: Room Cards */}
     <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-10">
        {availableRooms.map(r => {
          // Logic: Check if it's a lab
          const isLab = r.type?.toLowerCase().includes('lab') || r.type?.toLowerCase().includes('practical');

          return (
            <motion.div 
              key={r.roomNumber}
              whileHover={{ y: -5 }}
              className="bg-[#0a0a0c] border border-slate-800 p-5 md:p-6 rounded-[2.5rem] text-center hover:border-blue-500 transition-all text-white shadow-2xl overflow-hidden relative group flex flex-col justify-between min-h-[180px]"
            >
                <div>
                  <p className="text-[7px] md:text-[8px] font-black text-slate-500 uppercase mb-3 tracking-[0.2em] italic pr-2">
                    Infrastructure Unit
                  </p>
                  
                  {/* Room Number - pr-6 added to fix Italics clipping (X, 1, Y, etc.) */}
                  <h3 className="text-xl md:text-2xl font-black italic text-white pr-6 leading-none tracking-tighter">
                    R-{r.roomNumber}
                  </h3>
                  
                  {/* Dynamic Room Type Badge */}
                  <div className="flex justify-center mt-4">
                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase italic tracking-wider border ${
                      isLab 
                      ? 'bg-purple-600/10 text-purple-400 border-purple-500/30' 
                      : 'bg-emerald-600/10 text-emerald-400 border-emerald-500/30'
                    }`}>
                      {isLab ? 'Practical Lab' : 'Theory Room'}
                    </span>
                  </div>
                </div>

                {/* Capacity Footer */}
                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-center gap-2">
                  <div className="bg-blue-600/20 p-1.5 rounded-lg">
                    <UserIcon size={12} className="text-blue-500"/>
                  </div>
                  <p className="text-[10px] font-black uppercase text-slate-300 pr-2 tracking-widest">
                      CAP: {r.capacity}
                  </p>
                </div>

                {/* Cyber Decorative Element */}
                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 blur-2xl rounded-full -mr-8 -mt-8" />
                <div className="absolute inset-0 bg-blue-500 opacity-0 group-hover:opacity-[0.03] transition-opacity pointer-events-none" />
            </motion.div>
          );
        })}
     </div>
  </motion.div>
)}

        {/* --- BROADCAST VIEW --- */}
        {view === 'broadcast' && (
          <motion.div key="broadcast" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="h-full flex flex-col gap-6 max-w-7xl mx-auto w-full text-slate-800 px-2">
             <div className="flex justify-between items-center bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm">
                <button onClick={() => setView('main')} className="flex items-center gap-2 text-slate-400 hover:text-red-500 font-black uppercase text-[10px] tracking-widest transition-all pr-2"><ArrowLeft size={16}/> HUB</button>
                <h1 className="text-[8px] md:text-xs font-black uppercase italic tracking-widest flex items-center gap-2 truncate text-slate-600 pr-4"><Globe size={16} className="text-red-600 flex-shrink-0"/> Transmission Terminal</h1>
                <X size={20} className="text-slate-500 hover:text-red-500 cursor-pointer flex-shrink-0" onClick={() => setView('main')}/>
             </div>
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2 text-left">
                <div className="bg-[#0a0a0c] p-6 md:p-10 rounded-2xl md:rounded-3xl border border-slate-800 text-center shadow-2xl">
                    <Megaphone className="text-red-600 animate-bounce mb-4 mx-auto" size={32}/><textarea className="w-full p-4 md:p-6 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl text-[10px] md:text-xs outline-none h-32 md:h-40 text-red-500 font-bold" placeholder="Transmit data..." value={msgContent} onChange={e => setMsgContent(e.target.value)} /><button onClick={sendBroadcast} className="w-full bg-red-600 py-4 rounded-xl text-[10px] font-black uppercase mt-4 flex items-center justify-center gap-3 italic text-white"><Send size={16}/> Dispatch</button>
                </div>
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 md:p-8 overflow-y-auto max-h-[400px] md:max-h-[500px] shadow-xl space-y-4">
                    <h2 className="text-[10px] md:text-xs font-black uppercase italic border-b border-slate-100 pb-4 flex items-center gap-2 text-slate-400 pr-4"><History size={16} className="text-red-600"/> Signal Registry</h2>
                    {messages.map((m, i) => (
                      <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center group hover:border-red-600/30 transition-all">
                         <div className="overflow-hidden"><p className="text-[8px] md:text-[10px] font-black text-red-600 uppercase italic truncate leading-none mb-1 pr-2">{m.senderName}</p><p className="text-[10px] md:text-xs font-bold text-slate-600 truncate pr-4">{m.content}</p></div>
                         <Trash2 size={16} className="text-slate-300 hover:text-red-500 cursor-pointer transition-colors ml-4 flex-shrink-0" onClick={() => API.delete(`/messages/${m._id}`).then(fetchHubIntel)} />
                      </div>
                    ))}
                </div>
             </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};

export default HODDashboard;