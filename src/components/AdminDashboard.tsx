import React, { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, addDoc, getDoc, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Check, X, Users, Clock, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Logo } from './LandingPage';

interface RegistrationRequest {
  id: string;
  username: string;
  email: string;
  userType: 'donor' | 'recipient';
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export default function AdminDashboard() {
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Check if user is admin in Firestore
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists() && userDoc.data().userType === 'admin') {
          setIsAdmin(true);
        } else if (currentUser.email === 'spidereg2010@gmail.com') {
          // Bootstrap the first admin
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!isAdmin) return;

    const q = query(collection(db, 'registration_requests'), where('status', '==', 'pending'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reqs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as RegistrationRequest[];
      setRequests(reqs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'registration_requests');
    });

    return () => unsubscribe();
  }, [isAdmin]);

  const handleApprove = async (request: RegistrationRequest) => {
    try {
      // 1. Update request status
      await updateDoc(doc(db, 'registration_requests', request.id), {
        status: 'approved'
      });

      // 2. Update the user record in Firestore using UID
      // We stored uid in the registration request
      const requestDoc = await getDoc(doc(db, 'registration_requests', request.id));
      const uid = requestDoc.data()?.uid;

      if (uid) {
        await updateDoc(doc(db, 'users', uid), {
          isApproved: true
        });
      }

      setStatusMessage({ type: 'success', text: `Ο χρήστης ${request.username} εγκρίθηκε επιτυχώς!` });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'registration_requests/users');
      setStatusMessage({ type: 'error', text: 'Αποτυχία έγκρισης χρήστη.' });
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await updateDoc(doc(db, 'registration_requests', requestId), {
        status: 'rejected'
      });
      setStatusMessage({ type: 'success', text: 'Η αίτηση απορρίφθηκε.' });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `registration_requests/${requestId}`);
      setStatusMessage({ type: 'error', text: 'Αποτυχία απόρριψης αίτησης.' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbf9f4]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fbf9f4] p-4 text-center">
        <ShieldCheck className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-extrabold mb-2">Πρόσβαση Απαγορεύεται</h1>
        <p className="text-slate-600 mb-6">Μόνο οι διαχειριστές έχουν πρόσβαση σε αυτή τη σελίδα.</p>
        <a href="/" className="px-6 py-2 bg-brand text-white rounded-full font-bold">Επιστροφή στην Αρχική</a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbf9f4] font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3 font-extrabold text-xl">
            <Logo className="w-8 h-8" />
            <span>Admin Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-500">{user?.email}</span>
            <button 
              onClick={() => auth.signOut()}
              className="text-sm font-bold text-red-500 hover:underline"
            >
              Αποσύνδεση
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <AnimatePresence>
          {statusMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`mb-8 p-4 rounded-2xl border ${
                statusMessage.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
              } flex items-center justify-between`}
            >
              <span className="font-medium">{statusMessage.text}</span>
              <button onClick={() => setStatusMessage(null)} className="text-sm font-bold hover:underline">Κλείσιμο</button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-2 bg-brand/10 rounded-xl text-brand">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-500 uppercase text-xs tracking-wider">Εκκρεμείς Αιτήσεις</h3>
            </div>
            <p className="text-3xl font-extrabold">{requests.length}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-2 bg-brand-green/10 rounded-xl text-brand-green">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-500 uppercase text-xs tracking-wider">Συνολικοί Χρήστες</h3>
            </div>
            <p className="text-3xl font-extrabold">--</p>
          </div>
        </div>

        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100">
            <h2 className="text-2xl font-extrabold">Αιτήσεις Εγγραφής</h2>
            <p className="text-slate-500">Διαχειριστείτε τις νέες αιτήσεις χρηστών για πρόσβαση στην πλατφόρμα.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-bold">
                  <th className="px-8 py-4">Χρήστης</th>
                  <th className="px-8 py-4">Email</th>
                  <th className="px-8 py-4">Τύπος</th>
                  <th className="px-8 py-4">Ημερομηνία</th>
                  <th className="px-8 py-4 text-right">Ενέργειες</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <AnimatePresence>
                  {requests.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-12 text-center text-slate-400 italic">
                        Δεν υπάρχουν εκκρεμείς αιτήσεις αυτή τη στιγμή.
                      </td>
                    </tr>
                  ) : (
                    requests.map((req) => (
                      <motion.tr 
                        key={req.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-8 py-6 font-bold">{req.username}</td>
                        <td className="px-8 py-6 text-slate-600">{req.email}</td>
                        <td className="px-8 py-6">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            req.userType === 'donor' 
                              ? 'bg-brand/10 text-brand' 
                              : 'bg-brand-green/10 text-brand-green'
                          }`}>
                            {req.userType === 'donor' ? 'Δωρητής' : 'Παραλήπτης'}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-slate-500 text-sm">
                          {new Date(req.createdAt).toLocaleDateString('el-GR')}
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleApprove(req)}
                              className="p-2 bg-brand-green text-white rounded-xl hover:opacity-90 transition-opacity shadow-sm"
                              title="Έγκριση"
                            >
                              <Check className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => handleReject(req.id)}
                              className="p-2 bg-red-500 text-white rounded-xl hover:opacity-90 transition-opacity shadow-sm"
                              title="Απόρριψη"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
