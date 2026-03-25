import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, ShieldCheck } from 'lucide-react';
import Layout from './components/Layout';
import Login from './pages/Login';
import RoleSelection from './pages/RoleSelection';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import HODDashboard from './pages/HODDashboard';
import TimetableView from './pages/TimetableView';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';

// Helper: Protected Route logic
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/" />;
  return children;
};

function App() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  useEffect(() => {
    // 1. Capture the Install Event
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('beforeinstallprompt triggered');
      e.preventDefault();
      setDeferredPrompt(e);
      // 🔥 LocalStorage check hata diya hai taaki popup wapas aa sake
      setShowInstallBtn(true);
    });

    // 2. Hide button after installation
    window.addEventListener('appinstalled', () => {
      setShowInstallBtn(false);
      setDeferredPrompt(null);
      console.log('LPU HUB: Installed successfully');
    });
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt(); 
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install');
    }
    setDeferredPrompt(null);
    setShowInstallBtn(false);
  };

  const dismissInstall = () => {
    setShowInstallBtn(false);
    // 🎯 Note: Yahan hum localStorage mein save nahi kar rahe hain taaki 
    // refresh karne par ya browser dwara event trigger hone par ye fir dikhe.
  };

  return (
    <>
      {/* 🚀 SLIM TOP-CENTER INSTALL POPUP */}
      <AnimatePresence>
        {showInstallBtn && (
          <motion.div 
            initial={{ y: -100, x: '-50%', opacity: 0 }} 
            animate={{ y: 0, x: '-50%', opacity: 1 }} 
            exit={{ y: -100, x: '-50%', opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 22 }}
            className="fixed top-6 left-1/2 z-[3000] w-[90%] max-w-[340px] bg-[#020617]/95 backdrop-blur-xl border border-orange-500/30 rounded-2xl p-3 shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex items-center justify-between gap-3 overflow-hidden"
          >
            {/* Background Glow */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-orange-600/5 to-transparent pointer-events-none" />

            {/* Left Info */}
            <div className="flex items-center gap-3 relative z-10 pl-1">
              <div className="bg-orange-600 p-1.5 rounded-lg shadow-lg">
                <ShieldCheck size={16} className="text-white animate-pulse" />
              </div>
              <div className="text-left leading-none">
                <p className="text-white font-black text-[9px] uppercase italic tracking-wider">LPU Neural Hub</p>
                <p className="text-slate-500 text-[7px] font-bold uppercase mt-0.5">V4.5 Terminal Ready</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 relative z-10">
              <button 
                onClick={handleInstallClick}
                className="bg-white text-black px-4 py-1.5 rounded-lg text-[9px] font-black uppercase italic shadow-lg hover:bg-orange-600 hover:text-white transition-all flex items-center gap-1.5"
              >
                <Download size={12} /> GET APP
              </button>
              
              <button onClick={dismissInstall} className="p-1 text-slate-600 hover:text-white transition-colors">
                <X size={16}/>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/select-role" element={<RoleSelection />} />
          <Route path="/register" element={<Register />} />

          {/* ADMIN DASHBOARD ROUTES */}
          <Route path="/admin" element={<ProtectedRoute><Layout><AdminDashboard /></Layout></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute><Layout><AdminDashboard /></Layout></ProtectedRoute>} />
          <Route path="/admin/rooms" element={<ProtectedRoute><Layout><AdminDashboard /></Layout></ProtectedRoute>} />
          <Route path="/admin/subjects" element={<ProtectedRoute><Layout><AdminDashboard /></Layout></ProtectedRoute>} />
          <Route path="/admin/batches" element={<ProtectedRoute><Layout><AdminDashboard /></Layout></ProtectedRoute>} />
          <Route path="/admin/broadcast" element={<ProtectedRoute><Layout><AdminDashboard /></Layout></ProtectedRoute>} />

          {/* HOD DASHBOARD ROUTES */}
          <Route path="/hod" element={<ProtectedRoute><Layout><HODDashboard /></Layout></ProtectedRoute>} />
          <Route path="/hod/optimizer" element={<ProtectedRoute><Layout><HODDashboard /></Layout></ProtectedRoute>} />
          <Route path="/hod/monitor" element={<ProtectedRoute><Layout><HODDashboard /></Layout></ProtectedRoute>} />
          <Route path="/hod/availability" element={<ProtectedRoute><Layout><HODDashboard /></Layout></ProtectedRoute>} />
          <Route path="/hod/broadcast" element={<ProtectedRoute><Layout><HODDashboard /></Layout></ProtectedRoute>} />
          <Route path="/hod/personnel" element={<ProtectedRoute><Layout><HODDashboard /></Layout></ProtectedRoute>} />

          {/* FACULTY ROUTES */}
          <Route path="/faculty" element={<ProtectedRoute><Layout><TeacherDashboard /></Layout></ProtectedRoute>} />
          <Route path="/faculty/stats" element={<ProtectedRoute><Layout><TeacherDashboard /></Layout></ProtectedRoute>} />
          <Route path="/faculty/global" element={<ProtectedRoute><Layout><TimetableView /></Layout></ProtectedRoute>} />

          {/* STUDENT ROUTES */}
          <Route path="/student" element={<ProtectedRoute><Layout><StudentDashboard /></Layout></ProtectedRoute>} />
          <Route path="/student/broadcast" element={<ProtectedRoute><Layout><StudentDashboard /></Layout></ProtectedRoute>} />

          {/* 404 REDIRECT */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;