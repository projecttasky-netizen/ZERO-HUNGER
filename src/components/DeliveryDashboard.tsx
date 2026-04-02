import React, { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc, getDocs } from 'firebase/firestore';
import { MapPin, Navigation, Package, CheckCircle, LogOut, Loader2, Info, ArrowRight, User, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Logo } from './LandingPage';

interface Location {
  lat: number;
  lng: number;
}

interface UserProfile {
  uid: string;
  username: string;
  email: string;
  location?: Location;
  phone?: string;
}

interface Donation {
  id: string;
  food: string;
  weight: string;
  imageUrl: string;
  status: 'available' | 'requested' | 'in_transit' | 'delivered';
  donorId: string;
  recipientId?: string;
  location?: Location; // Donor location
  createdAt: string;
  deliveryId?: string;
}

export default function DeliveryDashboard() {
  const [deliveries, setDeliveries] = useState<Donation[]>([]);
  const [availableRequests, setAvailableRequests] = useState<Donation[]>([]);
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({});

  useEffect(() => {
    const fetchUserLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
          },
          (error) => console.error("Geolocation error:", error)
        );
      }
    };
    fetchUserLocation();
  }, []);

  useEffect(() => {
    if (!auth.currentUser) return;

    // 1. Listen for available requests (requested but no deliveryId)
    const qAvailable = query(collection(db, 'donations'), where('status', '==', 'requested'));
    const unsubscribeAvailable = onSnapshot(qAvailable, (snapshot) => {
      setAvailableRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Donation)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'donations');
    });

    // 2. Listen for my active deliveries
    const qMyDeliveries = query(collection(db, 'donations'), where('deliveryId', '==', auth.currentUser.uid));
    const unsubscribeMy = onSnapshot(qMyDeliveries, (snapshot) => {
      setDeliveries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Donation)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'donations');
    });

    return () => {
      unsubscribeAvailable();
      unsubscribeMy();
    };
  }, []);

  // Fetch profiles for donors and recipients
  useEffect(() => {
    const allIds = new Set<string>();
    availableRequests.forEach(d => {
      allIds.add(d.donorId);
      if (d.recipientId) allIds.add(d.recipientId);
    });
    deliveries.forEach(d => {
      allIds.add(d.donorId);
      if (d.recipientId) allIds.add(d.recipientId);
    });

    const fetchProfiles = async () => {
      const newProfiles: Record<string, UserProfile> = { ...profiles };
      const idsToFetch = Array.from(allIds).filter(id => !newProfiles[id]);

      if (idsToFetch.length === 0) return;

      const promises = idsToFetch.map(id => getDoc(doc(db, 'users', id)));
      const docs = await Promise.all(promises);
      
      docs.forEach(d => {
        if (d.exists()) {
          newProfiles[d.id] = { uid: d.id, ...d.data() } as UserProfile;
        }
      });
      setProfiles(newProfiles);
    };

    fetchProfiles();
  }, [availableRequests, deliveries]);

  const handleClaim = async (donationId: string) => {
    if (!auth.currentUser) return;
    try {
      await updateDoc(doc(db, 'donations', donationId), {
        status: 'in_transit',
        deliveryId: auth.currentUser.uid,
        claimedAt: new Date().toISOString()
      });
      setStatusMessage({ type: 'success', text: "Η διαδρομή αναλήφθηκε επιτυχώς!" });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `donations/${donationId}`);
      setStatusMessage({ type: 'error', text: "Αποτυχία ανάληψης διαδρομής." });
    }
  };

  const handleComplete = async (donationId: string) => {
    try {
      await updateDoc(doc(db, 'donations', donationId), {
        status: 'delivered',
        deliveredAt: new Date().toISOString()
      });
      setStatusMessage({ type: 'success', text: "Η παράδοση ολοκληρώθηκε!" });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `donations/${donationId}`);
      setStatusMessage({ type: 'error', text: "Αποτυχία ολοκλήρωσης παράδοσης." });
    }
  };

  const getGoogleMapsUrl = (from?: Location, to?: Location) => {
    if (!from || !to) return "#";
    return `https://www.google.com/maps/dir/?api=1&origin=${from.lat},${from.lng}&destination=${to.lat},${to.lng}&travelmode=driving`;
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbf9f4]">
        <Loader2 className="w-12 h-12 text-brand animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbf9f4] font-sans pb-20">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3 font-extrabold text-xl">
            <Logo className="w-8 h-8" />
            <span>Delivery Dashboard</span>
          </div>
          <button 
            onClick={() => auth.signOut()}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 sm:p-6 space-y-8">
        {statusMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-2xl text-sm font-bold flex items-center gap-3 ${
              statusMessage.type === 'success' ? 'bg-brand-green/10 text-brand-green' : 'bg-red-50 text-red-500'
            }`}
          >
            {statusMessage.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
            {statusMessage.text}
          </motion.div>
        )}

        {/* Active Deliveries */}
        <section>
          <h2 className="text-2xl font-extrabold mb-6 flex items-center gap-3">
            <Navigation className="w-6 h-6 text-brand" />
            Ενεργές Διαδρομές
          </h2>
          
          <div className="space-y-6">
            {deliveries.filter(d => d.status === 'in_transit').length === 0 ? (
              <div className="bg-white p-12 rounded-[32px] border border-slate-200 text-center text-slate-400">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="font-bold">Δεν έχετε ενεργές διαδρομές αυτή τη στιγμή.</p>
              </div>
            ) : (
              deliveries.filter(d => d.status === 'in_transit').map(delivery => {
                const donor = profiles[delivery.donorId];
                const recipient = delivery.recipientId ? profiles[delivery.recipientId] : null;
                
                return (
                  <motion.div 
                    key={delivery.id}
                    layout
                    className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm"
                  >
                    <div className="p-6 border-b border-slate-100 bg-brand/5 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center text-white shadow-lg shadow-brand/20">
                          <Package className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-slate-900">{delivery.food}</h3>
                          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{delivery.weight}</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-brand text-white text-[10px] font-bold uppercase tracking-widest">
                        In Transit
                      </span>
                    </div>

                    <div className="p-6 space-y-8">
                      {/* Route Steps */}
                      <div className="relative space-y-8">
                        <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-slate-100 border-l-2 border-dashed border-slate-200" />
                        
                        {/* Step 1: My Location to Donor */}
                        <div className="relative flex gap-6">
                          <div className="w-8 h-8 rounded-full bg-white border-2 border-brand flex items-center justify-center z-10">
                            <div className="w-2 h-2 rounded-full bg-brand animate-ping" />
                          </div>
                          <div className="flex-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Βήμα 1: Παραλαβή</p>
                            <h4 className="font-extrabold text-slate-900">{donor?.username || "Φόρτωση..."}</h4>
                            <p className="text-sm text-slate-500 mb-3">Παραλαβή από τον δωρητή</p>
                            <a 
                              href={getGoogleMapsUrl(userLocation || undefined, delivery.location)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-xs font-bold text-brand hover:underline"
                            >
                              <Navigation className="w-3 h-3" /> Οδηγίες προς Δωρητή
                            </a>
                          </div>
                        </div>

                        {/* Step 2: Donor to Recipient */}
                        <div className="relative flex gap-6">
                          <div className="w-8 h-8 rounded-full bg-white border-2 border-brand-green flex items-center justify-center z-10">
                            <MapPin className="w-4 h-4 text-brand-green" />
                          </div>
                          <div className="flex-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Βήμα 2: Παράδοση</p>
                            <h4 className="font-extrabold text-slate-900">{recipient?.username || "Φόρτωση..."}</h4>
                            <p className="text-sm text-slate-500 mb-3">Παράδοση στον παραλήπτη</p>
                            <a 
                              href={getGoogleMapsUrl(delivery.location, recipient?.location)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-xs font-bold text-brand-green hover:underline"
                            >
                              <Navigation className="w-3 h-3" /> Οδηγίες προς Παραλήπτη
                            </a>
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={() => handleComplete(delivery.id)}
                        className="w-full py-4 bg-brand-green text-white font-bold rounded-2xl shadow-lg shadow-brand-green/20 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-5 h-5" /> Ολοκλήρωση Παράδοσης
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </section>

        {/* Available Requests */}
        <section>
          <h2 className="text-2xl font-extrabold mb-6 flex items-center gap-3">
            <Package className="w-6 h-6 text-slate-400" />
            Διαθέσιμες Παραλαβές
          </h2>

          <div className="grid gap-4">
            {availableRequests.length === 0 ? (
              <div className="bg-white p-12 rounded-[32px] border border-slate-200 text-center text-slate-400">
                <p className="font-bold">Δεν υπάρχουν διαθέσιμες παραγγελίες για παραλαβή.</p>
              </div>
            ) : (
              availableRequests.map(request => {
                const donor = profiles[request.donorId];
                const recipient = request.recipientId ? profiles[request.recipientId] : null;
                const distance = userLocation && request.location 
                  ? calculateDistance(userLocation.lat, userLocation.lng, request.location.lat, request.location.lng)
                  : null;

                return (
                  <motion.div 
                    key={request.id}
                    layout
                    className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-6"
                  >
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 border border-slate-100">
                        <img src={request.imageUrl} alt={request.food} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900">{request.food}</h3>
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-bold mt-1">
                          <MapPin className="w-3 h-3" />
                          {distance ? `${distance} km μακριά` : "Άγνωστη απόσταση"}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-center sm:items-end gap-2 w-full sm:w-auto">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                        <span>{donor?.username || "..."}</span>
                        <ArrowRight className="w-3 h-3" />
                        <span>{recipient?.username || "..."}</span>
                      </div>
                      <button 
                        onClick={() => handleClaim(request.id)}
                        className="w-full sm:w-auto px-6 py-3 bg-brand text-white font-bold rounded-xl shadow-lg shadow-brand/20 hover:scale-105 active:scale-95 transition-all"
                      >
                        Ανάληψη Διαδρομής
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
