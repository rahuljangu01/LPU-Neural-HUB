import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { 
  Trash2, UserPlus, Plus, User as UserIcon, Cpu, Search, 
  ShieldCheck, BookOpen, Briefcase, Zap, 
  GraduationCap, ChevronRight,
  LayoutGrid, Mail, RefreshCcw,
  CheckCircle2, Send, Signal, History, ArrowLeft, UserPlus2, UploadCloud,
   Clock, Hash, Users, Sparkles, Layers, DoorOpen, MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../services/api';
import { successToast, errorAlert, confirmDialog } from '../services/alertService';

const AdminDashboard = () => {
  const location = useLocation();
  const path = location.pathname;
  const [loading, setLoading] = useState(false);

  const [room, setRoom] = useState({ roomNumber: '', capacity: '', block: 'Main', type: 'Theory' });
  const [subject, setSubject] = useState({ name: '', code: '', weeklyHours: 4, type: 'Theory', department: 'MCA' });
  const [batch, setBatch] = useState({ name: '', studentCount: 60, semester: 1, department: 'MCA', subjects:[] });
  const [signal, setSignal] = useState('');
  
  const [teacherSearch, setTeacherSearch] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState(null); 
  const [viewingUser, setViewingUser] = useState(null); 
  const [viewBatchDetails, setViewBatchDetails] = useState(null); 
  const [batchStudentSearch, setBatchStudentSearch] = useState(''); 
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [activeRoleFilter, setActiveRoleFilter] = useState('all');
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);

  const [stats, setStats] = useState({ users: 0, rooms: 0, subjects: 0, batches: 0, students: 0, signals: 0 });
  const [allUsers, setAllUsers] = useState([]); 
  const [userList, setUserList] = useState([]); 
  const [studentList, setStudentList] = useState([]); 
  const [roomList, setRoomList] = useState([]);
  const [subjectList, setSubjectList] = useState([]);
  const [batchList, setBatchList] = useState([]);
  const [messages, setMessages] = useState([]);

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

  useEffect(() => {
    const lockScroll = () => {
      if (viewingUser || viewBatchDetails) {
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        window.scrollTo({ top: 0, behavior: 'instant' });
      } else {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
      }
    };
    lockScroll();
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [viewingUser, viewBatchDetails]);

  const handleCreate = async (type, data, resetter) => {
    try {
      const endpoint = type === 'batch' ? '/batches' : `/${type}s`;
      await API.post(endpoint, data);
      successToast(`${type.toUpperCase()} Added Successfully!`);
      fetchData(); 
      resetter();
    } catch (err) { 
      errorAlert("Error", "Could not add item. Please try again."); 
    }
  };

  const handleUpdateUserNode = async (userId, updateData) => {
    try {
        await API.post(`/auth/update-expertise`, { userId, ...updateData });
        successToast("Updated Successfully!");
        fetchData(); 
        setSelectedTeacher(null); 
        setViewingUser(null);
    } catch (err) { 
      errorAlert("Error", "Update failed. Please try again."); 
    }
  };

  const toggleTeacherExpertise = (user, subName) => {
    const currentExpertise = user.expertise || [];
    const updated = currentExpertise.includes(subName)
      ? currentExpertise.filter(item => item !== subName)
      : [...currentExpertise, subName];
    setSelectedTeacher({ ...user, expertise: updated });
  };

  const handleBatchUpdate = async (batchId, updatedData) => {
    try {
        await API.put(`/batches/${batchId}`, updatedData);
        successToast("Updated!");
        fetchData();
        const res = await API.get('/batches');
        const updatedBatch = res.data.find(b => b._id === batchId);
        setViewBatchDetails(updatedBatch);
    } catch (err) { 
      errorAlert("Error", "Update failed."); 
    }
  };

  const assignStudentToBatch = async (userId, batchName) => {
    if (batchName === '') {
        try {
            await API.post(`/auth/update-expertise`, { userId, batch: '' });
            successToast("Removed from batch");
            fetchData();
            return;
        } catch (err) { errorAlert("Error", "Failed to remove."); return; }
    }

    const currentAssignedCount = allUsers.filter(u => u.batch === batchName && u.role === 'student').length;
    const maxCapacity = viewBatchDetails?.studentCount || 50;

    if (currentAssignedCount >= maxCapacity) {
        errorAlert("Batch Full", `Maximum ${maxCapacity} students allowed.`);
        return;
    }

    const student = studentList.find(s => s._id === userId);
    if (student.batch && student.batch !== '' && student.batch !== batchName) {
        errorAlert("Error", `Already in batch: ${student.batch}.`);
        return;
    }

    try {
        await API.post(`/auth/update-expertise`, { userId, batch: batchName });
        successToast("Added to batch");
        fetchData();
    } catch (err) { 
        errorAlert("Error", "Failed to add student."); 
    }
  };

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
      errorAlert("Error", "Failed to send message."); 
    }
  };

  const handleBulkExcelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const isConfirmed = await confirmDialog("Bulk Import?", `Import ${file.name}?`);
    if (!isConfirmed) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      setLoading(true);
      const res = await API.post('/auth/bulk-import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const { imported, skipped, users } = res.data;
      
      // Build detailed message
      let msg = `Imported: ${imported} users`;
      if (skipped > 0) {
        msg += ` | Skipped: ${skipped}`;
      }
      successToast(msg);
      
      // Log imported users with UIDs to console
      if (users && users.length > 0) {
        console.log("📋 Imported Users:");
        users.forEach(u => {
          console.log(`   ✅ ${u.name} - UID: ${u.uid} (${u.role})`);
        });
      }
      
      fetchData();
    } catch (err) {
      errorAlert("Import Failed", err.response?.data?.msg || "Check file format.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (type, id) => {
    try {
      const endpoint = type === 'user' ? `/auth/users/${id}` : type === 'message' ? `/messages/${id}` : type === 'batch' ? `/batches/${id}` : `/${type}s/${id}`;
      await API.delete(endpoint);
      successToast("Deleted Successfully"); 
      fetchData();
      if(type === 'batch') setViewBatchDetails(null);
    } catch (err) { 
      errorAlert("Error", "Could not delete."); 
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) return;
    const isConfirmed = await confirmDialog("Delete Users?", `Delete ${selectedUsers.length} selected users?`);
    if (!isConfirmed) return;
    try {
      setLoading(true);
      await Promise.all(selectedUsers.map(id => API.delete(`/auth/users/${id}`)));
      successToast(`${selectedUsers.length} users deleted`);
      setSelectedUsers([]);
      setDeleteMode(false);
      fetchData();
    } catch (err) { 
      errorAlert("Error", "Could not delete users."); 
    } finally { 
      setLoading(false);
    }
  };

  const toggleUserSelection = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const toggleSelectAll = () => {
    const deletableUsers = processedPersonnel.filter(u => u.role !== 'admin');
    if (selectedUsers.length === deletableUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(deletableUsers.map(u => u._id));
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

  const processedPersonnel = useMemo(() => {
    let list = allUsers;
    if (activeRoleFilter !== 'all') { list = list.filter(u => u.role.toLowerCase() === activeRoleFilter); }
    if (userSearchTerm) {
      list = list.filter(u => 
        u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
        u.uid?.includes(userSearchTerm) ||
        u.email?.toLowerCase().includes(userSearchTerm.toLowerCase())
      );
    }
    return list;
  }, [allUsers, userSearchTerm, activeRoleFilter]);

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-6 sm:space-y-8 font-['Outfit'] min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-100">

      {/* STATS CARDS - FULLY RESPONSIVE */}
      {path === '/admin' && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6"
        >
          {[
            { l: 'Faculties', v: stats.users, i: <Briefcase size={20} className="sm:w-6 sm:h-6"/>, bg: 'bg-gradient-to-br from-rose-500 to-red-600', shadow: 'shadow-rose-500/30' },
            { l: 'Subjects', v: stats.subjects, i: <Cpu size={20} className="sm:w-6 sm:h-6"/>, bg: 'bg-gradient-to-br from-violet-600 to-purple-600', shadow: 'shadow-violet-500/30' },
            { l: 'Students', v: stats.students, i: <UserIcon size={20} className="sm:w-6 sm:h-6"/>, bg: 'bg-gradient-to-br from-cyan-500 to-teal-500', shadow: 'shadow-cyan-500/30' },
            { l: 'Rooms', v: stats.rooms, i: <DoorOpen size={20} className="sm:w-6 sm:h-6"/>, bg: 'bg-gradient-to-br from-amber-500 to-orange-500', shadow: 'shadow-amber-500/30' }
          ].map((s, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.03, y: -3 }}
              className={`${s.bg} p-3 sm:p-4 md:p-6 lg:p-7 rounded-xl sm:rounded-2xl shadow-xl ${s.shadow} text-white relative overflow-hidden cursor-pointer`}
            >
              <div className="absolute top-0 right-0 w-20 sm:w-28 md:w-32 h-20 sm:h-28 md:h-32 bg-white/10 rounded-full -mr-10 sm:-mr-16 md:-mr-16 -mt-10 sm:-mt-16 md:-mt-16"/>
              <div className="relative z-10">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white/70 sm:text-white/80 text-[10px] sm:text-xs font-bold uppercase tracking-wider">{s.l}</p>
                    <p className="text-2xl sm:text-3xl md:text-4xl font-black mt-1">{loading ? '...' : s.v}</p>
                  </div>
                  <div className="bg-white/20 p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl backdrop-blur-sm">
                    {s.i}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        
        {/* MAIN DASHBOARD */}
        {path === '/admin' && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8"
          >
            {/* TEACHER MATRIX */}
            <div className="bg-white p-4 sm:p-5 md:p-6 lg:p-8 rounded-xl sm:rounded-2xl shadow-xl border border-slate-200">
              <div className="flex justify-between items-center mb-4 sm:mb-5 md:mb-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 rounded-lg sm:rounded-xl flex items-center justify-center">
                    <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600"/>
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base md:text-lg font-bold text-slate-800">Teacher Matrix</h3>
                    <p className="text-xs sm:text-sm text-slate-500">{filteredTeachers.length} Active</p>
                  </div>
                </div>
                <button onClick={fetchData} className={`p-1.5 sm:p-2 bg-slate-100 rounded-lg sm:rounded-xl text-slate-600 hover:bg-orange-100 hover:text-orange-600 transition-colors ${loading ? 'animate-spin' : ''}`}>
                  <RefreshCcw className="w-4 h-4 sm:w-5 sm:h-5"/>
                </button>
              </div>

              {!selectedTeacher ? (
                <div className="space-y-3 sm:space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-5 sm:h-5"/>
                    <input 
                      className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 bg-slate-100 border border-slate-200 rounded-lg sm:rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-orange-400 focus:bg-white transition-all" 
                      placeholder="Search teachers..." 
                      value={teacherSearch} 
                      onChange={(e) => setTeacherSearch(e.target.value)} 
                    />
                  </div>
                  
                  <div className="space-y-2 max-h-[180px] sm:max-h-[220px] md:max-h-[250px] overflow-y-auto">
                    {filteredTeachers.map((t) => (
                      <div 
                        key={t._id} 
                        onClick={() => setSelectedTeacher(t)} 
                        className="p-3 sm:p-4 bg-slate-50 rounded-lg sm:rounded-xl flex items-center justify-between cursor-pointer border border-slate-100 hover:border-orange-300 hover:bg-orange-50 transition-all min-h-[48px] sm:min-h-[56px]"
                      >
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg sm:rounded-lg flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                            {t.name.charAt(0)}
                          </div>
                          <div className="text-left min-w-0">
                            <p className="font-semibold text-slate-800 text-xs sm:text-sm truncate">{t.name}</p>
                            <p className="text-[10px] sm:text-xs text-slate-500 truncate">{t.email}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 flex-shrink-0"/>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-5">
                  <div className="flex justify-between items-center bg-gradient-to-r from-orange-500 to-red-500 p-3 sm:p-4 rounded-lg sm:rounded-xl text-white">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-lg flex items-center justify-center font-bold text-sm sm:text-base">
                        {selectedTeacher.name.charAt(0)}
                      </div>
                      <span className="font-semibold text-sm sm:text-base">{selectedTeacher.name}</span>
                    </div>
                    <button onClick={() => setSelectedTeacher(null)} className="p-1.5 sm:p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
                      <Plus className="w-4 h-4 sm:w-5 sm:h-5 rotate-45"/>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1.5 sm:space-y-2">
                      <label className="text-[10px] sm:text-xs font-semibold text-slate-600 uppercase tracking-wider">Max Classes/Week</label>
                      <input 
                        type="number" 
                        className="w-full p-2.5 sm:p-3 bg-slate-100 border border-slate-200 rounded-lg sm:rounded-xl text-slate-800 text-sm outline-none focus:border-orange-400 transition-all" 
                        value={selectedTeacher.maxWorkload || ''} 
                        onChange={e => setSelectedTeacher({...selectedTeacher, maxWorkload: e.target.value})} 
                      />
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <label className="text-[10px] sm:text-xs font-semibold text-slate-600 uppercase tracking-wider">Avg Leaves</label>
                      <input 
                        type="number" 
                        className="w-full p-2.5 sm:p-3 bg-slate-100 border border-slate-200 rounded-lg sm:rounded-xl text-slate-800 text-sm outline-none focus:border-orange-400 transition-all" 
                        value={selectedTeacher.avgLeaves || ''} 
                        onChange={e => setSelectedTeacher({...selectedTeacher, avgLeaves: e.target.value})} 
                      />
                    </div>
                  </div>

                  <div className="space-y-2 sm:space-y-3">
                    <label className="text-[10px] sm:text-xs font-semibold text-slate-600 uppercase tracking-wider">Expertise Areas</label>
                    <div className="grid grid-cols-2 gap-2 max-h-[100px] sm:max-h-[120px] md:max-h-[140px] overflow-y-auto p-2 sm:p-3 bg-slate-100 rounded-lg sm:rounded-xl border border-slate-200">
                      {subjectList.map(sub => (
                        <label 
                          key={sub._id}
                          className={`flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-lg border cursor-pointer transition-all text-[10px] sm:text-xs ${
                            selectedTeacher.expertise?.includes(sub.name) 
                              ? 'bg-orange-100 border-orange-400' 
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <input 
                            type="checkbox" 
                            className="hidden" 
                            checked={selectedTeacher.expertise?.includes(sub.name)} 
                            onChange={() => toggleTeacherExpertise(selectedTeacher, sub.name)}
                          />
                          <span className={`font-medium truncate ${selectedTeacher.expertise?.includes(sub.name) ? 'text-orange-700' : 'text-slate-700'}`}>
                            {sub.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={() => handleUpdateUserNode(selectedTeacher._id, { maxWorkload: selectedTeacher.maxWorkload, avgLeaves: selectedTeacher.avgLeaves, expertise: selectedTeacher.expertise })}
                    className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-shadow text-xs sm:text-sm"
                  >
                    Update Matrix
                  </button>
                </div>
              )}
            </div>

            {/* STATUS CARD */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-5 sm:p-6 md:p-8 lg:p-10 rounded-xl sm:rounded-2xl shadow-xl text-white relative overflow-hidden">
              <div className="absolute -top-16 -right-16 w-40 sm:w-52 md:w-60 h-40 sm:h-52 md:h-60 bg-white/5 rounded-full"/>
              
              <div className="relative z-10 flex flex-col items-center justify-center h-full py-6 sm:py-8 md:py-10">
                <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl sm:rounded-2xl md:rounded-3xl flex items-center justify-center shadow-xl shadow-orange-500/30 mb-4 sm:mb-5 md:mb-6">
                  <ShieldCheck className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white"/>
                </div>

                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">Identity Terminal</h2>
                <p className="text-slate-400 text-xs sm:text-sm font-medium uppercase tracking-widest mb-6">System Online</p>
                
                <div className="flex gap-4 sm:gap-6">
                  {['Stable', 'Secure', 'Active'].map((status) => (
                    <div key={status} className="flex items-center gap-1.5 sm:gap-2">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-400 rounded-full animate-pulse"/>
                      <span className="text-xs sm:text-sm font-medium text-slate-300">{status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* PERSONNEL REGISTRY - FULLY RESPONSIVE */}
        {path === '/admin/users' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-slate-200 overflow-hidden"
          >
            <div className="p-4 sm:p-5 md:p-6 border-b border-slate-100 bg-slate-50">
              <div className="flex flex-col gap-3 sm:gap-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 rounded-lg sm:rounded-xl flex items-center justify-center">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600"/>
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg md:text-xl font-bold text-slate-800">Personnel Registry</h2>
                    <p className="text-xs sm:text-sm text-slate-500">{allUsers.length} Registered</p>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 sm:gap-3 sm:flex-row w-full">
                  <label className="cursor-pointer sm:w-auto">
                    <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleBulkExcelUpload} disabled={loading} />
                    <div className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 text-white rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm hover:bg-slate-700 transition-colors">
                      <UploadCloud className="w-4 h-4"/> Bulk Import
                    </div>
                  </label>
                  
                  <div className="relative flex-1">
                    <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4"/>
                    <input 
                      className="w-full pl-9 sm:pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg sm:rounded-xl text-xs sm:text-sm outline-none focus:border-orange-400 focus:bg-white transition-all" 
                      placeholder="Search..." 
                      value={userSearchTerm} 
                      onChange={e => setUserSearchTerm(e.target.value)} 
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="px-4 sm:px-5 md:px-6 py-3 sm:py-4 border-b border-slate-100 flex items-center justify-between gap-2 overflow-x-auto">
              <div className="flex gap-2 overflow-x-auto">
                {['all', 'student', 'faculty', 'hod'].map(role => (
                  <button 
                    key={role}
                    onClick={() => setActiveRoleFilter(role)} 
                    className={`px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs md:text-sm font-semibold transition-all whitespace-nowrap ${
                      activeRoleFilter === role 
                        ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
              
              {deleteMode ? (
                <div className="flex items-center gap-2 shrink-0">
                  <button 
                    onClick={toggleSelectAll}
                    className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-200 transition-all"
                  >
                    Select All
                  </button>
                  <button 
                    onClick={handleBulkDelete}
                    disabled={selectedUsers.length === 0}
                    className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600 transition-all disabled:opacity-50"
                  >
                    Delete ({selectedUsers.length})
                  </button>
                  <button 
                    onClick={() => { setDeleteMode(false); setSelectedUsers([]); }}
                    className="px-3 py-1.5 bg-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-300 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setDeleteMode(true)}
                  className="px-3 py-1.5 bg-red-100 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-500 hover:text-white transition-all shrink-0"
                >
                  <Trash2 className="w-4 h-4"/>
                </button>
              )}
            </div>

            <div className="p-3 sm:p-4 md:p-6">
              <motion.div 
                initial="hidden"
                animate="visible"
                variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.03 } } }}
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4"
              >
                {processedPersonnel.map((u) => (
                  <motion.div 
                    key={u._id}
                    variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                    whileHover={deleteMode ? {} : { y: -3, boxShadow: "0 8px 25px -5px rgba(0,0,0,0.15)" }}
                    onClick={() => {
                      if (deleteMode && u.role !== 'admin') {
                        toggleUserSelection(u._id);
                      } else if (!deleteMode) {
                        setViewingUser(u);
                      }
                    }} 
                    className={`relative p-3 sm:p-4 md:p-5 bg-white border-2 rounded-lg sm:rounded-xl transition-all ${
                      u.role === 'admin' 
                        ? 'cursor-default border-slate-100' 
                        : deleteMode 
                          ? selectedUsers.includes(u._id) 
                            ? 'border-red-400 bg-red-50 cursor-pointer' 
                            : 'border-slate-100 cursor-pointer hover:border-red-300'
                          : 'cursor-pointer hover:border-orange-300'
                    }`}
                  >
                    {deleteMode && u.role !== 'admin' && (
                      <div className={`absolute top-2 left-2 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        selectedUsers.includes(u._id) 
                          ? 'bg-red-500 border-red-500' 
                          : 'border-slate-300 bg-white'
                      }`}>
                        {selectedUsers.includes(u._id) && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-white"/>
                        )}
                      </div>
                    )}
                    
                    <div className="flex flex-col items-center text-center">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg sm:rounded-xl flex items-center justify-center text-xl sm:text-2xl md:text-3xl font-black mb-2 sm:mb-3 shadow-lg ${
                        u.role === 'admin' ? 'bg-gradient-to-br from-red-500 to-red-600' :
                        u.role === 'student' ? 'bg-gradient-to-br from-cyan-500 to-teal-500' :
                        'bg-gradient-to-br from-orange-500 to-red-500'
                      }`}>
                        {u.name.charAt(0)}
                      </div>

                      <p className="font-semibold text-slate-800 text-[10px] sm:text-xs md:text-sm truncate w-full">{u.name}</p>
                      <p className="text-[9px] sm:text-[10px] md:text-xs text-orange-500 font-semibold mt-0.5 sm:mt-1">
                        {u.role === 'student' ? `Reg: ${u.uid || 'N/A'}` : `Faculty • UID: ${u.uid || 'N/A'}`}
                      </p>
                      {u.role === 'student' && (
                        <div className="flex gap-1 mt-1.5">
                          <span className="text-[8px] sm:text-[9px] bg-cyan-100 text-cyan-600 px-1.5 sm:px-2 py-0.5 rounded font-semibold">{u.batch || 'NA'}</span>
                        </div>
                      )}
                    </div>

                    {!deleteMode && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete('user', u._id); }} 
                        className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 p-1 sm:p-1.5 bg-red-100 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all"
                      >
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4"/>
                      </button>
                    )}
                  </motion.div>
                ))}
              </motion.div>

              {processedPersonnel.length === 0 && (
                <div className="py-12 sm:py-16 text-center">
                  <Users className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-slate-300 mb-2 sm:mb-3"/>
                  <p className="font-semibold text-slate-400 text-sm sm:text-base">No matching personnel found</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* SUBJECTS - FULLY RESPONSIVE */}
        {path === '/admin/subjects' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6"
          >
            {/* FORM */}
            <div className="bg-white p-4 sm:p-5 md:p-6 lg:p-8 rounded-xl sm:rounded-2xl shadow-xl border border-slate-200">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5 md:mb-6">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 rounded-lg sm:rounded-xl flex items-center justify-center">
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-red-600"/>
                </div>
                <h3 className="text-sm sm:text-base md:text-lg font-bold text-slate-800">Add Subject</h3>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleCreate('subject', subject, () => setSubject({ name: '', code: '', weeklyHours: 4, type: 'Theory', department: 'MCA' })); }} className="space-y-3 sm:space-y-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <label className="text-[10px] sm:text-xs font-semibold text-slate-600 uppercase tracking-wider">Subject Name</label>
                  <input 
                    className="w-full p-2.5 sm:p-3 bg-slate-100 border border-slate-200 rounded-lg sm:rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-red-400 focus:bg-white transition-all" 
                    placeholder="Database Management" 
                    value={subject.name} 
                    onChange={e => setSubject({...subject, name: e.target.value})} 
                    required 
                  />
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <label className="text-[10px] sm:text-xs font-semibold text-slate-600 uppercase tracking-wider">Subject Code</label>
                  <input 
                    className="w-full p-2.5 sm:p-3 bg-slate-100 border border-slate-200 rounded-lg sm:rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-red-400 focus:bg-white transition-all" 
                    placeholder="MCA101" 
                    value={subject.code} 
                    onChange={e => setSubject({...subject, code: e.target.value})} 
                    required 
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-[10px] sm:text-xs font-semibold text-slate-600 uppercase tracking-wider">Hours/Week</label>
                    <input 
                      type="number" 
                      className="w-full p-2.5 sm:p-3 bg-slate-100 border border-slate-200 rounded-lg sm:rounded-xl text-xs sm:text-sm text-slate-800 outline-none focus:border-red-400 focus:bg-white transition-all" 
                      value={subject.weeklyHours} 
                      onChange={e => setSubject({...subject, weeklyHours: e.target.value})} 
                      required 
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-[10px] sm:text-xs font-semibold text-slate-600 uppercase tracking-wider">Type</label>
                    <select 
                      className="w-full p-2.5 sm:p-3 bg-slate-100 border border-slate-200 rounded-lg sm:rounded-xl text-xs sm:text-sm text-slate-800 outline-none cursor-pointer focus:border-red-400 focus:bg-white transition-all" 
                      value={subject.type} 
                      onChange={e => setSubject({...subject, type: e.target.value})}
                    >
                      <option value="Theory">Theory</option>
                      <option value="Lab">Lab</option>
                    </select>
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center gap-2 text-xs sm:text-sm"
                >
                  <Zap className="w-4 h-4 text-yellow-300"/> Add Subject
                </button>
              </form>
            </div>

            {/* LIST */}
            <div className="bg-white p-4 sm:p-5 md:p-6 lg:p-8 rounded-xl sm:rounded-2xl shadow-xl border border-slate-200">
              <div className="flex justify-between items-center mb-4 sm:mb-5 md:mb-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-800 rounded-lg sm:rounded-xl flex items-center justify-center">
                    <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-white"/>
                  </div>
                  <span className="font-bold text-slate-800 text-sm sm:text-base">Subject Library</span>
                </div>
                <button onClick={fetchData} className="p-1.5 sm:p-2 bg-slate-100 rounded-lg sm:rounded-xl text-slate-600 hover:bg-slate-200 transition-colors">
                  <RefreshCcw className={`w-4 h-4 sm:w-5 sm:h-5 ${loading ? 'animate-spin' : ''}`}/>
                </button>
              </div>

              <div className="space-y-2 sm:space-y-3 max-h-[300px] sm:max-h-[350px] md:max-h-[400px] overflow-y-auto">
                {subjectList.map(s => (
                  <div 
                    key={s._id}
                    className="relative p-3 sm:p-4 bg-slate-50 border border-slate-100 rounded-lg sm:rounded-xl overflow-hidden group hover:border-slate-200 transition-all"
                  >
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${s.type === 'Lab' ? 'bg-purple-500' : 'bg-red-500'}`}/>
                    
                    <div className="flex items-start justify-between pl-3 sm:pl-4">
                      <div>
                        <div className="flex gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                          <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-red-100 text-red-600 text-[9px] sm:text-xs font-bold rounded">{s.code}</span>
                          <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9px] sm:text-xs font-bold rounded ${s.type === 'Lab' ? 'bg-purple-100 text-purple-600' : 'bg-slate-200 text-slate-600'}`}>
                            {s.type}
                          </span>
                        </div>
                        <h4 className="font-semibold text-slate-800 text-xs sm:text-sm">{s.name}</h4>
                        <div className="flex items-center gap-1 mt-1 text-slate-500">
                          <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5"/> <span className="text-[10px] sm:text-xs font-medium">{s.weeklyHours}h/week</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDelete('subject', s._id)} 
                        className="p-1.5 sm:p-2 bg-slate-100 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4"/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {subjectList.length === 0 && (
                <div className="py-12 sm:py-16 text-center">
                  <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-slate-300 mb-2 sm:mb-3"/>
                  <p className="font-semibold text-slate-400 text-sm sm:text-base">No subjects yet</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* BATCHES - FULLY RESPONSIVE */}
        {path === '/admin/batches' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 sm:space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* FORM */}
              <div className="bg-white p-4 sm:p-5 md:p-6 lg:p-8 rounded-xl sm:rounded-2xl shadow-xl border border-slate-200">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5 md:mb-6">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-lg sm:rounded-xl flex items-center justify-center">
                    <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600"/>
                  </div>
                  <h3 className="text-sm sm:text-base md:text-lg font-bold text-slate-800">Create Batch</h3>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); handleCreate('batch', batch, () => setBatch({ name: '', studentCount: 50, semester: 1, department: 'MCA', subjects: [] })); }} className="space-y-3 sm:space-y-4">
                  <input 
                    className="w-full p-2.5 sm:p-3 bg-slate-100 border border-slate-200 rounded-lg sm:rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-purple-400 focus:bg-white transition-all" 
                    placeholder="Batch Name (e.g. D2421)" 
                    value={batch.name} 
                    onChange={e => setBatch({ ...batch, name: e.target.value })} 
                    required 
                  />
                  
                  <div className="relative">
                    <Users className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-purple-400 w-4 h-4"/>
                    <input 
                      type="number" 
                      className="w-full p-2.5 sm:p-3 pr-10 bg-slate-100 border border-slate-200 rounded-lg sm:rounded-xl text-xs sm:text-sm text-slate-800 outline-none focus:border-purple-400 focus:bg-white transition-all" 
                      placeholder="Capacity" 
                      value={batch.studentCount} 
                      onChange={e => setBatch({ ...batch, studentCount: e.target.value })} 
                      required 
                    />
                  </div>

                  <div className="space-y-2 sm:space-y-3">
                    <label className="text-[10px] sm:text-xs font-semibold text-slate-600 uppercase tracking-wider">Select Subjects</label>
                    <div className="grid grid-cols-2 gap-2 max-h-[100px] sm:max-h-[120px] md:max-h-[150px] overflow-y-auto p-3 sm:p-4 bg-slate-100 rounded-lg sm:rounded-xl border border-slate-200">
                      {subjectList.map(sub => (
                        <label 
                          key={sub._id} 
                          className={`flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-lg border cursor-pointer transition-all text-[10px] sm:text-xs ${
                            batch.subjects?.includes(sub._id) 
                              ? 'bg-purple-100 border-purple-400' 
                              : 'bg-white border-slate-200 hover:border-purple-300'
                          }`}
                        >
                          <input 
                            type="checkbox" 
                            className="w-3.5 h-3.5 sm:w-4 sm:h-4 accent-purple-600" 
                            checked={batch.subjects?.includes(sub._id)} 
                            onChange={() => toggleSubjectInBatch(sub._id)} 
                          />
                          <span className="font-medium text-slate-700 truncate">{sub.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-shadow text-xs sm:text-sm"
                  >
                    Create Batch
                  </button>
                </form>
              </div>

              {/* BATCH LIST */}
              <div className="bg-white p-4 sm:p-5 md:p-6 lg:p-8 rounded-xl sm:rounded-2xl shadow-xl border border-slate-200">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5 md:mb-6">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-800 rounded-lg sm:rounded-xl flex items-center justify-center">
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white"/>
                  </div>
                  <span className="font-bold text-slate-800 text-sm sm:text-base">Active Batches</span>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                  {batchList.map(b => (
                    <div 
                      key={b._id}
                      onClick={() => setViewBatchDetails(b)}
                      className="relative p-3 sm:p-4 md:p-5 bg-slate-50 border-2 border-slate-100 rounded-lg sm:rounded-xl cursor-pointer group hover:border-purple-300 hover:bg-purple-50 transition-all"
                    >
                      <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500 mb-2"/>
                      <h4 className="font-bold text-slate-800 text-sm sm:text-base">{b.name}</h4>
                      <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{b.studentCount} Students</p>
                      
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete('batch', b._id) }}
                        className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 p-1 sm:p-1.5 bg-red-100 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all"
                      >
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4"/>
                      </button>
                    </div>
                  ))}
                </div>

                {batchList.length === 0 && (
                  <div className="py-12 sm:py-16 text-center">
                    <GraduationCap className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-slate-300 mb-2 sm:mb-3"/>
                    <p className="font-semibold text-slate-400 text-sm sm:text-base">No batches yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* BATCH DETAILS */}
            <AnimatePresence>
              {viewBatchDetails && (
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-slate-200 overflow-hidden"
                >
                  <div className="p-4 sm:p-5 md:p-6 bg-gradient-to-r from-purple-50 to-fuchsia-50 border-b border-slate-100">
                    <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:justify-between sm:items-center">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-lg">
                          <LayoutGrid className="w-5 h-5 sm:w-6 sm:h-6"/>
                        </div>
                        <div>
                          <h2 className="text-lg sm:text-xl font-bold text-slate-800">Batch: {viewBatchDetails.name}</h2>
                          <p className={`text-xs sm:text-sm font-medium ${allUsers.filter(u => u.batch === viewBatchDetails.name).length >= viewBatchDetails.studentCount ? 'text-red-500' : 'text-slate-500'}`}>
                            {allUsers.filter(u => u.batch === viewBatchDetails.name).length} / {viewBatchDetails.studentCount} Students
                            {allUsers.filter(u => u.batch === viewBatchDetails.name).length >= viewBatchDetails.studentCount && (
                              <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-[10px] sm:text-xs rounded-full">FULL</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setViewBatchDetails(null)}
                        className="flex items-center justify-center gap-2 px-4 py-2 sm:py-2.5 bg-slate-100 text-slate-600 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm hover:bg-slate-200 transition-colors min-h-[40px]"
                      >
                        <ArrowLeft className="w-4 h-4"/> Close
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 p-4 sm:p-5 md:p-6">
                    {/* STUDENTS */}
                    <div>
                      <div className="flex items-center gap-2 mb-3 sm:mb-4">
                        <UserPlus2 className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500"/>
                        <h3 className="font-bold text-slate-800 text-sm sm:text-base">Manage Students</h3>
                      </div>

                      <div className="relative mb-3 sm:mb-4">
                        <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4"/>
                        <input 
                          className="w-full pl-9 sm:pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg sm:rounded-xl text-xs sm:text-sm outline-none focus:border-purple-400 focus:bg-white transition-all" 
                          placeholder="Search students..." 
                          value={batchStudentSearch} 
                          onChange={e => setBatchStudentSearch(e.target.value)} 
                        />
                      </div>

                      <div className="space-y-2 max-h-[250px] sm:max-h-[300px] md:max-h-[350px] overflow-y-auto">
                        {studentList.filter(s => 
                          s.name.toLowerCase().includes(batchStudentSearch.toLowerCase()) || 
                          (s.batch && s.batch.toLowerCase().includes(batchStudentSearch.toLowerCase()))
                        ).map(s => (
                          <div key={s._id} className="p-2.5 sm:p-3 bg-slate-50 border border-slate-100 rounded-lg sm:rounded-xl flex items-center justify-between group hover:border-purple-200 transition-all min-h-[48px] sm:min-h-[56px]">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className={`w-2 h-2 rounded-full ${s.batch === viewBatchDetails.name ? 'bg-emerald-500' : 'bg-slate-300'}`}/>
                              <div>
                                <p className="font-semibold text-slate-800 text-xs sm:text-sm">{s.name}</p>
                                <p className="text-[10px] sm:text-xs text-slate-500">{s.batch || 'NA'}</p>
                              </div>
                            </div>
                            {s.batch === viewBatchDetails.name ? (
                              <button 
                                onClick={() => assignStudentToBatch(s._id, '')}
                                className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-red-100 text-red-600 rounded-lg font-semibold text-[10px] sm:text-xs hover:bg-red-500 hover:text-white transition-all"
                              >
                                Remove
                              </button>
                            ) : s.batch ? (
                              <span className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-amber-100 text-amber-600 rounded-lg font-semibold text-[10px] sm:text-xs">
                                {s.batch}
                              </span>
                            ) : (
                              <button 
                                onClick={() => assignStudentToBatch(s._id, viewBatchDetails.name)}
                                className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-purple-500 text-white rounded-lg font-semibold text-[10px] sm:text-xs hover:bg-purple-600 transition-all"
                              >
                                Add
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* SUBJECTS */}
                    <div>
                      <div className="flex items-center gap-2 mb-3 sm:mb-4">
                        <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500"/>
                        <h3 className="font-bold text-slate-800 text-sm sm:text-base">Batch Subjects</h3>
                      </div>

                      <div className="space-y-2 max-h-[280px] sm:max-h-[320px] md:max-h-[400px] overflow-y-auto">
                        {subjectList.map(sub => {
                          const isLinked = viewBatchDetails.subjects?.includes(sub._id);
                          return (
                            <label 
                              key={sub._id}
                              className={`flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg sm:rounded-xl border cursor-pointer transition-all text-xs sm:text-sm ${
                                isLinked 
                                  ? 'bg-purple-500 border-purple-500 text-white shadow-lg' 
                                  : 'bg-white border-slate-200 hover:border-purple-300'
                              }`}
                            >
                              <input 
                                type="checkbox" 
                                className="hidden" 
                                checked={isLinked} 
                                onChange={() => { 
                                  const updatedSubs = isLinked 
                                    ? viewBatchDetails.subjects.filter(id => id !== sub._id) 
                                    : [...(viewBatchDetails.subjects || []), sub._id]; 
                                  handleBatchUpdate(viewBatchDetails._id, { subjects: updatedSubs }); 
                                }} 
                              />
                              <div className="flex-1 min-w-0">
                                <p className={`font-semibold ${isLinked ? 'text-white' : 'text-slate-800'}`}>{sub.name}</p>
                                <p className={`text-[10px] sm:text-xs ${isLinked ? 'text-purple-200' : 'text-slate-500'}`}>{sub.code} • {sub.weeklyHours}h/week</p>
                              </div>
                              {isLinked && <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-white flex-shrink-0"/>}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ROOMS - FULLY RESPONSIVE */}
        {path === '/admin/rooms' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6"
          >
            {/* FORM */}
            <div className="bg-white p-4 sm:p-5 md:p-6 lg:p-8 rounded-xl sm:rounded-2xl shadow-xl border border-slate-200">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5 md:mb-6">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-100 rounded-lg sm:rounded-xl flex items-center justify-center">
                  <DoorOpen className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600"/>
                </div>
                <h3 className="text-sm sm:text-base md:text-lg font-bold text-slate-800">Add Room</h3>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleCreate('room', room, () => setRoom({ roomNumber: '', capacity: '', block: 'Main', type: 'Theory' })); }} className="space-y-3 sm:space-y-4">
                <input 
                  className="w-full p-2.5 sm:p-3 bg-slate-100 border border-slate-200 rounded-lg sm:rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-400 focus:bg-white transition-all" 
                  placeholder="Room Number" 
                  value={room.roomNumber} 
                  onChange={e => setRoom({...room, roomNumber: e.target.value})} 
                  required 
                />
                
                <input 
                  type="number" 
                  className="w-full p-2.5 sm:p-3 bg-slate-100 border border-slate-200 rounded-lg sm:rounded-xl text-xs sm:text-sm text-slate-800 outline-none focus:border-emerald-400 focus:bg-white transition-all" 
                  placeholder="Capacity" 
                  value={room.capacity} 
                  onChange={e => setRoom({...room, capacity: e.target.value})} 
                  required 
                />

                <div className="space-y-1.5 sm:space-y-2">
                  <label className="text-[10px] sm:text-xs font-semibold text-slate-600 uppercase tracking-wider">Room Type</label>
                  <select 
                    className="w-full p-2.5 sm:p-3 bg-slate-100 border border-slate-200 rounded-lg sm:rounded-xl text-xs sm:text-sm text-slate-800 outline-none cursor-pointer focus:border-emerald-400 focus:bg-white transition-all" 
                    value={room.type} 
                    onChange={e => setRoom({...room, type: e.target.value})}
                  >
                    <option value="Theory">Theory Room</option>
                    <option value="Lab">Lab Room</option>
                  </select>
                </div>

                <button 
                  type="submit"
                  className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-shadow text-xs sm:text-sm"
                >
                  Add Room
                </button>
              </form>
            </div>

            {/* LIST */}
            <div className="bg-white p-4 sm:p-5 md:p-6 lg:p-8 rounded-xl sm:rounded-2xl shadow-xl border border-slate-200">
              <div className="flex justify-between items-center mb-4 sm:mb-5 md:mb-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-800 rounded-lg sm:rounded-xl flex items-center justify-center">
                    <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5 text-white"/>
                  </div>
                  <span className="font-bold text-slate-800 text-sm sm:text-base">Room Registry</span>
                </div>
                <button onClick={fetchData} className="p-1.5 sm:p-2 bg-slate-100 rounded-lg sm:rounded-xl text-slate-600 hover:bg-slate-200 transition-colors">
                  <RefreshCcw className={`w-4 h-4 sm:w-5 sm:h-5 ${loading ? 'animate-spin' : ''}`}/>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-3 max-h-[300px] sm:max-h-[350px] md:max-h-[400px] overflow-y-auto">
                {roomList.map(r => (
                  <div 
                    key={r._id}
                    className="relative p-3 sm:p-4 md:p-5 bg-slate-50 border-2 border-slate-100 rounded-lg sm:rounded-xl group hover:border-emerald-300 transition-all"
                  >
                    <div className={`absolute top-0 left-0 right-0 h-1 ${r.type === 'Lab' ? 'bg-purple-500' : 'bg-emerald-500'} rounded-t-lg`}/>
                    
                    <div className="text-center pt-1.5 sm:pt-2">
                      <h4 className="text-slate-800 text-base sm:text-lg md:text-xl font-black">R-{r.roomNumber}</h4>
                      <span className={`inline-block px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-xs font-bold mt-1.5 sm:mt-2 ${
                        r.type === 'Lab' 
                          ? 'bg-purple-100 text-purple-600' 
                          : 'bg-emerald-100 text-emerald-600'
                      }`}>
                        {r.type}
                      </span>
                      <p className="text-slate-500 text-xs sm:text-sm font-medium mt-1.5 sm:mt-2">{r.capacity} Seats</p>
                    </div>

                    <button 
                      onClick={() => handleDelete('room', r._id)} 
                      className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 p-1 sm:p-1.5 bg-red-100 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all"
                    >
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4"/>
                    </button>
                  </div>
                ))}
              </div>

              {roomList.length === 0 && (
                <div className="py-12 sm:py-16 text-center">
                  <DoorOpen className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-slate-300 mb-2 sm:mb-3"/>
                  <p className="font-semibold text-slate-400 text-sm sm:text-base">No rooms yet</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* BROADCAST - FULLY RESPONSIVE */}
        {path === '/admin/broadcast' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6"
          >
            {/* INPUT */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 sm:p-5 md:p-6 lg:p-8 rounded-xl sm:rounded-2xl shadow-xl text-white relative overflow-hidden">
              <div className="absolute -top-16 -left-16 w-40 sm:w-52 md:w-60 h-40 sm:h-52 md:h-60 bg-orange-500/10 rounded-full"/>
              
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5 md:mb-6">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-500/20 rounded-lg sm:rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400"/>
                </div>
                <div>
                  <h3 className="font-bold uppercase tracking-wider text-sm sm:text-base">Messenger</h3>
                  <p className="text-orange-400/60 text-[10px] sm:text-xs">Send to all users</p>
                </div>
              </div>

              <textarea 
                className="w-full p-3 sm:p-4 bg-black/30 border border-white/10 rounded-lg sm:rounded-xl text-orange-400 text-xs sm:text-sm font-medium outline-none focus:border-orange-500/50 h-32 sm:h-40 resize-none placeholder:text-slate-600 transition-all" 
                placeholder="Type your message..." 
                value={signal} 
                onChange={e => setSignal(e.target.value)} 
              />

              <button 
                onClick={handleSendSignal}
                className="w-full mt-3 sm:mt-4 py-2.5 sm:py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center gap-2 text-xs sm:text-sm"
              >
                <Send className="w-4 h-4"/> Send Message
              </button>
            </div>

            {/* MESSAGES */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <History className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400"/>
                    <h3 className="font-bold text-slate-800 text-sm sm:text-base">Message History</h3>
                  </div>
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[10px] sm:text-xs font-bold rounded-full">{messages.length}</span>
                </div>
              </div>

              <div className="p-3 sm:p-4 max-h-[300px] sm:max-h-[350px] md:max-h-[400px] overflow-y-auto">
                <div className="space-y-2 sm:space-y-3">
                  {messages.map((m) => (
                    <div 
                      key={m._id}
                      className="relative p-3 sm:p-4 bg-slate-50 border border-slate-100 rounded-lg sm:rounded-xl overflow-hidden group hover:border-red-200 transition-all"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-red-500 to-red-600"/>
                      
                      <div className="flex justify-between items-start pl-3 sm:pl-4">
                        <div>
                          <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg sm:rounded-lg flex items-center justify-center text-white text-[10px] sm:text-xs font-bold">
                              {m.senderName?.charAt(0)}
                            </div>
                            <div>
                              <p className="text-red-600 font-bold text-xs sm:text-sm">{m.senderName}</p>
                              <p className="text-slate-400 text-[9px] sm:text-xs">{new Date(m.createdAt).toLocaleString()}</p>
                            </div>
                          </div>
                          <p className="text-slate-700 text-xs sm:text-sm font-medium pl-8 sm:pl-11">"{m.content}"</p>
                        </div>
                        <button 
                          onClick={() => handleDelete('message', m._id)} 
                          className="p-1.5 sm:p-2 bg-slate-100 text-slate-400 rounded-lg hover:text-red-500 hover:bg-red-50 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4"/>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {messages.length === 0 && (
                  <div className="py-12 sm:py-16 text-center">
                    <Signal className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-slate-300 mb-2 sm:mb-3"/>
                    <p className="font-semibold text-slate-400 text-sm sm:text-base">No messages yet</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* USER DETAILS MODAL - FULLY RESPONSIVE */}
      {viewingUser && createPortal(
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4"
        >
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm" 
            onClick={() => setViewingUser(null)} 
          />
          <motion.div 
            initial={{ scale: 0.8, opacity: 0, y: 50 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            className="relative bg-gradient-to-br from-slate-800 to-slate-900 w-full max-w-xs sm:max-w-sm md:max-w-md rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 shadow-2xl border border-white/10"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-red-500 to-rose-500"/>
            
            <button 
              onClick={() => setViewingUser(null)} 
              className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 bg-white/10 rounded-xl text-white/60 hover:text-white hover:bg-white/20 transition-all z-10 min-w-[40px] min-h-[40px] flex items-center justify-center"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="relative mb-4 sm:mb-6">
                <div className={`w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-2xl sm:rounded-3xl flex items-center justify-center text-3xl sm:text-4xl md:text-5xl font-black shadow-xl ${
                  viewingUser.role === 'student' 
                    ? 'bg-gradient-to-br from-cyan-500 to-teal-500' 
                    : viewingUser.role === 'admin'
                    ? 'bg-gradient-to-br from-red-500 to-red-600'
                    : 'bg-gradient-to-br from-orange-500 to-red-500'
                }`}>
                  {viewingUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 bg-emerald-500 rounded-full flex items-center justify-center border-4 border-slate-800">
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white"/>
                </div>
              </div>

              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1">{viewingUser.name}</h3>
              <p className="text-orange-400 font-bold text-xs sm:text-sm mb-3 sm:mb-4">
                {viewingUser.role === 'student' ? `Reg: ${viewingUser.uid || '00000'}` : `Faculty • UID: ${viewingUser.uid || '00000'}`}
              </p>

              <div className="w-full space-y-2.5 sm:space-y-3 mt-4 sm:mt-6">
                <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white/5 rounded-xl border border-white/10">
                  <Mail className="text-orange-400 w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" size={18}/>
                  <span className="text-slate-200 text-xs sm:text-sm font-medium truncate">{viewingUser.email}</span>
                </div>
                
                <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white/5 rounded-xl border border-white/10">
                  <Hash className="text-purple-400 w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" size={18}/>
                  <span className="text-slate-200 text-xs sm:text-sm font-medium uppercase">{viewingUser.department} • {viewingUser.role}</span>
                </div>

                {viewingUser.role === 'student' && viewingUser.batch && (
                  <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                    <div className="p-3 sm:p-4 bg-white/5 rounded-xl border border-white/10 text-center">
                      <p className="text-slate-400 text-[10px] sm:text-xs uppercase mb-1">Roll No</p>
                      <p className="text-white text-xl sm:text-2xl font-black">{viewingUser.rollNo || '0'}</p>
                    </div>
                    <div className="p-3 sm:p-4 bg-white/5 rounded-xl border border-white/10 text-center">
                      <p className="text-slate-400 text-[10px] sm:text-xs uppercase mb-1">Group</p>
                      <p className="text-orange-400 text-xl sm:text-2xl font-black">{viewingUser.group || 'N/A'}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-5 sm:mt-6 pt-3 sm:pt-4 border-t border-white/10 flex items-center justify-center gap-2 text-emerald-400 font-bold text-[10px] sm:text-xs uppercase tracking-widest">
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5"/> Identity Verified
              </div>
            </div>
          </motion.div>
        </motion.div>,
        document.body
      )}
    </div>
  );
};

export default AdminDashboard;
