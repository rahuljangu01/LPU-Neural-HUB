import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Trash2, UserPlus, Building2, Plus, User as UserIcon, Cpu, Search, 
  ShieldCheck, BookOpen, Briefcase, Zap, 
  GraduationCap, ChevronRight,
  LayoutGrid, Mail, RefreshCcw,
  CheckCircle2, Send, Signal, History, X, ArrowLeft, UserPlus2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../services/api';
import { successToast, errorAlert, confirmDialog } from '../services/alertService';

const AdminDashboard = () => {
  const location = useLocation();
  const path = location.pathname;
  const [loading, setLoading] = useState(false);

  /**
   * ============================================================
   * 🛠️ ENTITY STATES & FORM DATA
   * ============================================================
   */
  const [room, setRoom] = useState({ roomNumber: '', capacity: '', block: 'Main', type: 'Theory' });
  const [subject, setSubject] = useState({ name: '', code: '', weeklyHours: 4, type: 'Theory', department: 'MCA' });
  const [batch, setBatch] = useState({ name: '', studentCount: 60, semester: 1, department: 'MCA', subjects:[] });
  const [signal, setSignal] = useState('');
  
  const [teacherSearch, setTeacherSearch] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState(null); 
  const [viewingUser, setViewingUser] = useState(null); 
  const [viewBatchDetails, setViewBatchDetails] = useState(null); 
  const [batchStudentSearch, setBatchStudentSearch] = useState(''); 
  
  /**
   * ============================================================
   * 📊 DATA LISTS & ANALYTICS STATES
   * ============================================================
   */
  const [stats, setStats] = useState({ users: 0, rooms: 0, subjects: 0, batches: 0, students: 0, signals: 0 });
  const [allUsers, setAllUsers] = useState([]); 
  const [userList, setUserList] = useState([]); 
  const [studentList, setStudentList] = useState([]); 
  const [roomList, setRoomList] = useState([]);
  const [subjectList, setSubjectList] = useState([]);
  const [batchList, setBatchList] = useState([]);
  const [messages, setMessages] = useState([]);

  /**
   * ============================================================
   * 📡 DATA SYNCHRONIZATION (FETCH ALL)
   * ============================================================
   */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [u, r, s, b, m] = await Promise.all([
        API.get('/auth/users').catch(() => ({data:[]})),
        API.get('/rooms').catch(() => ({data:[]})),
        API.get('/subjects').catch(() => ({data:[]})),
        API.get('/batches').catch(() => ({data:[]})),
        API.get('/messages').catch(() => ({data:[]}))
      ]);

      const teachers = u.data.filter(user => user.role?.toLowerCase() !== 'student' && user.role?.toLowerCase() !== 'admin');
      const students = u.data.filter(user => user.role?.toLowerCase() === 'student');

      setAllUsers(u.data);
      setUserList(teachers);
      setStudentList(students);
      setRoomList(r.data);
      setSubjectList(s.data);
      setBatchList(b.data ||[]);
      setMessages(m.data);
      
      setStats({ 
        users: teachers.length, rooms: r.data.length, subjects: s.data.length, 
        batches: b.data?.length || 0, students: students.length, signals: m.data.length
      });
    } catch (err) { 
      console.error("Sync Failure"); 
      errorAlert("Network Error", "Identity Hub could not be reached.");
    } finally { 
      setLoading(false); 
    }
  }, []);

  useEffect(() => { 
    setViewingUser(null);
    setViewBatchDetails(null);
    fetchData(); 
  },[fetchData, path]);

  /**
   * ============================================================
   * ⚡ ACTION HANDLERS (LOGIC)
   * ============================================================
   */
  
  // 1. Create New Node (Room/Subject/Batch)
  const handleCreate = async (type, data, resetter) => {
    try {
      const endpoint = type === 'batch' ? '/batches' : `/${type}s`;
      await API.post(endpoint, data);
      successToast(`${type.toUpperCase()} Integrated Successfully!`);
      fetchData(); 
      resetter();
    } catch (err) { 
      errorAlert("Conflict", "Node identity already exists in registry."); 
    }
  };

  // 2. Update User (Faculty Expertise/Leaves)
  const handleUpdateUserNode = async (userId, updateData) => {
    try {
        await API.post(`/auth/update-expertise`, { userId, ...updateData });
        successToast("Updated!");
        fetchData(); 
        setSelectedTeacher(null); 
        setViewingUser(null);
    } catch (err) { 
      errorAlert("Error", "Manual update sequence failed."); 
    }
  };

  // 3. Toggle Subject Expertise (Teacher Matrix)
  const toggleTeacherExpertise = (user, subName) => {
    const currentExpertise = user.expertise || [];
    const updated = currentExpertise.includes(subName)
      ? currentExpertise.filter(item => item !== subName)
      : [...currentExpertise, subName];
    setSelectedTeacher({ ...user, expertise: updated });
  };

  // 4. Update Batch Configuration
  const handleBatchUpdate = async (batchId, updatedData) => {
    try {
        await API.put(`/batches/${batchId}`, updatedData);
        successToast("Updated!");
        fetchData();
        const res = await API.get('/batches');
        const updatedBatch = res.data.find(b => b._id === batchId);
        setViewBatchDetails(updatedBatch);
    } catch (err) { 
      errorAlert("Error", "Update sequence failed."); 
    }
  };

  // 5. Assign/Remove Student from Batch
  const assignStudentToBatch = async (userId, batchName) => {
    const student = studentList.find(s => s._id === userId);
    if (batchName !== '' && student.batch && student.batch !== '' && student.batch !== batchName) {
        errorAlert("Conflict Detected", `This Student is already assigned to Batch: ${student.batch}.`);
        return;
    }
    try {
        await API.post(`/auth/update-expertise`, { userId, batch: batchName });
        successToast("Personnel Integrated");
        fetchData();
    } catch (err) { 
      errorAlert("Error", "Identity migration failed."); 
    }
  };

  // 🎯 FIX: handleSendSignal DEFINITION ADDED
  const handleSendSignal = async (e) => {
    if (e) e.preventDefault();
    if (!signal.trim()) return;
    try {
      await API.post('/messages', { 
        senderName: localStorage.getItem('userName'), 
        senderRole: 'ADMIN', 
        content: signal 
      });
      successToast("Message Sent!");
      setSignal(''); 
      fetchData();
    } catch (err) { 
      errorAlert("Fail", "Message failed."); 
    }
  };

  // 7. Delete Node (Purge Logic)
  const handleDelete = async (type, id) => {
    const isPurgeConfirmed = await confirmDialog("Delete?", "This will delete from the system.");
    if (isPurgeConfirmed) {
      try {
        const endpoint = type === 'user' ? `/auth/users/${id}` : type === 'message' ? `/messages/${id}` : type === 'batch' ? `/batches/${id}` : `/${type}s/${id}`;
        await API.delete(endpoint);
        successToast("Deleted from system"); 
        fetchData();
        if(type === 'batch') setViewBatchDetails(null);
      } catch (err) { 
        errorAlert("Error", "Denied by system."); 
      }
    }
  };

  const toggleSubjectInBatch = (subId) => {
    const currentSubs = batch.subjects ||[];
    if (currentSubs.includes(subId)) {
      setBatch({ ...batch, subjects: currentSubs.filter(id => id !== subId) });
    } else {
      setBatch({ ...batch, subjects: [...currentSubs, subId] });
    }
  };

  const filteredTeachers = userList.filter(t => t.name.toLowerCase().includes(teacherSearch.toLowerCase()));

  return (
    <div className="p-3 md:p-6 space-y-6 md:space-y-10 font-['Outfit'] min-h-screen bg-[#f8fafc]">
      
      {/* 🟢 TOP MONITOR (ONLY VISIBLE ON CORE DASHBOARD) */}
      {path === '/admin' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-left pt-12 lg:pt-0">
          {[
            { l: 'Faculties', v: stats.users, i: <Briefcase/>, c: 'bg-red-600' },
            { l: 'Subjects', v: stats.subjects, i: <Cpu/>, c: 'bg-[#0a0a0c]' },
            { l: 'Students', v: stats.students, i: <UserIcon/>, c: 'bg-red-600' },
            { l: 'Class Rooms', v: stats.rooms, i: <LayoutGrid/>, c: 'bg-[#0a0a0c]' }
          ].map((s, i) => (
            <motion.div key={i} initial={{opacity:0, y:-20}} animate={{opacity:1, y:0}} transition={{delay: i*0.1}} 
              className={`${s.c} p-5 md:p-6 rounded-[2rem] md:rounded-[2.5rem] text-white shadow-xl flex justify-between items-center group relative overflow-hidden transition-all hover:scale-[1.03]`}>
              <div className="relative z-10">
                <p className="text-[8px] md:text-[9px] font-black uppercase opacity-40 mb-1 italic">{s.l}</p>
                <p className="text-2xl md:text-4xl font-black italic tracking-tighter">{loading ? '...' : s.v}</p>
              </div>
              <div className="bg-white/10 p-2 md:p-3 rounded-2xl group-hover:rotate-12 transition-transform z-10">{s.i}</div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        
        {/* ================= VIEW 1: CORE DASHBOARD ================= */}
        {path === '/admin' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 text-left">
            <div className="bg-[#0a0a0c] p-6 md:p-8 rounded-[2.5rem] md:rounded-[3rem] text-white border border-white/5 flex flex-col shadow-2xl relative overflow-hidden min-h-[400px]">
                <div className="flex justify-between items-center mb-6"><div className="flex items-center gap-3 border-l-4 border-orange-500 pl-4 uppercase font-black text-[10px] md:text-xs text-orange-500 italic"><UserPlus size={18}/> Teacher Matrix</div><RefreshCcw size={16} className={`cursor-pointer ${loading ? 'animate-spin' : ''}`} onClick={fetchData}/></div>
                {!selectedTeacher ? (
                  <div className="space-y-4">
                    <div className="relative"><Search className="absolute left-4 top-3.5 text-slate-500" size={16}/><input className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-[11px] font-bold text-white outline-none focus:border-orange-500" placeholder="Search Teacher..." value={teacherSearch} onChange={(e) => setTeacherSearch(e.target.value)} /></div>
                    <div className="max-h-[220px] overflow-y-auto space-y-2 custom-scroll pr-2">
                      {filteredTeachers.map(t => (
                        <div key={t._id} onClick={() => setSelectedTeacher(t)} className="p-3 bg-white/5 rounded-xl flex items-center justify-between cursor-pointer hover:bg-orange-600 border border-white/5 transition-all">
                          <div className="flex flex-col text-left overflow-hidden"><span className="text-[10px] font-bold uppercase truncate">{t.name}</span><span className="text-[8px] text-slate-500 italic truncate max-w-[150px] md:max-w-none"><Mail size={10} className="inline mr-1"/>{t.email}</span></div>
                          <ChevronRight size={14}/>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 animate-in zoom-in relative z-10 text-left">
                    <div className="flex justify-between items-center bg-orange-600 p-4 rounded-2xl shadow-lg mb-4">
                        <span className="text-[10px] md:text-[11px] font-black uppercase italic truncate max-w-[80%]">{selectedTeacher.name}</span>
                        <Plus className="rotate-45 cursor-pointer bg-white text-orange-600 rounded-full flex-shrink-0" size={20} onClick={() => setSelectedTeacher(null)}/>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-[8px] font-black uppercase text-slate-500 ml-1">Max Class(Weekly)</label>
                            <input type="number" className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-[10px] text-white outline-none" value={selectedTeacher.maxWorkload || ''} onChange={e => setSelectedTeacher({...selectedTeacher, maxWorkload: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[8px] font-black uppercase text-slate-500 ml-1">Avg Leaves(Monthly)</label>
                            <input type="number" className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-[10px] text-white outline-none" value={selectedTeacher.avgLeaves || ''} onChange={e => setSelectedTeacher({...selectedTeacher, avgLeaves: e.target.value})} />
                        </div>
                        <div className="col-span-2 space-y-2 mt-2">
                           <label className="text-[9px] font-black uppercase text-slate-500 ml-1 italic">Assign Subject</label>
                           <div className="grid grid-cols-2 gap-2 max-h-[140px] overflow-y-auto border border-white/10 p-2 rounded-2xl bg-white/5 custom-scroll">
                                {subjectList.map(sub => (
                                    <label key={sub._id} className={`flex items-center gap-2 p-2 rounded-xl border transition-all cursor-pointer ${selectedTeacher.expertise?.includes(sub.name) ? 'border-orange-500 bg-orange-500/10' : 'border-white/5 bg-white/5'}`}>
                                        <input type="checkbox" className="hidden" checked={selectedTeacher.expertise?.includes(sub.name)} onChange={() => toggleTeacherExpertise(selectedTeacher, sub.name)}/>
                                        <span className={`text-[8px] md:text-[9px] font-bold uppercase truncate ${selectedTeacher.expertise?.includes(sub.name) ? 'text-orange-500 font-black' : 'text-white'}`}>{sub.name}</span>
                                    </label>
                                ))}
                           </div>
                        </div>
                    </div>
                    <button onClick={() => handleUpdateUserNode(selectedTeacher._id, { maxWorkload: selectedTeacher.maxWorkload, avgLeaves: selectedTeacher.avgLeaves, expertise: selectedTeacher.expertise })} className="w-full bg-white text-black py-4 rounded-xl font-black uppercase text-[10px] hover:bg-orange-600 hover:text-white transition-all shadow-xl mt-4"><CheckCircle2 size={12} className="inline mr-2"/>Update</button>
                  </div>
                )}
                <Zap className="absolute -bottom-10 -right-10 text-white/5 opacity-5" size={150}/>
            </div>
            <div className="bg-white p-6 md:p-8 rounded-[2.5rem] md:rounded-[3rem] shadow-xl border flex flex-col items-center justify-center text-center">
                 <ShieldCheck size={48} className="text-red-500 animate-pulse mb-4"/>
                 <h2 className="text-lg md:text-xl font-black uppercase italic tracking-widest text-slate-800 leading-tight">System Ready</h2>
                 <p className="text-[9px] text-slate-400 font-bold mt-4 uppercase tracking-[0.2em]">Admin Control Panel</p>
            </div>
          </motion.div>
        )}

        {/* ================= VIEW 2: PERSONNEL MATRIX (ULTRA COMPACT) ================= */}
       {path === '/admin/users' && (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-[2rem] md:rounded-[4rem] border shadow-2xl overflow-hidden p-4 md:p-10 text-left">
    <div className="flex justify-between items-center mb-8 border-l-4 border-orange-600 pl-4 text-slate-800">
      <h2 className="text-xs md:text-sm font-black uppercase italic pr-4">Personnel Identity Registry</h2>
    </div>

    <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-6">
      {(() => {
        // 🔄 Har role ke liye alag counter set kiya
        const roleCounters = {};

        return allUsers.map((u) => {
          const roleKey = u.role.toLowerCase();
          // Counter ko +1 badhao
          roleCounters[roleKey] = (roleCounters[roleKey] || 0) + 1;

          // 📝 Display Logic: 
          // 1. .split(' ')[0] hata diya taaki agar DB mein "Teacher 1" hai toh pura dikhe.
          // 2. Agar naam sirf "Teacher" ya "Student" hai, toh auto-numbering lag jaye.
          let displayName = u.name;
          const genericNames = ["teacher", "student", "faculty"];
          
          if (genericNames.includes(u.name.toLowerCase())) {
            displayName = `${u.name} ${roleCounters[roleKey]}`;
          }

          return (
            <div 
              key={u._id} 
              onClick={() => u.role !== 'admin' && setViewingUser(u)} 
              className={`p-2 md:p-6 bg-slate-50 border rounded-2xl md:rounded-[2.5rem] flex flex-col items-center gap-2 relative group transition-all hover:border-orange-500 hover:shadow-lg ${u.role !== 'admin' ? 'cursor-pointer' : ''}`}
            >
              <div className="w-8 h-8 md:w-12 md:h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-orange-600 flex-shrink-0">
                <UserIcon size={16}/>
              </div>
              <div className="text-center overflow-hidden w-full px-1">
                {/* 🎯 pr-4 added to fix Italics Clipping */}
                <p className="text-[7px] md:text-xs font-black uppercase italic truncate text-slate-800 pr-4">
                  {displayName}
                </p>
                <p className="text-[6px] md:text-[9px] text-slate-400 font-bold uppercase tracking-tighter truncate pr-2">
                  {u.role}
                </p>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); handleDelete('user', u._id); }} 
                className="absolute -top-1 -right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-md"
              >
                <Trash2 size={10}/>
              </button>
            </div>
          );
        });
      })()}
    </div>
  </motion.div>
)}

        {/* ================= VIEW 3: LOGIC MODULES (SUBJECTS) ================= */}
        {path === '/admin/subjects' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 text-left">
            <div className="bg-white p-6 md:p-8 rounded-[2.5rem] md:rounded-[3rem] shadow-xl border h-fit">
                <h2 className="text-xs md:text-sm font-black uppercase italic mb-8 border-l-4 border-red-600 pl-4 flex items-center gap-3 text-slate-800"><BookOpen size={18} className="text-red-600"/> Subject Integration</h2>
                <form onSubmit={(e) => { e.preventDefault(); handleCreate('subject', subject, () => setSubject({ name: '', code: '', weeklyHours: 4, type: 'Theory', department: 'MCA' })); }} className="space-y-4">
                    <input className="w-full p-4 bg-slate-50 border rounded-2xl text-[11px] font-bold outline-none focus:border-red-500 transition-all" placeholder="Subject Name" value={subject.name} onChange={e => setSubject({...subject, name: e.target.value})} required />
                    <input className="w-full p-4 bg-slate-50 border rounded-2xl text-[11px] font-bold outline-none focus:border-red-500 transition-all" placeholder="Code (e.g. MCA101)" value={subject.code} onChange={e => setSubject({...subject, code: e.target.value})} required />
                    <div className="flex flex-col sm:flex-row gap-4">
                        <input type="number" className="flex-1 p-4 bg-slate-50 border rounded-2xl text-[11px] font-bold outline-none focus:border-red-500 transition-all" placeholder="Hrs/Week" value={subject.weeklyHours} onChange={e => setSubject({...subject, weeklyHours: e.target.value})} required />
                        <select className="flex-1 p-4 bg-slate-50 border rounded-2xl text-[11px] font-bold outline-none" value={subject.type} onChange={e => setSubject({...subject, type: e.target.value})}><option value="Theory">Theory</option><option value="Lab">Lab</option></select>
                    </div>
                    <button type="submit" className="w-full bg-red-600 text-white py-4 md:py-5 rounded-2xl font-black uppercase text-[10px] shadow-lg hover:bg-red-700 active:scale-95 transition-all">Add Subject</button>
                </form>
            </div>
            <div className="bg-[#0a0a0c] p-6 md:p-8 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col">
                <div className="flex justify-between items-center mb-6 text-white border-b border-white/10 pb-4"><span className="text-[10px] font-black uppercase tracking-widest italic">Subject Details</span><RefreshCcw size={14} className="cursor-pointer" onClick={fetchData}/></div>
                <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scroll">
                    {subjectList.map(s => (
                        <div key={s._id} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex justify-between items-center group transition-all hover:bg-red-600/10">
                            <div className="flex flex-col text-left overflow-hidden flex-1"><span className="text-[9px] font-black text-red-500 uppercase tracking-tighter">{s.code}</span><span className="text-[11px] font-bold text-white uppercase italic truncate">{s.name} ({s.weeklyHours}h)</span></div>
                            <button onClick={() => handleDelete('subject', s._id)} className="p-2 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-600 hover:text-white rounded-lg ml-2"><Trash2 size={16}/></button>
                        </div>
                    ))}
                </div>
            </div>
          </motion.div>
        )}

        {/* ================= VIEW 4: BATCH CLUSTERS (RESPONSIVE) ================= */}
{path === '/admin/batches' && (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 md:space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 text-left">
            <div className="bg-white p-6 md:p-8 rounded-[2.5rem] md:rounded-[3rem] shadow-xl border">
                {/* Fixed Clipping for "Add Batch" */}
                <h2 className="text-xs md:text-sm font-black uppercase italic mb-8 border-l-4 border-purple-600 pl-4 text-slate-800 pr-4">Add Batch</h2>
                <form onSubmit={(e) => { e.preventDefault(); handleCreate('batch', batch, () => setBatch({ name: '', studentCount: 60, semester: 1, department: 'MCA', subjects: [] })); }} className="space-y-4 md:space-y-5">
                    <input className="w-full p-4 bg-slate-50 border rounded-2xl text-[11px] font-bold outline-none" placeholder="Batch ID" value={batch.name} onChange={e => setBatch({ ...batch, name: e.target.value })} required />
                    <input type="number" className="w-full p-4 bg-slate-50 border rounded-2xl text-[11px] font-bold outline-none" placeholder="Capacity" value={batch.studentCount} onChange={e => setBatch({ ...batch, studentCount: e.target.value })} required />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[180px] overflow-y-auto border p-3 rounded-2xl bg-slate-50 custom-scroll">
                        {subjectList.map(sub => (
                            <label key={sub._id} className="flex items-center gap-2 p-2 bg-white rounded-xl border cursor-pointer hover:border-purple-500 transition-all">
                                <input type="checkbox" className="w-3.5 h-3.5 accent-purple-600 flex-shrink-0" checked={batch.subjects?.includes(sub._id)} onChange={() => toggleSubjectInBatch(sub._id)} />
                                <span className="text-[9px] font-bold uppercase truncate pr-2 text-slate-700">{sub.name}</span>
                            </label>
                        ))}
                    </div>
                    <button type="submit" className="w-full bg-purple-600 text-white py-4 md:py-5 rounded-2xl font-black uppercase text-[10px] shadow-lg italic pr-2">Add Batch</button>
                </form>
            </div>

            <div className="bg-[#0a0a0c] rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-10 flex flex-col justify-center items-center text-center relative overflow-visible min-h-[300px] shadow-2xl">
                <GraduationCap size={60} className="text-purple-600 animate-bounce mb-6" />
                {/* Fixed Clipping for "Batch Details" */}
                <h2 className="text-xl md:text-2xl font-black uppercase italic text-white tracking-tighter pr-6">Batch Details</h2>
                <div className="mt-8 grid grid-cols-2 sm:grid-cols-2 gap-4 w-full">
                    {batchList.map(b => (
                        /* FIXED: Removed 'truncate' from parent div to allow delete button to show */
                        <div key={b._id} onClick={() => setViewBatchDetails(b)} 
                             className="p-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase text-white hover:bg-white hover:text-black transition-all cursor-pointer relative group overflow-visible flex items-center justify-center">
                            
                            {/* FIXED: Text truncation and padding for italics handled here */}
                            <span className="truncate pr-4 italic">{b.name}</span>

                            <button onClick={(e) => { e.stopPropagation(); handleDelete('batch', b._id) }} 
                                    className="absolute -top-2 -right-2 bg-red-600 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-20 shadow-xl border border-black/20 hover:scale-110">
                                <Trash2 size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        <AnimatePresence>
            {viewBatchDetails && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="bg-white rounded-[2.5rem] md:rounded-[4rem] border shadow-2xl overflow-hidden p-6 md:p-10 text-left">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 border-b pb-6 gap-4 text-slate-800">
                        {/* Fixed Clipping for dynamic Batch ID title */}
                        <h2 className="text-xl md:text-2xl font-black uppercase italic text-purple-600 truncate max-w-[85%] pr-6">Batch ID: {viewBatchDetails.name}</h2>
                        <button onClick={() => setViewBatchDetails(null)} className="flex items-center gap-2 text-slate-400 hover:text-red-500 font-black uppercase text-[9px] tracking-widest transition-all flex-shrink-0 pr-2"><ArrowLeft size={16} /> Back</button>
                    </div>
                    {/* ... rest of the student enrollment part remains same ... */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10">
                        <div className="space-y-6">
                            <div className="bg-slate-50 p-4 md:p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic mb-4 flex items-center gap-2 pr-2"><UserPlus2 size={14}/>Enroll Students</p>
                                {/* ... Enrollment logic ... */}
                                <div className="relative mb-4"><Search className="absolute left-4 top-3.5 text-slate-400" size={16}/><input className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-[11px] font-bold outline-none focus:border-purple-600 text-slate-900" placeholder="Search students..." value={batchStudentSearch} onChange={e => setBatchStudentSearch(e.target.value)} /></div>
                                <div className="max-h-[180px] md:max-h-[200px] overflow-y-auto space-y-2 custom-scroll pr-2">
                                    {studentList.filter(s => s.name.toLowerCase().includes(batchStudentSearch.toLowerCase())).map(s => (
                                        <div key={s._id} className="p-3 bg-white border border-slate-100 rounded-xl flex items-center justify-between group overflow-hidden">
                                            <div className="flex flex-col text-left overflow-hidden">
                                                <span className="text-[10px] font-black uppercase truncate pr-4 text-slate-800 italic">{s.name}</span>
                                                <span className={`text-[8px] font-black uppercase italic pr-2 ${s.batch && s.batch !== viewBatchDetails.name ? 'text-red-500' : 'text-slate-400'}`}>{s.batch ? `LINKED: ${s.batch}` : 'READY'}</span>
                                            </div>
                                            {s.batch === viewBatchDetails.name ? <span className="text-[8px] font-black bg-emerald-100 text-emerald-600 px-2 py-1 rounded-lg pr-2 italic">Assigned</span> : <button onClick={() => assignStudentToBatch(s._id, viewBatchDetails.name)} className="bg-purple-600 text-white p-1.5 rounded-lg hover:bg-orange-600 transition-all flex-shrink-0"><Plus size={14}/></button>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        {/* ... Subjects part ... */}
                        <div className="space-y-6">
                            <div className="bg-purple-50 p-4 md:p-6 rounded-[2rem] border border-purple-100">
                                <p className="text-[10px] font-black uppercase text-purple-600 tracking-widest italic mb-4 flex items-center gap-2 pr-2"><BookOpen size={14}/>Subjects</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[250px] overflow-y-auto pr-2 custom-scroll">
                                    {subjectList.map(sub => {
                                        const isLinked = viewBatchDetails.subjects?.includes(sub._id);
                                        return (
                                            <label key={sub._id} className={`flex items-center gap-2 p-3 rounded-xl border transition-all cursor-pointer ${isLinked ? 'bg-purple-600 border-purple-600 text-white shadow-lg' : 'bg-white border-purple-100 text-slate-700 hover:border-purple-600'}`}>
                                                <input type="checkbox" className="hidden" checked={isLinked} onChange={() => { const updatedSubs = isLinked ? viewBatchDetails.subjects.filter(id => id !== sub._id) : [...(viewBatchDetails.subjects || []), sub._id]; handleBatchUpdate(viewBatchDetails._id, { subjects: updatedSubs }); }} />
                                                <span className="text-[9px] font-black uppercase truncate pr-4 italic">{sub.name}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </motion.div>
)}

        {/* ================= VIEW 5: ROOMS (RESPONSIVE) ================= */}
        {path === '/admin/rooms' && (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 text-left">
            <div className="bg-white p-6 md:p-8 rounded-[2.5rem] md:rounded-[3rem] shadow-xl border h-fit">
                <h2 className="text-xs md:text-sm font-black uppercase italic mb-8 border-l-4 border-emerald-600 pl-4 flex items-center gap-3 text-slate-800"><Building2 size={18} className="text-emerald-600"/> Add Classroom</h2>
                <form onSubmit={(e) => { e.preventDefault(); handleCreate('room', room, () => setRoom({ roomNumber: '', capacity: '', block: 'Main', type: 'Theory' })); }} className="space-y-4">
                    <input className="w-full p-4 bg-slate-50 border rounded-2xl text-[11px] font-bold outline-none focus:border-emerald-600" placeholder="Room No." value={room.roomNumber} onChange={e => setRoom({...room, roomNumber: e.target.value})} required />
                    <input type="number" className="w-full p-4 bg-slate-50 border rounded-2xl text-[11px] font-bold outline-none focus:border-emerald-600" placeholder="Capacity" value={room.capacity} onChange={e => setRoom({...room, capacity: e.target.value})} required />
                    <div className="space-y-2"><label className="text-[8px] font-black uppercase text-slate-500 ml-1 italic tracking-widest">Class Type</label><select className="w-full p-4 bg-slate-50 border rounded-2xl text-[11px] font-bold outline-none" value={room.type} onChange={e => setRoom({...room, type: e.target.value})}><option value="Theory">Theory</option><option value="Lab">Practical</option></select></div>
                    <button type="submit" className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] shadow-lg active:scale-95 transition-all">Add Room</button>
                </form>
            </div>
            <div className="bg-[#0a0a0c] p-6 md:p-8 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col">
                <div className="flex justify-between items-center mb-6 text-white border-b border-white/10 pb-4"><span className="text-[10px] font-black uppercase tracking-widest italic">Classroom Details</span><RefreshCcw size={14} className="cursor-pointer" onClick={fetchData}/></div>
                <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scroll">
                    {roomList.map(r => (
                        <div key={r._id} className="p-3 md:p-4 bg-white/5 border border-white/10 rounded-2xl text-center relative group hover:border-emerald-500 transition-all overflow-hidden">
                            <h3 className="text-lg md:text-xl font-black text-white italic leading-none">R-{r.roomNumber}</h3>
                            <p className="text-[7px] md:text-[8px] font-bold text-emerald-500 uppercase mt-1.5">{r.type}</p>
                            <p className="text-[7px] md:text-[8px] text-slate-500 font-black uppercase mt-1">Cap: {r.capacity}</p>
                            <button onClick={() => handleDelete('room', r._id)} className="absolute top-2 right-2 text-red-500 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0 ml-2"><Trash2 size={12}/></button>
                        </div>
                    ))}
                </div>
            </div>
          </motion.div>
        )}

        {/* ================= VIEW 6: BROADCAST (RESPONSIVE) ================= */}
        {path === '/admin/broadcast' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 text-left">
            <div className="bg-[#0a0a0c] p-6 md:p-10 rounded-[2.5rem] md:rounded-[4rem] text-white flex flex-col justify-center min-h-[350px] shadow-2xl">
                <div className="flex items-center gap-3 mb-8 border-l-4 border-red-600 pl-4 uppercase font-black text-[10px] md:text-xs text-red-500 italic"><Signal size={20}/>Send Message</div>
                <textarea className="w-full p-6 bg-white/5 border border-white/10 rounded-[2rem] text-red-500 text-[12px] md:text-[13px] font-black outline-none h-40 shadow-inner" placeholder="Type your message…" value={signal} onChange={e => setSignal(e.target.value)} />
                <button onClick={handleSendSignal} className="w-full bg-red-600 py-4 md:py-5 rounded-[2rem] text-[10px] font-black uppercase mt-6 flex items-center justify-center gap-3 italic text-white shadow-xl active:scale-95 transition-all"><Send size={18}/>Send</button>
            </div>
            <div className="bg-white rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-8 shadow-xl border overflow-y-auto max-h-[500px] custom-scroll">
                <h2 className="text-sm font-black uppercase italic mb-8 border-l-4 border-red-600 pl-4 flex items-center gap-3 text-slate-800"><History size={18}/>Message History</h2>
                <div className="space-y-3">
                  {messages.map(m => (
                      <div key={m._id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center group hover:border-red-200 transition-all">
                          <div className="text-left overflow-hidden flex-1"><p className="text-[9px] font-black text-red-600 uppercase italic leading-none mb-1">{m.senderName}</p><p className="text-[11px] font-bold text-slate-700 leading-tight">{m.content}</p></div>
                          <button onClick={() => handleDelete('message', m._id)} className="text-red-300 group-hover:text-red-500 transition-all ml-2 flex-shrink-0"><Trash2 size={16}/></button>
                      </div>
                  ))}
                </div>
            </div>
          </div>
        )}

      </AnimatePresence>

      {/* 🌟 IDENTITY MODAL (RESPONSIVE) */}
      <AnimatePresence>
        {viewingUser && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setViewingUser(null)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9 }} className="bg-[#050505] w-[95%] max-w-[360px] rounded-[3rem] p-8 md:p-10 text-center border border-red-900/30 shadow-2xl relative overflow-hidden text-white font-['Outfit']">
                <button onClick={() => setViewingUser(null)} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"><X size={20}/></button>
                <div className="w-16 h-16 md:w-20 md:h-20 bg-red-600 rounded-[1.5rem] md:rounded-[2rem] mx-auto mb-6 flex items-center justify-center text-red-600 font-black italic shadow-2xl border border-red-500/20"><div className="w-full h-full bg-black rounded-[inherit] flex items-center justify-center text-red-600 text-3xl">{viewingUser.name.charAt(0)}</div></div>
                <h3 className="text-xl md:text-2xl font-black uppercase italic truncate leading-none">{viewingUser.name}</h3>
                <p className="text-[8px] font-black text-red-600 uppercase tracking-[0.4em] mb-8 italic mt-2">Profile Active</p>
                <div className="space-y-3 text-left">
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-3 overflow-hidden shadow-inner"><Mail size={16} className="text-red-600 flex-shrink-0"/> <span className="text-[9px] md:text-[10px] font-bold text-slate-400 truncate">{viewingUser.email}</span></div>
                    {viewingUser.role === 'faculty' && (
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2 shadow-inner"><label className="text-[8px] font-black uppercase text-slate-500 flex items-center gap-2"><Zap size={10}/>Subject</label>
                        <div className="flex flex-wrap gap-1.5">{viewingUser.expertise?.map((exp, i) => (<span key={i} className="px-2 py-1 bg-red-600/10 border border-red-600/20 rounded-md text-[8px] font-black text-red-500 uppercase">{exp}</span>))}</div>
                      </div>
                    )}
                </div>
                <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-center gap-2 text-emerald-500/60 font-black uppercase text-[8px] tracking-[0.3em]"><ShieldCheck size={14}/> Identity Secured</div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FOOTER (RESPONSIVE) */}
      <div className="flex justify-center items-center gap-4 opacity-20 py-8 border-t border-slate-200 mt-auto text-slate-400 text-center">
          <ShieldCheck className="text-red-600" size={24}/><p className="text-[9px] font-black uppercase tracking-[0.4em] italic leading-none">Neural Matrix Command Console v4.5 Active</p>
      </div>
    </div>
  );
};

export default AdminDashboard;