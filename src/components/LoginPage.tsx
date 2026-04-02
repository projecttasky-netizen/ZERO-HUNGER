import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, User } from 'lucide-react';
import { motion } from 'motion/react';
import axios from 'axios';
import { Logo } from './LandingPage';
import { db, auth, googleProvider, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, query, where, getDocs, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, signInWithPopup, createUserWithEmailAndPassword } from 'firebase/auth';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [userType, setUserType] = useState<'donor' | 'recipient' | 'delivery'>('donor');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const navigate = useNavigate();

  const requestLocationAndRedirect = async (user: any, userType: string) => {
    const redirect = () => {
      if (userType === 'admin') navigate('/admin');
      else if (userType === 'donor') navigate('/donor');
      else if (userType === 'recipient') navigate('/recipient');
      else if (userType === 'delivery') navigate('/delivery');
      else navigate('/');
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            await updateDoc(doc(db, 'users', user.uid), {
              location: { lat: latitude, lng: longitude }
            });
          } catch (error) {
            console.error("Error updating location:", error);
          }
          redirect();
        },
        (error) => {
          console.error("Geolocation error:", error);
          redirect();
        },
        { timeout: 10000 }
      );
    } else {
      redirect();
    }
  };

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    setStatus(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      if (user.email === 'spidereg2010@gmail.com') {
        navigate('/admin');
        return;
      }

      // Check if approved by fetching doc by UID
      const userDocRef = doc(db, 'users', user.uid);
      let userDoc;
      try {
        userDoc = await getDoc(userDocRef);
      } catch (error) {
        await auth.signOut();
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
        return;
      }

      if (!userDoc.exists() || !userDoc.data().isApproved) {
        await auth.signOut();
        setStatus({ type: 'error', message: 'Ο λογαριασμός σας δεν έχει εγκριθεί ακόμα ή δεν υπάρχει.' });
      } else {
        const userData = userDoc.data();
        const userType = userData.userType;
        
        setStatus({ type: 'success', message: 'Συνδεθήκατε επιτυχώς!' });
        await requestLocationAndRedirect(user, userType);
      }
    } catch (err: any) {
      console.error(err);
      setStatus({ type: 'error', message: 'Αποτυχία σύνδεσης με Google.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const username = formData.get('username') as string;

    setIsSubmitting(true);
    setStatus(null);

    if (!isLogin && password.length < 6) {
      setStatus({ type: 'error', message: 'Ο κωδικός πρόσβασης πρέπει να είναι τουλάχιστον 6 χαρακτήρες.' });
      setIsSubmitting(false);
      return;
    }

    try {
      if (isLogin) {
        // 1. Perform Firebase Auth login first
        let userCredential;
        try {
          userCredential = await signInWithEmailAndPassword(auth, email, password);
        } catch (error: any) {
          if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            setStatus({ type: 'error', message: 'Λανθασμένο email ή κωδικός πρόσβασης.' });
          } else if (error.code === 'auth/operation-not-allowed') {
            setStatus({ type: 'error', message: 'Η σύνδεση με Email/Password δεν είναι ενεργοποιημένη στο Firebase Console.' });
          } else {
            setStatus({ type: 'error', message: 'Σφάλμα κατά τη σύνδεση. Παρακαλώ δοκιμάστε ξανά.' });
          }
          setIsSubmitting(false);
          return;
        }

        const user = userCredential.user;

        // 2. Check if user is approved in Firestore
        const userDocRef = doc(db, 'users', user.uid);
        let userDoc;
        try {
          userDoc = await getDoc(userDocRef);
        } catch (error) {
          // If it's the admin, they might not have a doc yet
          if (user.email !== 'spidereg2010@gmail.com') {
            await auth.signOut();
            handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
            return;
          }
        }

        const userData = userDoc?.exists() ? userDoc.data() : null;
        
        if (user.email !== 'spidereg2010@gmail.com' && (!userData || !userData.isApproved)) {
          await auth.signOut();
          setStatus({ type: 'error', message: 'Ο λογαριασμός σας δεν έχει εγκριθεί ακόμα.' });
          setIsSubmitting(false);
          return;
        }

        const userType = user.email === 'spidereg2010@gmail.com' ? 'admin' : userData?.userType;
        
        setStatus({ type: 'success', message: 'Συνδεθήκατε επιτυχώς!' });
        await requestLocationAndRedirect(user, userType);
      } else {
        // Registration Logic
        // 1. Create Firebase Auth user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 2. Create pending user record in Firestore using UID as doc ID
        try {
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            username,
            email,
            userType,
            isApproved: false,
            createdAt: new Date().toISOString()
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
        }

        // 3. Create registration request for admin tracking
        try {
          await addDoc(collection(db, 'registration_requests'), {
            uid: user.uid,
            username,
            email,
            userType,
            status: 'pending',
            createdAt: new Date().toISOString()
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, 'registration_requests');
        }

        // 4. Notify Admin via Email
        await axios.post('/api/notify-registration', {
          username,
          email,
          userType
        });

        // 5. Sign out immediately since they aren't approved
        await auth.signOut();

        setStatus({ type: 'success', message: 'Ο λογαριασμός σας δημιουργήθηκε! Θα μπορείτε να συνδεθείτε μόλις εγκριθεί από τον διαχειριστή.' });
      }
    } catch (err: any) {
      console.error(err);
      let msg = 'Παρουσιάστηκε σφάλμα. Δοκιμάστε ξανά.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'Λανθασμένο email ή κωδικός πρόσβασης.';
      } else if (err.code === 'auth/operation-not-allowed') {
        msg = 'Η μέθοδος σύνδεσης/εγγραφής δεν είναι ενεργοποιημένη στο Firebase Console.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'Το email χρησιμοποιείται ήδη.';
      }
      setStatus({ type: 'error', message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbf9f4] font-sans flex items-center justify-center p-4">
      <div className="absolute top-8 left-8">
        <Link to="/" className="flex items-center gap-3 font-extrabold text-xl tracking-tight">
          <Logo className="w-10 h-10" />
          <span>Zero Hunger PGL</span>
        </Link>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white p-8 rounded-[32px] border border-slate-200 shadow-xl"
      >
        <div className="flex gap-4 mb-12 p-1 bg-slate-100 rounded-2xl">
          <button 
            onClick={() => { setIsLogin(true); setStatus(null); }}
            className={`flex-1 py-3 rounded-xl font-bold transition-all ${isLogin ? 'bg-brand text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Σύνδεση
          </button>
          <button 
            onClick={() => { setIsLogin(false); setStatus(null); }}
            className={`flex-1 py-3 rounded-xl font-bold transition-all ${!isLogin ? 'bg-brand text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Εγγραφή
          </button>
        </div>

        <h2 className="text-3xl font-extrabold mb-8 text-center">
          {isLogin ? 'Καλώς ήρθατε ξανά' : 'Δημιουργία λογαριασμού'}
        </h2>

        {status && (
          <div className={`mb-6 p-4 rounded-2xl text-sm font-bold ${status.type === 'success' ? 'bg-brand-green/10 text-brand-green' : 'bg-red-50 text-red-500'}`}>
            {status.message}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Τύπος χρήστη</label>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    type="button"
                    onClick={() => setUserType('donor')}
                    className={`py-3 rounded-2xl font-bold border-2 transition-all text-xs ${
                      userType === 'donor'
                        ? 'border-brand bg-brand/5 text-brand'
                        : 'border-slate-100 text-slate-400 hover:border-slate-200'
                    }`}
                  >
                    Δωρητής
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserType('recipient')}
                    className={`py-3 rounded-2xl font-bold border-2 transition-all text-xs ${
                      userType === 'recipient'
                        ? 'border-brand-green bg-brand-green/5 text-brand-green'
                        : 'border-slate-100 text-slate-400 hover:border-slate-200'
                    }`}
                  >
                    Παραλήπτης
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserType('delivery')}
                    className={`py-3 rounded-2xl font-bold border-2 transition-all text-xs ${
                      userType === 'delivery'
                        ? 'border-blue-500 bg-blue-50 text-blue-500'
                        : 'border-slate-100 text-slate-400 hover:border-slate-200'
                    }`}
                  >
                    Delivery
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Όνομα χρήστη</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="text" 
                    name="username"
                    placeholder="Username" 
                    required
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand" 
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="email" 
                name="email"
                placeholder="you@example.com" 
                required
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand" 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Κωδικός πρόσβασης</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="password" 
                name="password"
                placeholder="••••••••" 
                required
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand" 
              />
            </div>
          </div>

          {isLogin && (
            <div className="text-right">
              <button type="button" className="text-sm font-bold text-brand hover:underline">Ξεχάσατε τον κωδικό;</button>
            </div>
          )}

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full py-4 bg-brand text-white font-bold rounded-full shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isSubmitting ? 'Επεξεργασία...' : (isLogin ? 'Σύνδεση' : 'Δημιουργία λογαριασμού')}
          </button>

          {isLogin && (
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-slate-500 font-bold">Ή</span>
              </div>
            </div>
          )}

          {isLogin && (
            <button 
              type="button"
              onClick={handleGoogleLogin}
              disabled={isSubmitting}
              className="w-full py-4 bg-white border-2 border-slate-100 text-slate-700 font-bold rounded-full shadow-sm hover:bg-slate-50 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
              Σύνδεση με Google
            </button>
          )}
        </form>

        <div className="mt-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-brand transition-colors font-bold text-sm">
            <ArrowLeft className="w-4 h-4" /> Επιστροφή στην αρχική
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
