import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Trash2, Building2, Clock, User as UserIcon, Activity, 
  ArrowLeft, Search, CheckCircle2,
  Briefcase,
  RefreshCw, Wand2,
  LayoutGrid, Download,
  FileSpreadsheet, GraduationCap, Calendar,
  Atom,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx'; 
import API from '../services/api';
import { successToast, errorAlert, confirmDialog } from '../services/alertService';
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
const aiSteps = [
  "Analyzing Parameters...", 
  "Mapping Fixed Slots...", 
  "Resolving Conflicts...", 
  "Optimizing Schedule...",
  "Generating Variants..."
];

const HODDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [view, setView] = useState('main'); 
  const [isGenerating, setIsGenerating] = useState(false);
  const [genStep, setGenStep] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const userDept = localStorage.getItem('userDepartment') || '';
  const isVerified = localStorage.getItem('userVerified') === 'true';
  const [verified, setVerified] = useState(isVerified);
  
  const [variants, setVariants] = useState([]); 
  const [activeVariantIndex, setActiveVariantIndex] = useState(0); 
  const [faculties, setFaculties] = useState([]);
  const [currentSchedule, setCurrentSchedule] = useState([]); 
  const [rooms, setRooms] = useState([]);
  const [subjectList, setSubjectList] = useState([]);
  const [batches, setBatches] = useState([]); 
  const [availableRooms, setAvailableRooms] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [params, setParams] = useState({ 
    maxLoad: 6, 
    leaveBuffer: true, 
    batchId: 'all',
    fixedSlots: {} 
  });
  const [query, setQuery] = useState({ day: 'Monday', timeSlot: '09:00 - 10:00' });
  
  const userName = localStorage.getItem('userName') || 'HOD';

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchHubIntel = useCallback(async () => {
    try {
      const [u, s, r, b, sub] = await Promise.all([
        API.get('/auth/users').catch(e => ({ data: [], error: e })), 
        API.get('/timetable').catch(e => ({ data: [], error: e })),
        API.get('/rooms').catch(e => ({ data: [], error: e })),
        API.get('/batches').catch(e => ({ data: [], error: e })),
        API.get('/subjects').catch(e => ({ data: [], error: e }))
      ]);
      
      const extractData = (response) => {
        if (Array.isArray(response.data)) return response.data;
        if (response.data?.data && Array.isArray(response.data.data)) return response.data.data;
        if (response.data?.rooms && Array.isArray(response.data.rooms)) return response.data.rooms;
        return [];
      };
      
      const usersData = extractData(u);
      const roomsData = extractData(r);
      const batchesData = extractData(b);
      const subjectsData = extractData(sub);
      
      // Handle timetable data - FILTER BY DEPARTMENT
      let timetableData = [];
      if (Array.isArray(s.data)) {
        timetableData = s.data;
      } else if (s.data?.schedule && Array.isArray(s.data.schedule)) {
        timetableData = s.data.schedule;
      }
      
      // Filter timetable by HOD's department
      timetableData = timetableData.filter(t => t.department === userDept);
      
      // Filter faculties by department
      const deptFaculties = usersData.filter(user => 
        (user.role === 'faculty' || user.role === 'hod') && user.department === userDept
      );
      
      // Filter batches by department
      const deptBatches = batchesData.filter(b => b.department === userDept);
      
      // Check verified status from user data
      const myUser = usersData.find(u => u.email === localStorage.getItem('userEmail'));
      if (myUser) {
        setVerified(myUser.verified || false);
        localStorage.setItem('userVerified', myUser.verified ? 'true' : 'false');
      }
      
      setFaculties(deptFaculties);
      setCurrentSchedule(timetableData);
      setRooms(roomsData);
      setBatches(deptBatches);
      setSubjectList(subjectsData.filter(sub => sub.department === userDept));
      
      console.log('📊 Hub Intel Fetched:', {
        timetableCount: timetableData.length,
        batches: [...new Set(timetableData.map(t => t.batch))],
        first3: timetableData.slice(0, 3)
      });
    } catch (err) { 
      console.error("Neural Sync Error:", err); 
    }
  }, []);

  useEffect(() => { 
    fetchHubIntel(); 
    const path = location.pathname;
    if (path === '/hod/optimizer') setView('optimizer_hub');
    else if (path === '/hod/monitor') setView('monitor');
    else if (path === '/hod/availability') setView('scanner');
    else if (path === '/hod/personnel') setView('personnel');
    else if (path === '/hod/messenger') setView('messenger');
    else setView('main');
  }, [fetchHubIntel, location.pathname]);

  // Refetch when view changes to monitor
  useEffect(() => {
    if (view === 'monitor') {
      fetchHubIntel();
    }
  }, [view, fetchHubIntel]);

  const analytics = useMemo(() => {
    const slotsPerDay = timeSlots.length - 1; // 8 total - 1 lunch = 7 teaching slots
    const teachingDays = 5; // Monday to Friday (5 days)
    const totalRooms = rooms.length || 1;
    const totalPossibleSlots = totalRooms * slotsPerDay * teachingDays;
    // Count filled slots excluding lunch
    const filledSlots = currentSchedule.filter(c => c.timeSlot !== '12:00 - 01:00').length;
    // Show 100% if there's any schedule, or calculate actual utilization
    const util = currentSchedule.length > 0 
      ? (totalPossibleSlots > 0 ? Math.min(100, Math.round((filledSlots / totalPossibleSlots) * 100)) : 100)
      : 0;
    
    return { 
      util, 
      filledSlots, 
      totalPossibleSlots, 
      totalRooms,
      slotsPerDay,
      teachingDays,
      totalBatches: batches.length,
      totalSubjects: subjectList.length,
      totalTeachers: faculties.length
    };
  }, [rooms, currentSchedule, batches, subjectList, faculties]);

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

  const executeNeuralEngine = async () => {
    if (!(await confirmDialog("Generate Timetable?", "AI will create 3 optimized timetable options for you."))) return;
    setIsGenerating(true);
    setGenStep(0);
    let step = 0;
    const interval = setInterval(() => { if (step < 5) { step++; setGenStep(step); } }, 1000);
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
      }, 5000); 
    } catch (err) { clearInterval(interval); setIsGenerating(false); errorAlert("Logic Fail", "Conflict in constraints."); }
  };

  const handleApproveVariant = async () => {
    if (await confirmDialog("Deploy Timetable?", "This will update the selected batch timetable!")) {
      setIsGenerating(true);
      try {
        const scheduleToDeploy = variants[activeVariantIndex].schedule;
        
        console.log('🚀 Deploying NEW schedule:', {
          count: scheduleToDeploy.length,
          batches: [...new Set(scheduleToDeploy.map(s => s.batch))]
        });
        
        const res = await API.post('/timetable/add-bulk', { 
          schedule: scheduleToDeploy,
          batchId: params.batchId 
        });
        console.log('✅ Deploy response:', res.data);
        
        successToast(`Timetable Deployed! ${res.data.count} classes scheduled.`);
        
        // Clear variants to prevent re-deploying same schedule
        setVariants([]);
        
        // Force fresh fetch after deploy
        setTimeout(async () => {
          await fetchHubIntel();
          navigate('/hod/monitor');
        }, 1000);
      } catch (err) { 
        console.error('❌ Deploy error:', err);
        errorAlert("Error", "Deployment failed."); 
      } finally {
        setIsGenerating(false);
      }
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

  const handleExportExcel = (batchName, batchClasses) => {
    try {
      console.log('📤 Export Debug:', {
        batchName: batchName,
        totalClasses: batchClasses.length,
        sampleClass: batchClasses[0],
        allBatches: [...new Set(batchClasses.map(c => c.batch))]
      });
      
      const excelData = batchClasses.map(cls => {
        const batch = cls.batch || '';
        const subject = cls.subject || '';
        
        // Check if Practical/Lab
        let isPractical = false;
        if (cls.type) {
          const type = cls.type.toLowerCase();
          if (type === 'lab' || type === 'practical' || type.includes('lab')) {
            isPractical = true;
          }
        } else if (subject.toLowerCase().includes('lab')) {
          isPractical = true;
        }
        
        // AttendanceType: L for Lecture, P for Practical
        const attendanceType = isPractical ? "P" : "L";
        
        // StudentGroup: Check studentGroup field first
        let studentGroup = cls.studentGroup || "0";
        
        // If studentGroup is not G1/G2, check batch name
        if (studentGroup === "0" || !studentGroup) {
          const batchStr = batch.toString().toUpperCase();
          if (batchStr.includes('G1')) {
            studentGroup = 'G1';
          } else if (batchStr.includes('G2')) {
            studentGroup = 'G2';
          }
        }
        
        // Day format: Short form only
        const dayMap = { 'monday': 'Mon', 'tuesday': 'Tue', 'wednesday': 'Wed', 'thursday': 'Thu', 'friday': 'Fri', 'saturday': 'Sat', 'sunday': 'Sun' };
        const dayLower = (cls.day || '').toLowerCase();
        const dayShort = dayMap[dayLower] || cls.day;
        
        return {
          "RoomNumber": cls.room || cls.roomNumber || "N/A",
          "AttendanceType": attendanceType,
          "AttendanceDay": dayShort,
          "AttendanceTime": cls.timeSlot,
          "TeacherLogin": cls.faculty?.uid || cls.facultyUid || "N/A",
          "Section": batch,
          "CourseCode": cls.subjectCode || cls.code || subject,
          "StudentGroup": studentGroup
        };
      });
      
      // Sort by day order: Mon, Tue, Wed, Thu, Fri, Sat
      const dayOrder = { 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6, 'Sun': 7 };
      excelData.sort((a, b) => {
        const dayA = dayOrder[a.AttendanceDay] || 8;
        const dayB = dayOrder[b.AttendanceDay] || 8;
        if (dayA !== dayB) return dayA - dayB;
        return a.AttendanceTime.localeCompare(b.AttendanceTime);
      });
      
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "ERP_Timetable");
      XLSX.writeFile(workbook, `ERP_Format_${batchName}.xlsx`);
      successToast("ERP Excel Downloaded Successfully!");
    } catch (err) {
      console.error("Excel Export Error:", err);
      errorAlert("Export Failed", "Could not generate Excel file.");
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
      successToast("Timetable Image Downloaded!");
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

  const dayFormatted = currentTime.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  const dateFormatted = currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
  const timeFormatted = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  const menuItems = [
    { id: 'personnel', label: 'Faculty Record', sub: 'Manage Workload', icon: Briefcase, color: 'from-red-600 to-rose-700' },
    { id: 'optimizer_hub', label: 'AI Generator', sub: 'Execute Neural AI', icon: Atom, color: 'from-red-700 to-red-900' },
    { id: 'scanner', label: 'Room Scanner', sub: 'Find Available Rooms', icon: Building2, color: 'from-rose-600 to-red-600' },
    { id: 'monitor', label: 'All Schedules', sub: 'View & Manage Timetable', icon: Activity, color: 'from-red-800 to-rose-800' },
  ];

  // 🚫 NOT VERIFIED - Show waiting screen
  if (!verified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 text-center"
        >
          <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-10 h-10 text-amber-400"/>
          </div>
          <h1 className="text-2xl font-black text-white mb-2">Verification Required</h1>
          <p className="text-slate-400 mb-6">
            Your HOD account is pending verification by the Admin. 
            Once verified, you'll have full access to all HOD features.
          </p>
          <div className="flex items-center justify-center gap-2 text-amber-400 mb-4">
            <Clock className="w-5 h-5 animate-pulse"/>
            <span className="font-bold">Waiting for Admin approval...</span>
          </div>
          <p className="text-slate-500 text-sm mb-6">
            Department: <span className="text-white font-bold">{userDept}</span>
          </p>
          <button
            onClick={() => {
              localStorage.clear();
              navigate('/login');
            }}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition-all"
          >
            Logout
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-100 font-['Outfit']">
      
      {/* AI GENERATION OVERLAY - LIGHT & ANIMATED */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] bg-white flex items-center justify-center overflow-hidden"
          >
            <div className="flex flex-col items-center">
              
              {/* Animated Loader */}
              <div className="relative w-32 h-32 mb-6">
                <motion.div
                  className="absolute inset-0 rounded-full border-4 border-red-100"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <motion.div
                  className="absolute inset-2 rounded-full border-4 border-red-200"
                  animate={{ scale: [1.1, 1, 1.1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Atom className="text-red-500" size={32} />
                </div>
              </div>

              {/* Percentage */}
              <motion.div 
                key={genStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-4"
              >
                <span className="text-5xl font-black text-slate-800">
                  {Math.min(Math.round(((genStep + 1) / aiSteps.length) * 100), 100)}
                </span>
                <span className="text-3xl text-red-500 font-bold">%</span>
              </motion.div>

              {/* Status Text */}
              <p className="text-slate-600 font-medium text-base mb-4">
                {aiSteps[Math.min(genStep, aiSteps.length - 1)]}
              </p>

              {/* Step Dots */}
              <div className="flex gap-2 mb-6">
                {aiSteps.map((_, i) => (
                  <motion.div
                    key={i}
                    animate={i <= genStep ? { scale: [1, 1.3, 1], backgroundColor: '#ef4444' } : { scale: 1, backgroundColor: '#e5e7eb' }}
                    transition={{ duration: 0.3 }}
                    className="w-2.5 h-2.5 rounded-full"
                  />
                ))}
              </div>

              {/* Info Cards */}
              <div className="flex gap-3">
                <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 text-center">
                  <p className="text-xl font-black text-slate-800">{rooms.length}</p>
                  <p className="text-[10px] text-slate-500 uppercase">Rooms</p>
                </div>
                <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 text-center">
                  <p className="text-xl font-black text-slate-800">{batches.length}</p>
                  <p className="text-[10px] text-slate-500 uppercase">Batches</p>
                </div>
                <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 text-center">
                  <p className="text-xl font-black text-slate-800">{subjectList.length}</p>
                  <p className="text-[10px] text-slate-500 uppercase">Subjects</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8 space-y-6 md:space-y-8">
        
        {/* HEADER - CLEAN & COMPACT */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white/80 backdrop-blur-sm p-4 rounded-2xl shadow-lg border border-slate-200">
          
          {/* Left - Logo & Title */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-rose-700 rounded-xl flex items-center justify-center shadow-lg">
              <GraduationCap size={24} className="text-white"/>
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <Calendar size={12} className="text-red-500"/>
                <span className="font-medium">{dayFormatted} • {dateFormatted} • {timeFormatted}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-800">HOD Dashboard</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded-full uppercase">{userName}</span>
                <span className="text-[10px] text-slate-400">LPU Neural HUB</span>
              </div>
            </div>
          </div>

          {/* Right - Stats Compact */}
          <div className="flex items-center gap-3 flex-wrap">
            
            {/* Utilization - Simple & Clean */}
            <div className="bg-gradient-to-r from-red-600 to-rose-600 px-4 py-2 rounded-xl shadow-lg">
              <p className="text-[9px] font-bold text-red-200 uppercase mb-0.5">Utilization</p>
              <p className="text-2xl font-black text-white">{analytics.util}%</p>
            </div>

            {/* Mini Stats - Horizontal */}
            <div className="flex gap-2">
              <div className="bg-slate-100 px-3 py-2 rounded-lg text-center">
                <p className="text-lg font-black text-slate-800">{analytics.totalRooms || 0}</p>
                <p className="text-[8px] font-bold text-slate-500 uppercase">Rooms</p>
              </div>
              <div className="bg-slate-100 px-3 py-2 rounded-lg text-center">
                <p className="text-lg font-black text-slate-800">{analytics.totalBatches || 0}</p>
                <p className="text-[8px] font-bold text-slate-500 uppercase">Batches</p>
              </div>
              <div className="bg-slate-100 px-3 py-2 rounded-lg text-center">
                <p className="text-lg font-black text-slate-800">{analytics.totalSubjects || 0}</p>
                <p className="text-[8px] font-bold text-slate-500 uppercase">Subjects</p>
              </div>
              <div className="bg-slate-100 px-3 py-2 rounded-lg text-center">
                <p className="text-lg font-black text-slate-800">{analytics.totalTeachers || 0}</p>
                <p className="text-[8px] font-bold text-slate-500 uppercase">Teachers</p>
              </div>
            </div>

            {/* Refresh */}
            <button 
              onClick={fetchHubIntel}
              className="w-10 h-10 bg-slate-100 hover:bg-red-100 p-2 rounded-lg text-slate-500 hover:text-red-600 transition-all"
            >
              <RefreshCw size={20}/>
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <AnimatePresence mode="wait">
          
          {/* MAIN VIEW */}
          {view === 'main' && (
            <motion.div 
              key="main"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
            >
              {menuItems.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  onClick={() => setView(item.id)}
                  className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-slate-800 to-slate-900 shadow-lg border border-slate-700 cursor-pointer transition-all group hover:shadow-xl hover:border-red-500/50"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-rose-500"/>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-red-500/10 to-transparent rounded-full blur-2xl"/>
                  <div className="relative flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4">
                      <motion.div 
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className="w-14 h-14 bg-gradient-to-br from-red-600 to-rose-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30"
                      >
                        <item.icon size={28} className="text-white"/>
                      </motion.div>
                      <motion.div 
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-3 h-3 bg-red-500/50 rounded-full"
                      />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">{item.label}</h3>
                    <p className="text-slate-400 text-sm font-medium">{item.sub}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* PERSONNEL VIEW */}
          {view === 'personnel' && (
            <motion.div 
              key="personnel"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <motion.button 
                  whileHover={{ x: -5 }}
                  onClick={() => setView('main')} 
                  className="flex items-center gap-2 text-slate-400 hover:text-red-600 font-bold uppercase text-sm tracking-wider transition-colors"
                >
                  <ArrowLeft size={18}/> Back to Dashboard
                </motion.button>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                  <input 
                    type="text" 
                    placeholder="Search Faculty..." 
                    className="w-full bg-slate-800/80 backdrop-blur-xl border border-slate-700 p-3 pl-10 rounded-xl outline-none focus:border-red-600 text-white shadow-lg text-sm"
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                {filteredFaculties.map((f, i) => (
                  <motion.div 
                    key={f._id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ y: -2 }}
                    className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-3 sm:p-4 shadow-md hover:shadow-lg transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-red-600 to-red-500 rounded-lg flex items-center justify-center text-white font-black text-sm shadow-md">
                        {f.name.charAt(0)}
                      </div>
                      <span className="px-1.5 py-0.5 bg-red-600/20 text-red-400 text-[8px] font-bold rounded-full uppercase">{f.department}</span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-white mb-0.5 truncate">{f.name}</h3>
                    <p className="text-slate-500 text-[9px] sm:text-[10px] mb-2">UID: {f.uid || 'N/A'}</p>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {f.expertise?.slice(0, 2).map((exp, i) => (
                        <span key={i} className="px-1 py-0.5 bg-slate-700 text-slate-300 text-[7px] sm:text-[9px] font-semibold rounded uppercase">{exp}</span>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-slate-700">
                      <div className="text-center flex-1">
                        <p className="text-[8px] text-slate-500 uppercase">Max</p>
                        <p className="text-sm font-black text-white">{f.maxWorkload}h</p>
                      </div>
                      <div className="text-center flex-1">
                        <p className="text-[8px] text-slate-500 uppercase">Buffer</p>
                        <p className="text-sm font-black text-white">{f.avgLeaves}d</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* OPTIMIZER HUB */}
          {view === 'optimizer_hub' && (
            <motion.div 
              key="optimizer"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-4xl mx-auto"
            >
              <motion.div 
                className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-2xl p-6 md:p-10 shadow-2xl border border-slate-700 relative overflow-hidden"
              >
                <motion.div 
                  animate={{ opacity: [0.1, 0.2, 0.1] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute -top-20 -right-20 w-60 h-60 bg-red-600/20 rounded-full blur-3xl"
                />
                 
                <div className="relative">
                  <motion.button 
                    whileHover={{ x: -5 }}
                    onClick={() => setView('main')} 
                    className="flex items-center gap-2 text-slate-400 hover:text-red-600 mb-6 font-bold uppercase text-sm tracking-wider"
                  >
                    <ArrowLeft size={18}/> Back
                  </motion.button>

                  <div className="text-center mb-8">
                    <motion.div 
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-16 h-16 bg-gradient-to-br from-red-600 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-600/30"
                    >
                      <Wand2 size={32} className="text-white"/>
                    </motion.div>
                    <h2 className="text-2xl md:text-3xl font-black text-white mb-2">AI Engine Parameters</h2>
                    <p className="text-slate-400 text-sm">Configure neural network settings</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">For Batch</label>
                      <select 
                        className="w-full p-4 bg-slate-700 border border-slate-600 rounded-xl text-white outline-none focus:border-red-600 font-semibold text-sm"
                        value={params.batchId} 
                        onChange={e => setParams({...params, batchId: e.target.value, fixedSlots: {}})}
                      >
                        <option value="all" className='bg-slate-800'>ALL BATCHES</option>
                        {batches.map(b => <option key={b._id} value={b._id} className='bg-slate-800'>{b.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Daily Max Class</label>
                      <input 
                        type="number" 
                        className="w-full p-4 bg-slate-700 border border-slate-600 rounded-xl text-white outline-none focus:border-red-600 font-semibold text-sm"
                        value={params.maxLoad} 
                        onChange={e => setParams({...params, maxLoad: e.target.value})}
                      />
                    </div>

                    <AnimatePresence>
                      {params.batchId !== 'all' && selectedBatchSubjects.length > 0 && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="col-span-1 md:col-span-2 space-y-4 bg-slate-700/50 p-6 rounded-xl border border-slate-600"
                        >
                          <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
                            <LayoutGrid size={16}/> Fixed Subject Slots
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {selectedBatchSubjects.map((sub, idx) => (
                              <div key={idx} className="p-3 bg-black/20 rounded-xl border border-white/5">
                                <label className="text-xs font-semibold text-slate-300 uppercase block mb-2">{sub.name}</label>
                                <select 
                                  className="w-full p-2 bg-black/50 border border-white/10 rounded-lg text-white text-sm outline-none"
                                  value={params.fixedSlots[sub.name] || 'none'}
                                  onChange={(e) => setParams({...params, fixedSlots: {...params.fixedSlots, [sub.name]: e.target.value}})}
                                >
                                  <option value="none" className="bg-black">ANY TIME</option>
                                  {timeSlots.map(slot => <option key={slot} value={slot} className="bg-black">{slot}</option>)}
                                </select>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="col-span-1 md:col-span-2 space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Leave Handling</label>
                      <select 
                        className="w-full p-4 bg-slate-700 border border-slate-600 rounded-xl text-white outline-none focus:border-red-600 font-semibold text-sm"
                        value={params.leaveBuffer} 
                        onChange={e => setParams({...params, leaveBuffer: e.target.value === 'true'})}
                      >
                        <option value={true} className='bg-slate-800'>Flexible Scheduling</option>
                        <option value={false} className='bg-slate-800'>Fixed Schedule</option>
                      </select>
                    </div>
                  </div>

                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={executeNeuralEngine}
                    className="w-full bg-gradient-to-r from-red-600 to-red-500 py-4 rounded-xl text-white font-bold uppercase tracking-wider shadow-lg shadow-red-600/30 hover:shadow-red-600/50 transition-all flex items-center justify-center gap-3"
                  >
                    <Wand2 size={20}/> Generate Timetable
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* OPTIMIZER RESULTS */}
          {view === 'optimizer_results' && (
            <motion.div 
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 md:p-8 shadow-xl border border-slate-700">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 pb-6 border-b border-slate-700">
                  <div>
                    <motion.button 
                      whileHover={{ x: -5 }}
                      onClick={() => setView('optimizer_hub')} 
                      className="text-slate-400 hover:text-red-600 font-bold uppercase text-xs tracking-wider mb-2"
                    >
                      <ArrowLeft size={16}/> Reset Params
                    </motion.button>
                    <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-3">
                      <Atom className="text-red-500"/> 
                      AI Generated Timetable
                    </h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-red-500/20 px-5 py-3 rounded-xl text-center">
                      <p className="text-[10px] text-red-400 uppercase font-bold">Total Classes</p>
                      <p className="text-2xl font-black text-white">
                        {(() => {
                          // Count EXACTLY like the grid shows (one per cell)
                          let count = 0;
                          days.forEach(d => {
                            timeSlots.forEach(s => {
                              if (s !== '12:00 - 01:00') {
                                // Same logic as grid - find first match
                                const hasSession = variants[activeVariantIndex]?.schedule.find(
                                  cs => cs.day === d && cs.timeSlot === s
                                );
                                if (hasSession) count++;
                              }
                            });
                          });
                          return count;
                        })()}
                      </p>
                    </div>
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleApproveVariant}
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 rounded-xl text-white font-bold uppercase text-sm shadow-lg"
                    >
                      <CheckCircle2 size={18}/> Deploy
                    </motion.button>
                  </div>
                </div>

                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                  {variants.map((v, i) => {
                    // Count EXACTLY like the grid shows
                    let count = 0;
                    days.forEach(d => {
                      timeSlots.forEach(s => {
                        if (s !== '12:00 - 01:00') {
                          const hasSession = v.schedule?.find(cs => cs.day === d && cs.timeSlot === s);
                          if (hasSession) count++;
                        }
                      });
                    });
                    return (
                      <button 
                        key={i} 
                        onClick={() => setActiveVariantIndex(i)} 
                        className={`px-6 py-2 rounded-xl font-bold uppercase text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
                          activeVariantIndex === i 
                            ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-500/30' 
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        <Atom size={14}/> Option {i+1}
                        <span className="text-[10px] opacity-70">({count})</span>
                      </button>
                    );
                  })}
                </div>

                <ZoomableTimetable>
                  <div className="min-w-[700px] bg-slate-900 rounded-2xl p-4">
                    <div className="grid grid-cols-7 gap-2">
                      <div className="col-span-1 space-y-2 pt-8">
                        {timeSlots.map(s => (
                          <div key={s} className="h-16 flex items-center justify-end pr-4 border-r border-slate-700">
                            <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                              <Clock size={12} className="text-red-500"/> {s.split(' - ')[0]}
                            </span>
                          </div>
                        ))}
                      </div>
                      {days.map(d => (
                        <div key={d} className="col-span-1 space-y-2 text-center">
                          <h1 className="text-sm font-bold text-white uppercase py-2 border-b border-slate-700">{d.slice(0,3)}</h1>
                          {timeSlots.map((s, i) => {
                            const session = variants[activeVariantIndex]?.schedule.find(cs => cs.day === d && cs.timeSlot === s);
                            // G1/G2 styling
                            const isG1Batch = session?.batch && /G1$/i.test(session.batch);
                            const isG2Batch = session?.batch && /G2$/i.test(session.batch);
                            const sessionBg = session 
                              ? (isG1Batch ? 'bg-blue-500/20 border-blue-500/50 hover:border-blue-400' 
                                : (isG2Batch ? 'bg-purple-500/20 border-purple-500/50 hover:border-purple-400'
                                  : 'bg-red-500/20 border-red-500/50 hover:border-red-400'))
                              : 'bg-slate-800 border-slate-700 opacity-30';
                            return (
                              <motion.div 
                                key={i}
                                whileHover={{ scale: 1.02 }}
                                className={`h-20 rounded-xl border flex flex-col items-center justify-center p-1.5 transition-all ${sessionBg}`}
                              >
                                {session ? (
                                  <>
                                    <p className="text-[9px] font-bold text-white uppercase truncate w-full">{session.subject}</p>
                                    <p className="text-[7px] text-red-400 font-semibold truncate w-full">{session.subjectCode}</p>
                                    <div className="flex items-center gap-1 mt-0.5">
                                      <span className="text-[7px] text-slate-400 font-semibold">R-{session.room}</span>
                                      <span className="text-[7px] text-emerald-400 font-semibold">{session.facultyUid}</span>
                                    </div>
                                    {session.studentGroup && session.studentGroup !== 'Full Batch' && (
                                      <span className={`text-[6px] font-bold mt-0.5 ${isG1Batch ? 'text-blue-400' : 'text-purple-400'}`}>
                                        {session.studentGroup}
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-[8px] text-slate-500 uppercase">-</span>
                                )}
                              </motion.div>
                            )
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </ZoomableTimetable>
              </div>
            </motion.div>
          )}

          {/* MONITOR VIEW */}
          {view === 'monitor' && (
            <motion.div 
              key="monitor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <motion.button 
                  whileHover={{ x: -5 }}
                  onClick={() => setView('main')} 
                  className="flex items-center gap-2 text-slate-400 hover:text-red-500 font-bold uppercase text-sm tracking-wider"
                >
                  <ArrowLeft size={18}/> Back
                </motion.button>
                <div className="flex items-center gap-3">
                  <div className="bg-red-500/20 px-4 py-2 rounded-xl text-center">
                    <p className="text-[10px] text-red-400 uppercase font-bold">Total Classes</p>
                    <p className="text-xl font-black text-white">{currentSchedule.length}</p>
                  </div>
                  <div className="bg-emerald-500/20 px-4 py-2 rounded-xl text-center">
                    <p className="text-[10px] text-emerald-400 uppercase font-bold">Batches</p>
                    <p className="text-xl font-black text-white">{Object.keys(groupedSchedule).length}</p>
                  </div>
                  {currentSchedule.length > 0 && (
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handlePurgeEntireMatrix}
                      className="px-4 py-2 bg-red-600 text-white font-bold text-sm rounded-xl shadow-lg"
                    >
                      <Trash2 size={16}/>
                    </motion.button>
                  )}
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { fetchHubIntel(); successToast("Refreshed!"); }}
                    className="px-4 py-2 bg-slate-700 text-white font-bold text-sm rounded-xl shadow-lg"
                  >
                    <RefreshCw size={16} className="mr-1"/> Refresh
                  </motion.button>
                </div>
              </div>

              {Object.keys(groupedSchedule).length === 0 ? (
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="py-20 text-center bg-slate-800/60 backdrop-blur-xl rounded-2xl border-2 border-dashed border-slate-600"
                >
                  <Activity size={48} className="mx-auto text-slate-500 mb-4"/>
                  <p className="text-slate-400 font-bold uppercase text-sm mb-2">No Timetable Found</p>
                  <p className="text-slate-500 text-xs">Total schedule entries: {currentSchedule.length}</p>
                  {currentSchedule.length > 0 && (
                    <p className="text-emerald-400 text-xs mt-2">Data exists! Refreshing...</p>
                  )}
                </motion.div>
              ) : (
                <div className="space-y-8">
                  {Object.keys(groupedSchedule).map((batchName, idx) => {
                    const batchClasses = groupedSchedule[batchName];
                    // Check if this is a G1/G2 batch
                    const isG1 = /G1$/i.test(batchName);
                    const isG2 = /G2$/i.test(batchName);
                    const subGroupBadge = isG1 ? 'bg-blue-500/20 text-blue-400' : (isG2 ? 'bg-purple-500/20 text-purple-400' : 'bg-red-500/20 text-red-400');
                    return (
                      <motion.div 
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        id={`timetable-${batchName}`}
                        className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 md:p-8 shadow-xl border border-slate-700"
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-l-4 border-red-500 pl-4">
                          <div className="flex items-center gap-3">
                            <LayoutGrid className="text-red-500" size={24}/>
                            <h3 className="text-xl font-black text-white uppercase">{batchName}</h3>
                            <span className={`px-3 py-1 text-xs font-bold rounded-full ${subGroupBadge}`}>{batchClasses.length} Classes</span>
                            {isG1 && <span className="px-2 py-1 bg-blue-500/30 text-blue-300 text-[10px] font-bold rounded uppercase">Group 1</span>}
                            {isG2 && <span className="px-2 py-1 bg-purple-500/30 text-purple-300 text-[10px] font-bold rounded uppercase">Group 2</span>}
                          </div>
                          <div className="flex gap-2">
                            <motion.button 
                              whileHover={{ scale: 1.1 }}
                              onClick={() => handleExportExcel(batchName, batchClasses)}
                              className="p-3 bg-blue-500/20 text-blue-400 rounded-xl hover:bg-blue-500 hover:text-white transition-colors"
                            >
                              <FileSpreadsheet size={18}/>
                            </motion.button>
                            <motion.button 
                              whileHover={{ scale: 1.1 }}
                              onClick={() => handleDownloadTimetable(batchName)}
                              className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500 hover:text-white transition-colors"
                            >
                              <Download size={18}/>
                            </motion.button>
                            <motion.button 
                              whileHover={{ scale: 1.1 }}
                              onClick={() => handlePurgeBatch(batchName, batchClasses)}
                              className="p-3 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-colors"
                            >
                              <Trash2 size={18}/>
                            </motion.button>
                          </div>
                        </div>
                        
                        <ZoomableTimetable>
                          <div className="min-w-[700px] bg-slate-900 rounded-2xl p-4">
                            <div className="grid grid-cols-7 gap-2">
                              <div className="col-span-1 space-y-2 pt-8">
                                {timeSlots.map(s => (
                                  <div key={s} className="h-16 flex items-center justify-end pr-4 border-r border-slate-700">
                                    <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                      <Clock size={12} className="text-red-500"/> {s.split(' - ')[0]}
                                    </span>
                                  </div>
                                ))}
                              </div>
                              {days.map(d => (
                                <div key={d} className="col-span-1 space-y-2 text-center">
                                  <h1 className="text-sm font-bold text-white uppercase py-2 border-b border-slate-700">{d.slice(0,3)}</h1>
                                  {timeSlots.map((s, i) => {
                                    const session = batchClasses.find(cs => cs.day === d && cs.timeSlot === s);
                                    // G1/G2 styling
                                    const isG1Batch = /G1$/i.test(batchName);
                                    const isG2Batch = /G2$/i.test(batchName);
                                    const sessionBg = session 
                                      ? (isG1Batch ? 'bg-blue-500/20 border-blue-500/50 hover:border-blue-400' 
                                        : (isG2Batch ? 'bg-purple-500/20 border-purple-500/50 hover:border-purple-400'
                                          : 'bg-red-500/20 border-red-500/50 hover:border-red-400'))
                                      : 'bg-slate-800 border-slate-700 opacity-30';
                                    return (
                                      <motion.div 
                                        key={i}
                                        whileHover={{ scale: 1.02 }}
                                        className={`h-20 rounded-xl border flex flex-col items-center justify-center p-1.5 relative group transition-all ${sessionBg}`}
                                      >
                                        {session ? (
                                          <>
                                            <p className="text-[9px] font-bold text-white uppercase truncate w-full">{session.subject}</p>
                                            <p className="text-[7px] text-red-400 font-semibold truncate w-full">{session.subjectCode}</p>
                                            <div className="flex items-center gap-1 mt-0.5">
                                              <span className="text-[7px] text-slate-400 font-semibold">R-{session.room}</span>
                                              <span className="text-[7px] text-emerald-400 font-semibold">{session.facultyUid || session.faculty?.uid}</span>
                                            </div>
                                            {session.studentGroup && session.studentGroup !== '0' && (
                                              <span className={`text-[6px] font-bold mt-0.5 ${isG1Batch ? 'text-blue-400' : 'text-purple-400'}`}>
                                                {session.studentGroup}
                                              </span>
                                            )}
                                            {session.studentGroup === '0' && (
                                              <span className="text-[6px] text-slate-500 font-bold mt-0.5">
                                                0
                                              </span>
                                            )}
                                            <motion.button 
                                              whileHover={{ scale: 1.2 }}
                                              onClick={() => handlePurgeNode(session._id)}
                                              className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                            >
                                              <Trash2 size={10}/>
                                            </motion.button>
                                          </>
                                        ) : (
                                          <span className="text-[8px] text-slate-500 uppercase">-</span>
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
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* SCANNER VIEW */}
          {view === 'scanner' && (
            <motion.div 
              key="scanner"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="max-w-xl mx-auto"
            >
              <motion.div 
                className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 shadow-xl border border-slate-700"
              >
                <motion.button 
                  whileHover={{ x: -5 }}
                  onClick={() => setView('main')} 
                  className="flex items-center gap-2 text-slate-400 hover:text-red-600 font-bold uppercase text-sm tracking-wider mb-6"
                >
                  <ArrowLeft size={18}/> Back
                </motion.button>

                <div className="text-center mb-8">
                  <motion.div 
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-16 h-16 bg-gradient-to-br from-red-600 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-600/30"
                  >
                    <Building2 size={32} className="text-white"/>
                  </motion.div>
                  <h2 className="text-2xl font-black text-white mb-2">Room Scanner</h2>
                  <p className="text-slate-400 text-sm">Find available rooms</p>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Day</label>
                    <select 
                      className="w-full p-4 bg-slate-700 border border-slate-600 rounded-xl outline-none focus:border-red-600 font-semibold text-white"
                      value={query.day} 
                      onChange={e => setQuery({...query, day: e.target.value})}
                    >
                      {days.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Time Slot</label>
                    <select 
                      className="w-full p-4 bg-slate-700 border border-slate-600 rounded-xl outline-none focus:border-red-600 font-semibold text-white"
                      value={query.timeSlot} 
                      onChange={e => setQuery({...query, timeSlot: e.target.value})}
                    >
                      {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={findRooms}
                  className="w-full bg-gradient-to-r from-red-600 to-red-500 py-4 rounded-xl text-white font-bold uppercase tracking-wider shadow-lg shadow-red-600/30"
                >
                  Find Room
                </motion.button>
              </motion.div>
            </motion.div>
          )}

          {/* SCANNER RESULTS */}
          {view === 'scanner_results' && (
            <motion.div 
              key="scanner_res"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-2xl shadow-lg border border-slate-700">
                <motion.button 
                  whileHover={{ x: -5 }}
                  onClick={() => setView('scanner')} 
                  className="flex items-center gap-2 text-slate-400 hover:text-red-600 font-bold uppercase text-sm tracking-wider"
                >
                  <ArrowLeft size={18}/> Reset Scanner
                </motion.button>
                <p className="text-red-400 font-bold uppercase text-sm">{availableRooms.length} Available Rooms Found</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {availableRooms.map((r, i) => {
                  const isLab = r.type?.toLowerCase().includes('lab') || r.type?.toLowerCase().includes('practical');
                  return (
                    <motion.div 
                      key={r.roomNumber}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      whileHover={{ y: -5 }}
                      className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-center shadow-xl border border-slate-700 hover:border-red-600 transition-all"
                    >
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-2">Room</p>
                      <h3 className="text-3xl font-black text-white mb-3">R-{r.roomNumber}</h3>
                      <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                        isLab ? 'bg-red-600/20 text-red-400 border border-red-600/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {isLab ? 'Practical Lab' : 'Theory Room'}
                      </span>
                      <div className="mt-4 pt-4 border-t border-slate-700 flex items-center justify-center gap-2">
                        <UserIcon size={14} className="text-red-400"/>
                        <span className="text-white font-bold text-sm">Capacity: {r.capacity}</span>
                      </div>
                    </motion.div>
                  );
                })}
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
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">LPU Neural HUB • HOD Portal</p>
        </motion.div>
      </div>
    </div>
  );
};

export default HODDashboard;
