import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download } from 'lucide-react';
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
      {/* 🚀 BOTTOM INSTALL POPUP - COMPACT */}
      <AnimatePresence>
        {showInstallBtn && (
          <motion.div 
            initial={{ y: 100, x: '-50%', opacity: 0, scale: 0.9 }} 
            animate={{ y: 0, x: '-50%', opacity: 1, scale: 1 }} 
            exit={{ y: 100, x: '-50%', opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 250, damping: 25 }}
            className="fixed bottom-4 left-1/2 z-[3000] w-[95%] max-w-xs bg-gradient-to-r from-slate-800 to-slate-900 backdrop-blur-xl border border-orange-500/30 rounded-xl shadow-xl shadow-orange-500/20 flex items-center justify-between gap-3 px-3 py-2.5"
          >
            <div className="flex items-center gap-2.5">
              <motion.div 
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow"
              >
                <img src="/logo192.png" alt="LPU" className="w-6 h-6 object-contain"/>
              </motion.div>
              <div className="text-left">
                <p className="text-white font-semibold text-xs">Install App</p>
                <p className="text-slate-400 text-[10px]">Get offline access</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleInstallClick}
                className="flex items-center gap-1 bg-gradient-to-r from-orange-500 to-red-500 px-3 py-1.5 rounded-lg text-white font-semibold text-[11px]"
              >
                <Download size={12} />
                Install
              </motion.button>
              <button onClick={dismissInstall} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
                <X size={14}/>
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