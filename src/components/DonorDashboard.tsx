import React, { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, doc, getDoc } from 'firebase/firestore';
import { Package, Plus, History, LogOut, Utensils, Wheat } from 'lucide-react';
import { motion } from 'motion/react';
import { Logo } from './LandingPage';
import { GoogleGenAI } from "@google/genai";
import axios from 'axios';

export default function DonorDashboard() {
  const [donations, setDonations] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [prediction, setPrediction] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'donations'), where('donorId', '==', auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setDonations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'donations');
    });
    return () => unsubscribe();
  }, []);

  const handleScan = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const file = formData.get('image') as File;
    if (!file) return;

    setIsScanning(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
      
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
      });
      const base64Data = await base64Promise;

      // Detect faces first for privacy
      const faceResult = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ 
          parts: [
            { text: "Detect all human faces in this image and return their bounding boxes as a JSON object with a 'faces' key containing an array of [ymin, xmin, ymax, xmax] where values are 0-1000. If no faces, return { \"faces\": [] }." }, 
            { inlineData: { data: base64Data, mimeType: file.type } }
          ] 
        }]
      });

      const faces = JSON.parse(faceResult.text.match(/\{.*\}/s)?.[0] || "{ \"faces\": [] }").faces || [];
      
      // Append faces to formData
      formData.append('faces', JSON.stringify(faces));

      const uploadRes = await axios.post('/api/upload', formData);
      
      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: "Identify this food and its weight in grams. Format as JSON: { \"food\": \"name\", \"weight\": \"250g\" }" }, { inlineData: { data: base64Data, mimeType: file.type } }] }]
      });

      const aiResult = JSON.parse(result.text.match(/\{.*\}/s)?.[0] || "{}");
      
      // Fetch donor's location from profile
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser?.uid || ""));
      const donorLocation = userDoc.exists() ? userDoc.data().location : null;

      await addDoc(collection(db, 'donations'), {
        donorId: auth.currentUser?.uid,
        food: aiResult.food,
        weight: aiResult.weight,
        imageUrl: uploadRes.data.imageUrl,
        status: 'available',
        createdAt: new Date().toISOString(),
        location: donorLocation
      });

      setPrediction(`Επιτυχής καταχώρηση: ${aiResult.food} (${aiResult.weight})`);
      form.reset();
    } catch (err) {
      console.error(err);
      setPrediction("Σφάλμα κατά την καταχώρηση.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbf9f4] font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3 font-extrabold text-xl">
            <Logo className="w-8 h-8" />
            <span>Donor Dashboard</span>
          </div>
          <button onClick={() => auth.signOut()} className="flex items-center gap-2 text-red-500 font-bold">
            <LogOut className="w-5 h-5" /> Αποσύνδεση
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12 grid md:grid-cols-2 gap-12">
        <section className="space-y-8">
          <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
            <h2 className="text-2xl font-extrabold mb-6 flex items-center gap-3">
              <Plus className="text-brand" /> Νέα Δωρεά
            </h2>
            <form onSubmit={handleScan} className="space-y-6">
              <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center">
                <input type="file" name="image" accept="image/*" required className="hidden" id="food-upload" />
                <label htmlFor="food-upload" className="cursor-pointer flex flex-col items-center gap-4">
                  <Utensils className="w-12 h-12 text-slate-300" />
                  <span className="text-slate-500 font-medium">Ανεβάστε φωτογραφία τροφίμου</span>
                </label>
              </div>
              <button disabled={isScanning} className="w-full py-4 bg-brand text-white font-bold rounded-full shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50">
                {isScanning ? "Επεξεργασία..." : "Καταχώρηση με AI"}
              </button>
              {prediction && <p className="text-center text-brand font-bold">{prediction}</p>}
            </form>
          </div>
        </section>

        <section className="space-y-8">
          <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
            <h2 className="text-2xl font-extrabold mb-6 flex items-center gap-3">
              <History className="text-brand-green" /> Ιστορικό Δωρεών
            </h2>
            <div className="space-y-4">
              {donations.length === 0 ? (
                <p className="text-slate-400 italic">Δεν έχετε κάνει ακόμα κάποια δωρεά.</p>
              ) : (
                donations.map(don => (
                  <div key={don.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <img src={don.imageUrl} className="w-16 h-16 rounded-xl object-cover" alt={don.food} />
                    <div className="flex-1">
                      <h4 className="font-bold">{don.food}</h4>
                      <p className="text-sm text-slate-500">{don.weight}</p>
                    </div>
                    <span className="px-3 py-1 bg-brand-green/10 text-brand-green text-xs font-bold rounded-full">
                      {don.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
