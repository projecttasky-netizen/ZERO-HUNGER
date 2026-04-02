import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import TeamPage from './components/TeamPage';
import AIChatPage from './components/AIChatPage';
import LoginPage from './components/LoginPage';
import AdminDashboard from './components/AdminDashboard';
import DonorDashboard from './components/DonorDashboard';
import RecipientDashboard from './components/RecipientDashboard';
import DeliveryDashboard from './components/DeliveryDashboard';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const ProtectedRoute = ({ children, requiredRole }: { children: React.ReactNode, requiredRole?: string }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data());
        } else if (currentUser.email === 'spidereg2010@gmail.com') {
          setUserProfile({ userType: 'admin', isApproved: true });
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#fbf9f4]"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand"></div></div>;

  if (!user) return <Navigate to="/login" />;

  if (requiredRole && userProfile?.userType !== requiredRole) {
    if (userProfile?.userType === 'admin') return <Navigate to="/admin" />;
    if (userProfile?.userType === 'donor') return <Navigate to="/donor" />;
    if (userProfile?.userType === 'recipient') return <Navigate to="/recipient" />;
    if (userProfile?.userType === 'delivery') return <Navigate to="/delivery" />;
    return <Navigate to="/" />;
  }

  if (!userProfile?.isApproved && userProfile?.userType !== 'admin') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fbf9f4] p-4 text-center">
        <h1 className="text-2xl font-extrabold mb-2">Σε αναμονή έγκρισης</h1>
        <p className="text-slate-600 mb-6">Ο λογαριασμός σας δεν έχει εγκριθεί ακόμα από τον διαχειριστή.</p>
        <button onClick={() => auth.signOut()} className="px-6 py-2 bg-brand text-white rounded-full font-bold">Αποσύνδεση</button>
      </div>
    );
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/team" element={<TeamPage />} />
        <Route path="/chat" element={<AIChatPage />} />
        <Route path="/login" element={<LoginPage />} />
        
        <Route path="/admin" element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/donor" element={
          <ProtectedRoute requiredRole="donor">
            <DonorDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/recipient" element={
          <ProtectedRoute requiredRole="recipient">
            <RecipientDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/delivery" element={
          <ProtectedRoute requiredRole="delivery">
            <DeliveryDashboard />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}
