import React, { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { Search, MapPin, LogOut, UtensilsCrossed, ShoppingBag, ShoppingCart, Trash2, CheckCircle, X, Plus, History } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Logo } from './LandingPage';

export default function RecipientDashboard() {
  const [availableFood, setAvailableFood] = useState<any[]>([]);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  useEffect(() => {
    const fetchUserLocation = async () => {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          setUserLocation(userDoc.data().location);
        }
      }
    };
    fetchUserLocation();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'donations'), where('status', '==', 'available'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAvailableFood(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'donations');
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'donations'), where('recipientId', '==', auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMyRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'donations');
    });
    return () => unsubscribe();
  }, []);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d.toFixed(1);
  };

  const sortedFood = [...availableFood].sort((a, b) => {
    if (!userLocation || !a.location || !b.location) return 0;
    const distA = parseFloat(calculateDistance(userLocation.lat, userLocation.lng, a.location.lat, a.location.lng));
    const distB = parseFloat(calculateDistance(userLocation.lat, userLocation.lng, b.location.lat, b.location.lng));
    return distA - distB;
  });

  const addToCart = (food: any) => {
    if (cart.find(item => item.id === food.id)) {
      setStatusMessage({ type: 'error', text: "Το προϊόν είναι ήδη στο καλάθι." });
      return;
    }
    setCart([...cart, food]);
    setStatusMessage({ type: 'success', text: "Προστέθηκε στο καλάθι!" });
  };

  const removeFromCart = (foodId: string) => {
    setCart(cart.filter(item => item.id !== foodId));
  };

  const handleSendOrder = async () => {
    if (cart.length === 0) return;
    setIsSubmittingOrder(true);
    try {
      const promises = cart.map(item => 
        updateDoc(doc(db, 'donations', item.id), {
          status: 'requested',
          recipientId: auth.currentUser?.uid,
          requestedAt: new Date().toISOString()
        })
      );
      await Promise.all(promises);
      setCart([]);
      setIsCartOpen(false);
      setStatusMessage({ type: 'success', text: "Η παραγγελία σας στάλθηκε επιτυχώς!" });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'donations');
      setStatusMessage({ type: 'error', text: "Αποτυχία αποστολής παραγγελίας." });
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbf9f4] font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3 font-extrabold text-xl">
            <Logo className="w-8 h-8" />
            <span>Recipient Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <ShoppingCart className="w-6 h-6" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                  {cart.length}
                </span>
              )}
            </button>
            <button onClick={() => auth.signOut()} className="flex items-center gap-2 text-red-500 font-bold">
              <LogOut className="w-5 h-5" /> Αποσύνδεση
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
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

        <div className="flex flex-col md:flex-row gap-8 items-center justify-between mb-12">
          <h2 className="text-3xl font-extrabold">Διαθέσιμα Τρόφιμα</h2>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input type="text" placeholder="Αναζήτηση..." className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-full outline-none focus:ring-2 focus:ring-brand" />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {sortedFood.length === 0 ? (
            <div className="col-span-full text-center py-24 bg-white rounded-[40px] border border-slate-200">
              <ShoppingBag className="w-16 h-16 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 italic">Δεν υπάρχουν διαθέσιμα τρόφιμα αυτή τη στιγμή.</p>
            </div>
          ) : (
            sortedFood.map(food => (
              <motion.div 
                key={food.id}
                whileHover={{ y: -5 }}
                className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all"
              >
                <img src={food.imageUrl} className="w-full h-48 object-cover" alt={food.food} />
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold">{food.food}</h3>
                    <span className="px-3 py-1 bg-brand/10 text-brand text-xs font-bold rounded-full">{food.weight}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 text-sm mb-6">
                    <MapPin className="w-4 h-4" /> 
                    {userLocation && food.location ? (
                      <span>{calculateDistance(userLocation.lat, userLocation.lng, food.location.lat, food.location.lng)} χλμ μακριά</span>
                    ) : (
                      <span>Λευκωσία</span>
                    )}
                  </div>
                  <button 
                    onClick={() => addToCart(food)}
                    className="w-full py-3 bg-brand-green text-white font-bold rounded-2xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" /> Προσθήκη στο Καλάθι
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>

        <AnimatePresence>
          {isCartOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsCartOpen(false)}
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
              />
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 p-8 overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-extrabold flex items-center gap-3">
                    <ShoppingCart className="text-brand" /> Το Καλάθι μου
                  </h2>
                  <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingBag className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 italic">Το καλάθι σας είναι άδειο.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {cart.map(item => (
                      <div key={item.id} className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <img src={item.imageUrl} className="w-20 h-20 rounded-xl object-cover" alt={item.food} />
                        <div className="flex-1">
                          <h4 className="font-bold">{item.food}</h4>
                          <p className="text-sm text-slate-500">{item.weight}</p>
                        </div>
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="p-2 text-red-400 hover:text-red-500"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                    
                    <div className="pt-8 border-t border-slate-200">
                      <button 
                        onClick={handleSendOrder}
                        disabled={isSubmittingOrder}
                        className="w-full py-4 bg-brand text-white font-bold rounded-full shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-3"
                      >
                        {isSubmittingOrder ? "Αποστολή..." : "Αποστολή Παραγγελίας"}
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-12">
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <History className="w-5 h-5 text-brand-green" /> Οι Αιτήσεις μου
                  </h3>
                  <div className="space-y-4">
                    {myRequests.length === 0 ? (
                      <p className="text-sm text-slate-400 italic">Δεν έχετε κάνει ακόμα κάποια αίτηση.</p>
                    ) : (
                      myRequests.map(req => (
                        <div key={req.id} className="flex items-center gap-4 p-3 bg-white border border-slate-100 rounded-xl">
                          <div className="w-10 h-10 bg-brand-green/10 rounded-lg flex items-center justify-center text-brand-green">
                            <CheckCircle className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <h5 className="text-sm font-bold">{req.food}</h5>
                            <p className="text-[10px] text-slate-400">{new Date(req.requestedAt || req.createdAt).toLocaleDateString()}</p>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 rounded-full text-slate-500 uppercase">
                            {req.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
