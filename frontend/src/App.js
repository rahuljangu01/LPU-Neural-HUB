import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
  // Agar token nahi hai toh seedha Login page par bhej do
  if (!token) return <Navigate to="/" />;
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* --- AUTH SECTION --- */}
        <Route path="/" element={<Login />} />
        <Route path="/select-role" element={<RoleSelection />} />
        <Route path="/register" element={<Register />} />

        {/* --- ADMIN SECTION --- */}
        {/* In sabhi paths par AdminDashboard load hoga aur wo location.pathname se content badal dega */}
        <Route path="/admin" element={<ProtectedRoute><Layout><AdminDashboard /></Layout></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute><Layout><AdminDashboard /></Layout></ProtectedRoute>} />
        <Route path="/admin/rooms" element={<ProtectedRoute><Layout><AdminDashboard /></Layout></ProtectedRoute>} />
        <Route path="/admin/subjects" element={<ProtectedRoute><Layout><AdminDashboard /></Layout></ProtectedRoute>} />
        <Route path="/admin/batches" element={<ProtectedRoute><Layout><AdminDashboard /></Layout></ProtectedRoute>} />
        <Route path="/admin/broadcast" element={<ProtectedRoute><Layout><AdminDashboard /></Layout></ProtectedRoute>} /> {/* YE MISSING THA */}

        {/* --- HOD SECTION --- */}
        <Route path="/hod" element={<ProtectedRoute><Layout><HODDashboard /></Layout></ProtectedRoute>} />
        <Route path="/hod/optimizer" element={<ProtectedRoute><Layout><HODDashboard /></Layout></ProtectedRoute>} />
        <Route path="/hod/monitor" element={<ProtectedRoute><Layout><HODDashboard /></Layout></ProtectedRoute>} />
        <Route path="/hod/availability" element={<ProtectedRoute><Layout><HODDashboard /></Layout></ProtectedRoute>} />
        <Route path="/hod/broadcast" element={<ProtectedRoute><Layout><HODDashboard /></Layout></ProtectedRoute>} />
        <Route path="/hod/personnel" element={<ProtectedRoute><Layout><HODDashboard /></Layout></ProtectedRoute>} />

        {/* --- FACULTY SECTION --- */}
        <Route path="/faculty" element={<ProtectedRoute><Layout><TeacherDashboard /></Layout></ProtectedRoute>} />
        <Route path="/faculty/stats" element={<ProtectedRoute><Layout><TeacherDashboard /></Layout></ProtectedRoute>} />
        <Route path="/faculty/global" element={<ProtectedRoute><Layout><TimetableView /></Layout></ProtectedRoute>} />

        {/* --- STUDENT SECTION --- */}
        <Route path="/student" element={<ProtectedRoute><Layout><StudentDashboard /></Layout></ProtectedRoute>} />
        <Route path="/student/broadcast" element={<ProtectedRoute><Layout><StudentDashboard /></Layout></ProtectedRoute>} />

        {/* --- 404 REDIRECT --- */}
        {/* Agar koi galat URL type karega toh Login page par redirect hoga */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;