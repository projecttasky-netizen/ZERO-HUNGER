import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ChefHat, Smartphone, ArrowRight, CheckCircle2, Users, Mail, MapPin, Phone, UtensilsCrossed, Wheat, Bot, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { GoogleGenAI } from "@google/genai";
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const RESCUE_ROUTES_CONTENT = `
## 🔁 Rescue Routes – Αναλυτική Περιγραφή

Το **Rescue Routes** είναι ένα δομημένο σύστημα καθημερινής συλλογής και άμεσης διανομής πλεονάζοντων τροφίμων από επιχειρήσεις προς άτομα ή οργανισμούς που έχουν ανάγκη. Λειτουργεί με βάση σταθερά δρομολόγια, συγκεκριμένα χρονικά παράθυρα και συντονισμένη διαχείριση.

---

## 🧩 Πώς λειτουργεί στην πράξη

### 1. Συνεργασίες με σημεία συλλογής

Οι βασικοί συνεργάτες είναι:

* Αρτοποιεία (ψωμί, σφολιατοειδή)
* Ξενοδοχεία (πρωινά, buffet leftovers)
* Σούπερ μάρκετ / αγορές (προϊόντα κοντά στη λήξη)

Κάθε συνεργάτης:

* Δηλώνει **συγκεκριμένες ώρες διαθεσιμότητας**
* Καθορίζει **τι είδους τρόφιμα προσφέρει**
* Ενημερώνει για ποσότητες (σταθερές ή μεταβαλλόμενες)

---

### 2. Σχεδιασμός διαδρομών (Routing)

Οι διαδρομές είναι:

* **Καθημερινές και επαναλαμβανόμενες**
* Βελτιστοποιημένες για **ελάχιστο χρόνο και κόστος μεταφοράς**
* Προσαρμοσμένες σε:

  * τοποθεσία σημείων
  * ώρες λειτουργίας
  * χωρητικότητα οχημάτων

Παράδειγμα:

\`\`\`
Route A:
07:00 – Bakery 1
07:20 – Bakery 2
08:00 – Hotel 1
08:30 – Παράδοση σε κοινωνική κουζίνα
\`\`\`

---

### 3. Συλλογή & Έλεγχος

Κατά τη συλλογή:

* Ελέγχεται η **καταλληλότητα τροφίμων**
* Γίνεται βασική **καταγραφή (τύπος, ποσότητα, ώρα)**
* Χρησιμοποιούνται κατάλληλα μέσα (π.χ. ψυγεία όπου χρειάζεται)

---

### 4. Άμεση διανομή (Last-mile delivery)

Τα τρόφιμα:

* Παραδίδονται **εντός λίγων ωρών**
* Πηγαίνουν σε:

  * κοινωνικές δομές
  * ΜΚΟ
  * οικογένειες σε ανάγκη

Σημαντικό: Δεν υπάρχει αποθήκευση μεγάλης διάρκειας → όλα κινούνται γρήγορα.

---

## ⚙️ Τεχνολογική Υποστήριξη (αν γίνει app)

Μπορεί να στηριχθεί σε μια web/mobile εφαρμογή με:

### 📱 Για τους συνεργάτες

* Δήλωση διαθέσιμων τροφίμων σε real-time
* Επιλογή ωρών παραλαβής

### 🚚 Για τους οδηγούς

* Navigation με routes
* Live ενημέρωση για αλλαγές
* Καταγραφή παραλαβών

### 🧠 Backend σύστημα

* Route optimization (π.χ. shortest path / VRP)
* Scheduling
* Data tracking (ποσότητες, περιοχές, ανάγκες)

---

## 📊 Οφέλη

### 🌍 Περιβαλλοντικά

* Μείωση σπατάλης τροφίμων
* Μείωση εκπομπών από απορρίμματα

### 🤝 Κοινωνικά

* Υποστήριξη ευάλωτων ομάδων
* Καλύτερη κατανομή πόρων

### 🏪 Για επιχειρήσεις

* Θετική εικόνα
* Μείωση αποβλήτων

---

## ⚠️ Προκλήσεις

* Συντονισμός χρόνων (κάθε λεπτό μετράει)
* Ασφάλεια τροφίμων
* Μεταβαλλόμενες ποσότητες
* Ανάγκη για αξιόπιστους εθελοντές ή οδηγούς
`;

const COOK_SMART_CONTENT = `
## 🍳 Cook Smart – Αναλυτική Περιγραφή

Το **Cook Smart** είναι ένα εκπαιδευτικό πρόγραμμα μαγειρικής που στοχεύει στη μείωση της σπατάλης τροφίμων μέσα από πρακτικά εργαστήρια για σχολεία και κοινότητες, με τη συμμετοχή τοπικών σεφ.

Δεν είναι απλώς μάθημα μαγειρικής — είναι συνδυασμός εκπαίδευσης, βιωματικής εμπειρίας και αλλαγής καθημερινών συνηθειών.

---

## 🧩 Δομή του προγράμματος

### 1. Εκπαιδευτικά εργαστήρια

Πραγματοποιούνται σε:

* Σχολεία (μαθητές)
* Κοινοτικά κέντρα
* Δήμους / οργανώσεις

Κάθε εργαστήριο περιλαμβάνει:

* Σύντομη θεωρία (τι είναι σπατάλη τροφίμων)
* Πρακτική μαγειρική
* Συμμετοχή όλων (hands-on)

---

### 2. Ρόλος των τοπικών σεφ

Οι σεφ:

* Δείχνουν **πρακτικές τεχνικές αξιοποίησης τροφίμων**
* Μοιράζονται επαγγελματικά tips
* Προσαρμόζουν συνταγές με βάση διαθέσιμα υλικά

Παράδειγμα:

* Μπαγιάτικο ψωμί → κρουτόν, πουτίγκα, breadcrumbs
* Λαχανικά που περισσεύουν → σούπες, stir-fry, πίτες

---

### 3. Θεματικές ενότητες

Κάθε εργαστήριο μπορεί να έχει διαφορετικό θέμα:

* 🥦 **Χρήση “άσχημων” λαχανικών** (που συνήθως πετιούνται)
* 🍞 **Αξιοποίηση leftovers**
* 🧊 **Σωστή αποθήκευση τροφίμων**
* 📅 **Κατανόηση ημερομηνιών λήξης**
* 🛒 **Έξυπνες αγορές (meal planning)**

---

## 🧠 Τι μαθαίνουν οι συμμετέχοντες

* Πώς να χρησιμοποιούν **όλα τα μέρη ενός τροφίμου**
* Πώς να μειώνουν τα υπολείμματα στο σπίτι
* Πώς να οργανώνουν γεύματα χωρίς περιττές αγορές
* Πώς να μετατρέπουν “υπολείμματα” σε πλήρη γεύματα

---

## ⚙️ Πώς οργανώνεται

### 📍 Διάρκεια

* 1–2 ώρες ανά εργαστήριο
* ή κύκλος μαθημάτων (π.χ. 4 εβδομάδες)

### 👥 Μέγεθος ομάδας

* 10–25 άτομα για καλύτερη συμμετοχή

### 🧰 Υλικά

* Απλά, καθημερινά τρόφιμα
* Συχνά χρησιμοποιούνται τρόφιμα που θα πετιόντουσαν

---

## 📊 Οφέλη

### 🌱 Περιβαλλοντικά

* Μείωση απορριμμάτων τροφίμων
* Καλύτερη χρήση πόρων

### 👨👩👧 Κοινωνικά

* Εκπαίδευση νέων και οικογενειών
* Δημιουργία κοινότητας

### 🍽️ Πρακτικά

* Εξοικονόμηση εξόδων στο σπίτι
* Βελτίωση διατροφικών συνηθειών

---

## ⚠️ Προκλήσεις

* Εύρεση διαθέσιμων σεφ
* Οργάνωση χώρου & εξοπλισμού
* Εμπλοκή συμμετεχόντων (ειδικά μαθητών)
* Διατήρηση ενδιαφέροντος σε επαναλαμβανόμενα sessions

---

## 💡 Αν το δεις σαν project

Μπορείς να το εξελίξεις σε:

### 📱 Ψηφιακή πλατφόρμα

* Κλείσιμο θέσεων σε workshops
* Video tutorials
* Συνταγές “no waste”

### 🏫 Εκπαιδευτικό πρόγραμμα

* Συνεργασία με σχολεία
* Πιστοποιημένα workshops

### 🎥 Content (social / app)

* Short videos με tips
* Before/after recipes (από leftovers)
`;

const FOODLINK_CY_CONTENT = `
## 📱 FoodLink CY – Αναλυτική Περιγραφή

Το **FoodLink CY** είναι μια ψηφιακή εφαρμογή που συνδέει σε πραγματικό χρόνο επιχειρήσεις ή άτομα που διαθέτουν πλεονάζοντα τρόφιμα (δωρητές) με κοινωνικούς φορείς που τα χρειάζονται.

Στόχος είναι η **άμεση αξιοποίηση διαθέσιμων τροφίμων**, μειώνοντας τη σπατάλη και ενισχύοντας την κοινωνική υποστήριξη.

---

## 🧩 Πώς λειτουργεί

### 1. Καταχώρηση δωρεάς (Donor side)

Ο δωρητής:

* Δηλώνει διαθέσιμα τρόφιμα μέσω της εφαρμογής
* Συμπληρώνει:

  * τύπο τροφίμων (π.χ. έτοιμα γεύματα, ψωμί, λαχανικά)
  * ποσότητα
  * χρονικό περιθώριο παραλαβής
* Προσθέτει φωτογραφία (προαιρετικά)

👉 Η καταχώρηση γίνεται σε λίγα δευτερόλεπτα.

---

### 2. Real-time ειδοποίηση

Μόλις καταχωρηθεί μια δωρεά:

* Οι κοντινοί κοινωνικοί φορείς λαμβάνουν **άμεση ειδοποίηση**
* Βλέπουν:

  * τοποθεσία
  * είδος και ποσότητα
  * χρόνο διαθεσιμότητας

---

### 3. Ανάληψη (Matching)

Ο φορέας:

* Κάνει “accept” τη δωρεά
* Δεσμεύει το pickup
* Ενημερώνει για εκτιμώμενο χρόνο άφιξης

👉 Αποφεύγονται διπλές αναλήψεις.

---

### 4. Παραλαβή & επιβεβαίωση

* Ο φορέας παραλαμβάνει τα τρόφιμα
* Γίνεται επιβεβαίωση μέσω app
* Καταγράφεται η συναλλαγή (log)

---

## ⚙️ Βασικές λειτουργίες εφαρμογής

### 📍 Χάρτης (Map view)

* Προβολή διαθέσιμων δωρεών σε πραγματικό χρόνο
* Φίλτρα (τύπος τροφίμων, απόσταση, χρόνος)

---

### 🔔 Notifications

* Instant alerts για νέες δωρεές
* Υπενθυμίσεις για pickups

---

### 📊 Dashboard

Για όλους τους χρήστες:

* συνολικές δωρεές
* ποσότητες τροφίμων που σώθηκαν
* εκτιμώμενη κοινωνική επίδραση

---

### ⭐ Rating / αξιοπιστία

* Αξιολόγηση δωρητών & φορέων
* Βελτίωση αξιοπιστίας συστήματος

---

## 🧠 Backend λογική

* **Matching engine**:

  * απόσταση
  * διαθεσιμότητα
  * προτεραιότητα φορέων

* **Real-time σύστημα**:

  * WebSockets ή push notifications

* **Data tracking**:

  * ποιοι δίνουν / ποιοι λαμβάνουν
  * συχνότητα / ποσότητες

---

## 🔗 Πώς συνδέεται με άλλα concepts

* **Rescue Routes**
  → για προγραμματισμένες συλλογές

* **Cook Smart**
  → για εκπαίδευση στη σωστή χρήση τροφίμων

👉 Το FoodLink CY λειτουργεί ως ο “ψηφιακός κόμβος” που τα ενώνει όλα.

---

## 📊 Οφέλη

### 🌍 Περιβαλλοντικά

* Μείωση σπατάλης τροφίμων
* Λιγότερα απορρίμματα

### 🤝 Κοινωνικά

* Γρήγορη βοήθεια σε όσους έχουν ανάγκη
* Καλύτερη κατανομή πόρων

### 🏪 Για επιχειρήσεις

* Εύκολη διαδικασία δωρεάς
* Ενίσχυση εταιρικής εικόνας

---

## ⚠️ Προκλήσεις

* Διαχείριση real-time δεδομένων
* Αξιοπιστία χρηστών
* Ασφάλεια τροφίμων
* Ανάγκη για γρήγορη ανταπόκριση

---

## 💡 Αν θέλεις να το υλοποιήσεις

Μπορείς να το στήσεις ως:

### 🧱 Τεχνολογία

* Frontend: React / Next.js
* Backend: Node.js (Express)
* Database: MongoDB ή PostgreSQL
* Real-time: Firebase ή WebSockets

---

### 🔑 Core features για MVP

* Login / signup
* Δημιουργία δωρεάς
* Accept request
* Notifications
* Map view
`;

export const Logo = ({ className = "" }: { className?: string }) => (
  <div className={`relative flex items-center justify-center ${className}`}>
    <Wheat className="w-full h-full text-brand absolute opacity-80" />
    <UtensilsCrossed className="w-2/3 h-2/3 text-brand-green relative z-10 rotate-12" />
  </div>
);

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [prediction, setPrediction] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [selectedProgram, setSelectedProgram] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data());
        } else if (currentUser.email === 'spidereg2010@gmail.com') {
          setUserProfile({ userType: 'admin' });
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const getDashboardLink = () => {
    if (!userProfile) return "/login";
    if (userProfile.userType === 'admin') return "/admin";
    if (userProfile.userType === 'donor') return "/donor";
    if (userProfile.userType === 'recipient') return "/recipient";
    return "/login";
  };

  const handleScan = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const file = formData.get('image') as File;
    const weight = formData.get('weight') as string;
    const weightMode = formData.get('weightMode') as string;

    if (!file) return;

    setIsScanning(true);
    setPrediction(null);

    try {
      // 1. Upload to server for processing and storage
      const uploadRes = await axios.post('/api/upload', formData);
      setImageUrl(uploadRes.data.imageUrl);

      // 2. Call Gemini directly from frontend
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
      
      // Convert file to base64 for Gemini
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.readAsDataURL(file);
      });
      const base64Data = await base64Promise;

      const prompt = `Identify the food in this image. 
      Provide the name of the food and an estimated weight in grams if possible.
      Format the response as JSON: { "food": "name", "confidence": 0.95, "estimatedWeight": "250g" }`;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  data: base64Data,
                  mimeType: file.type,
                },
              },
            ],
          },
        ],
      });

      const text = result.text;
      const jsonMatch = text?.match(/\{.*\}/s);
      const aiResult = jsonMatch ? JSON.parse(jsonMatch[0]) : { food: text, confidence: 0.5, estimatedWeight: "unknown" };

      setPrediction(`${aiResult.food} (${(aiResult.confidence * 100).toFixed(2)}%) — Βάρος: ${weightMode === "auto" ? aiResult.estimatedWeight : weight}`);
    } catch (err) {
      console.error("Scanning error:", err);
      setPrediction("Σφάλμα κατά τη σάρωση. Βεβαιωθείτε ότι το API key είναι έγκυρο.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="min-h-screen font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link to="/" className="flex items-center gap-3 font-extrabold text-xl tracking-tight">
              <Logo className="w-10 h-10" />
              <span className="bg-gradient-to-r from-brand to-brand-green bg-clip-text text-transparent">
                Zero Hunger PGL
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              <a href="#mission" className="text-slate-700 hover:text-brand transition-colors">Αποστολή</a>
              <a href="#cyprus-stats" className="text-slate-700 hover:text-brand transition-colors">Στατιστικά</a>
              <a href="#programs" className="text-slate-700 hover:text-brand transition-colors">Προγράμματα</a>
              <Link to="/team" className="text-slate-700 hover:text-brand transition-colors">Ομάδα</Link>
              <a href="#faq" className="text-slate-700 hover:text-brand transition-colors">FAQ</a>
            </nav>

            <div className="flex items-center gap-4">
              <Link 
                to={getDashboardLink()} 
                className="hidden sm:block px-4 py-2 rounded-full border border-slate-200 font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                {user ? 'Dashboard' : 'Σύνδεση'}
              </Link>
              {!user && (
                <Link to="/login" className="px-6 py-2 rounded-full bg-brand text-white font-bold shadow-lg hover:opacity-90 transition-opacity">
                  Εγγραφή
                </Link>
              )}
              <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-white border-b border-slate-200 px-4 py-6 flex flex-col gap-4"
          >
            <a href="#mission" onClick={() => setIsMenuOpen(false)}>Αποστολή</a>
            <a href="#cyprus-stats" onClick={() => setIsMenuOpen(false)}>Στατιστικά</a>
            <a href="#programs" onClick={() => setIsMenuOpen(false)}>Προγράμματα</a>
            <Link to="/team" onClick={() => setIsMenuOpen(false)}>Ομάδα</Link>
            <a href="#faq" onClick={() => setIsMenuOpen(false)}>FAQ</a>
            <Link to={getDashboardLink()} className="font-bold text-brand" onClick={() => setIsMenuOpen(false)}>
              {user ? 'Dashboard' : 'Σύνδεση'}
            </Link>
          </motion.div>
        )}
      </header>

      <main>
        {/* Hero & Scanner */}
        <section className="py-12 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-green/10 text-brand-green text-sm font-medium mb-6">
                <CheckCircle2 className="w-4 h-4" />
                <span>Zero Hunger Initiative</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
                Μαζί για έναν κόσμο <br />
                <span className="text-brand">χωρίς πείνα</span>
              </h1>
              <p className="text-lg text-slate-600 mb-8 max-w-lg">
                Η Zero Hunger PGL χρησιμοποιεί τεχνητή νοημοσύνη για να συνδέσει πλεονάζοντα τρόφιμα με αυτούς που τα έχουν ανάγκη. Σαρώστε, δωρίστε, σώστε.
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="px-4 py-2 rounded-full bg-slate-100 border border-slate-200 text-sm text-slate-600">#FoodRescue</div>
                <div className="px-4 py-2 rounded-full bg-slate-100 border border-slate-200 text-sm text-slate-600">#ZeroWaste</div>
                <div className="px-4 py-2 rounded-full bg-slate-100 border border-slate-200 text-sm text-slate-600">#Cyprus</div>
              </div>
            </div>

            <div className="bg-panel p-8 rounded-3xl border border-slate-200 card-shadow">
              <h3 className="text-xl font-bold mb-4">Δοκιμάστε τη σάρωση</h3>
              <p className="text-slate-500 mb-6">Ανεβάστε μια φωτογραφία τροφίμου για να το αναγνωρίσει η AI μας.</p>
              
              <form onSubmit={handleScan} className="space-y-6">
                <div className="space-y-2">
                  <input 
                    type="file" 
                    name="image" 
                    accept="image/*" 
                    required 
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand outline-none"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-slate-700">Τρόπος βάρους</label>
                    <select name="weightMode" className="w-full p-2 bg-white border border-slate-200 rounded-lg">
                      <option value="manual">Manual</option>
                      <option value="auto">Auto (AI)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-slate-700">Βάρος (kg)</label>
                    <input type="text" name="weight" defaultValue="0.5" className="w-full p-2 bg-white border border-slate-200 rounded-lg" />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isScanning}
                  className="w-full py-4 bg-brand text-white font-bold rounded-full shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isScanning ? "Σάρωση..." : "Έναρξη Σάρωσης"}
                </button>
              </form>

              {prediction && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 p-4 bg-white border border-brand/20 rounded-2xl"
                >
                  <h4 className="font-bold text-brand mb-2">Αποτέλεσμα:</h4>
                  <p className="text-slate-700">{prediction}</p>
                  {imageUrl && (
                    <img src={imageUrl} alt="Processed" className="mt-4 rounded-xl w-full max-h-48 object-cover border border-slate-100" />
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </section>

        {/* Mission */}
        <section id="mission" className="py-24 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Η Αποστολή μας</h2>
              <p className="text-slate-600 max-w-2xl mx-auto">Να σταματήσουμε τη σπατάλη τροφίμων και να εξαλείψουμε την πείνα, με σεβασμό στον άνθρωπο και τον πλανήτη.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { title: "Διάσωση & διανομή", desc: "Συλλέγουμε ασφαλή πλεονάζοντα τρόφιμα από εστίαση & λιανική και τα διανέμουμε άμεσα μέσω κοινωνικών παντοπωλείων." },
                { title: "Εκπαίδευση", desc: "Προγράμματα για σχολεία και νοικοκυριά: σωστή αποθήκευση, μαγείρεμα χωρίς σπατάλη, κατανόηση ημερομηνιών λήξης." },
                { title: "Υποστήριξη πολιτικής", desc: "Κατευθυντήριες γραμμές και κίνητρα για δωρεές τροφίμων και μείωση οργανικών αποβλήτων." }
              ].map((item, i) => (
                <div key={i} className="bg-white p-8 rounded-3xl border border-slate-200 card-shadow">
                  <h3 className="text-xl font-bold mb-4 text-brand">{item.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section id="cyprus-stats" className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-8 mb-16">
              {[
                { num: "125k", label: "Μερίδες διασωθείσες" },
                { num: "85", label: "Επιχειρήσεις-δωρητές" },
                { num: "37", label: "Δήμοι/Κοινότητες" },
                { num: "21k", label: "Τόνοι CO₂e αποφύγαμε" }
              ].map((stat, i) => (
                <div key={i} className="bg-gradient-to-b from-brand-green/10 to-brand/5 p-8 rounded-3xl border border-brand-green/20 text-center">
                  <div className="text-4xl font-extrabold text-slate-900 mb-2">{stat.num}</div>
                  <div className="text-slate-600 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200 card-shadow grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-extrabold mb-6">Κύπρος: Η κατάσταση σήμερα</h2>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center flex-shrink-0 text-brand font-bold">1</div>
                    <div>
                      <h4 className="font-bold">294 kg/κάτοικο/έτος</h4>
                      <p className="text-slate-600 text-sm">Από τις υψηλότερες τιμές σπατάλης τροφίμων στην ΕΕ.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center flex-shrink-0 text-brand font-bold">2</div>
                    <div>
                      <h4 className="font-bold">48.000 τόνοι/έτος</h4>
                      <p className="text-slate-600 text-sm">Εκτιμώμενη ποσότητα απορριπτόμενων τροφίμων από νοικοκυριά.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center flex-shrink-0 text-brand font-bold">3</div>
                    <div>
                      <h4 className="font-bold">Στόχος: μείωση 50%</h4>
                      <p className="text-slate-600 text-sm">Ευθυγράμμιση με ευρωπαϊκές κατευθύνσεις έως το 2030.</p>
                    </div>
                  </div>
                </div>
              </div>
              <img 
                src="https://picsum.photos/seed/foodwaste/800/600" 
                alt="Food Waste" 
                className="rounded-2xl w-full h-full object-cover shadow-xl"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </section>

        {/* Programs */}
        <section id="programs" className="py-24 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h2 className="text-3xl font-extrabold mb-2">Προγράμματα & Δράσεις</h2>
                <p className="text-slate-600">Κλιμακώνονται παγκύπρια με τοπικές συνεργασίες.</p>
              </div>
              <button className="hidden md:flex items-center gap-2 text-brand font-bold hover:gap-3 transition-all">
                Δες όλα <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { 
                  title: "Rescue Routes", 
                  tag: "Logistics",
                  color: "from-blue-500 to-cyan-500",
                  icon: <Logo className="w-6 h-6" />, 
                  desc: "Καθημερινές διαδρομές συλλογής από αρτοποιεία, ξενοδοχεία και αγορές για άμεση διανομή.",
                  img: "https://picsum.photos/seed/rescue/800/600",
                  content: RESCUE_ROUTES_CONTENT
                },
                { 
                  title: "Cook Smart", 
                  tag: "Education",
                  color: "from-orange-500 to-red-500",
                  icon: <ChefHat className="w-6 h-6" />, 
                  desc: "Εργαστήρια μαγειρικής χωρίς σπατάλη για σχολεία & κοινότητες με τοπικούς σεφ.",
                  img: "https://picsum.photos/seed/cooking/800/600",
                  content: COOK_SMART_CONTENT
                },
                { 
                  title: "FoodLink CY", 
                  tag: "Platform",
                  color: "from-emerald-500 to-teal-500",
                  icon: <Smartphone className="w-6 h-6" />, 
                  desc: "Η εφαρμογή μας που συνδέει δωρητές τροφίμων με κοινωνικούς φορείς σε πραγματικό χρόνο.",
                  img: "https://picsum.photos/seed/app/800/600",
                  content: FOODLINK_CY_CONTENT
                }
              ].map((prog, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-[32px] border border-slate-200 overflow-hidden card-shadow group hover:border-brand/30 transition-all duration-500"
                >
                  <div className="h-56 overflow-hidden relative">
                    <img src={prog.img} alt={prog.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider text-slate-800 shadow-sm">
                        {prog.tag}
                      </span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-6">
                      <p className="text-white text-xs font-medium leading-relaxed">
                        Κάντε κλικ για να ανακαλύψετε πώς το {prog.title} αλλάζει τα δεδομένα στην Κύπρο.
                      </p>
                    </div>
                  </div>
                  <div className="p-8">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${prog.color} flex items-center justify-center text-white mb-6 shadow-lg shadow-brand/10 group-hover:scale-110 transition-transform duration-500`}>
                      {prog.icon}
                    </div>
                    <h3 className="text-2xl font-extrabold mb-3 group-hover:text-brand transition-colors">{prog.title}</h3>
                    <p className="text-slate-600 mb-8 text-sm leading-relaxed line-clamp-2">{prog.desc}</p>
                    <button 
                      onClick={() => setSelectedProgram(prog)}
                      className="group/btn relative inline-flex items-center gap-2 text-brand font-bold text-sm"
                    >
                      <span>Μάθε περισσότερα</span>
                      <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center group-hover/btn:bg-brand group-hover/btn:text-white transition-all duration-300">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                      <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand group-hover/btn:w-full transition-all duration-300" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Volunteer CTA */}
        <section id="volunteer" className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-r from-brand/10 to-brand-green/10 rounded-[40px] border border-slate-200 p-8 md:p-16 grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl font-extrabold mb-6">Γίνε Εθελοντής</h2>
                <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                  Κάνε δικές σου τις διασώσεις τροφίμων, υποστήριξε δράσεις, γίνε πρεσβευτής στην κοινότητά σου. Η βοήθειά σου είναι πολύτιμη.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="text-brand-green w-5 h-5" />
                    <span className="font-medium">Συμμετοχή σε Rescue Routes</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="text-brand-green w-5 h-5" />
                    <span className="font-medium">Υποστήριξη εκδηλώσεων</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="text-brand-green w-5 h-5" />
                    <span className="font-medium">Διανομή τροφίμων</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-slate-200 card-shadow">
                <form className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Ονοματεπώνυμο</label>
                    <input type="text" placeholder="π.χ. Άννα Χαραλάμπους" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Email</label>
                    <input type="email" placeholder="you@example.com" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Πόλη</label>
                    <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand">
                      <option>Λευκωσία</option>
                      <option>Λεμεσός</option>
                      <option>Λάρνακα</option>
                      <option>Πάφος</option>
                      <option>Αμμόχωστος</option>
                    </select>
                  </div>
                  <button type="submit" className="w-full py-4 bg-brand text-white font-bold rounded-full shadow-lg hover:opacity-90 transition-opacity">
                    Δήλωσε ενδιαφέρον
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-24 bg-slate-50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-extrabold text-center mb-12">Συχνές Ερωτήσεις</h2>
            <div className="space-y-4 mb-12">
              {[
                { q: "Είναι ασφαλές το φαγητό που διανέμετε;", a: "Ναι. Ακολουθούμε αυστηρά πρωτόκολλα ασφάλειας τροφίμων και συνεργαζόμαστε με επαγγελματίες υγείας." },
                { q: "Πώς μπορώ να γίνω δωρητής τροφίμων;", a: "Επικοινώνησε μαζί μας για αξιολόγηση. Παρέχουμε κάδους, εκπαίδευση και πρόγραμμα συλλογής." },
                { q: "Παρέχετε αποδείξεις για φορολογικούς σκοπούς;", a: "Ναι, για κάθε δωρεά εκδίδεται σχετική απόδειξη από τον οργανισμό μας." }
              ].map((faq, i) => (
                <details key={i} className="bg-white border border-slate-200 rounded-2xl overflow-hidden group">
                  <summary className="p-6 font-bold cursor-pointer list-none flex justify-between items-center hover:bg-slate-50 transition-colors">
                    {faq.q}
                    <ArrowRight className="w-4 h-4 group-open:rotate-90 transition-transform" />
                  </summary>
                  <div className="p-6 pt-0 text-slate-600 border-t border-slate-100">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>

            <div className="bg-brand/5 border border-brand/20 rounded-[32px] p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-brand text-white flex items-center justify-center mx-auto mb-6 shadow-xl shadow-brand/20">
                <Bot className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-extrabold mb-3">Έχετε περισσότερες ερωτήσεις;</h3>
              <p className="text-slate-600 mb-8 max-w-md mx-auto">
                Ο AI βοηθός μας είναι διαθέσιμος 24/7 για να σας λύσει κάθε απορία σχετικά με το FoodLink CY.
              </p>
              <Link 
                to="/chat" 
                className="inline-flex items-center gap-3 px-8 py-4 bg-brand text-white font-bold rounded-full shadow-xl shadow-brand/20 hover:scale-105 transition-all active:scale-95"
              >
                Ρωτήστε τον AI Βοηθό <Sparkles className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <Link to="/" className="flex items-center gap-3 font-extrabold text-xl mb-6">
                <Logo className="w-10 h-10" />
                <span>Zero Hunger PGL</span>
              </Link>
              <p className="text-slate-500 max-w-sm mb-6">
                Μια πρωτοβουλία για τη μείωση της σπατάλης τροφίμων στην Κύπρο μέσω της τεχνολογίας και της κοινότητας.
              </p>
              <div className="flex gap-4">
                {/* Social icons placeholders */}
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-brand hover:text-white transition-all cursor-pointer">FB</div>
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-brand hover:text-white transition-all cursor-pointer">IG</div>
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-brand hover:text-white transition-all cursor-pointer">TW</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold mb-6">Πλοήγηση</h4>
              <ul className="space-y-4 text-slate-500">
                <li><a href="#mission" className="hover:text-brand transition-colors">Αποστολή</a></li>
                <li><a href="#cyprus-stats" className="hover:text-brand transition-colors">Στατιστικά</a></li>
                <li><a href="#programs" className="hover:text-brand transition-colors">Προγράμματα</a></li>
                <li><Link to="/chat" className="hover:text-brand transition-colors flex items-center gap-2">AI Βοηθός <Sparkles className="w-3 h-3" /></Link></li>
                <li><Link to="/team" className="hover:text-brand transition-colors">Ομάδα</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-6">Επικοινωνία</h4>
              <ul className="space-y-4 text-slate-500">
                <li className="flex items-center gap-3"><Mail className="w-4 h-4" /> lyk-pagkyprion-lef@schools.ac.cy</li>
                <li className="flex items-center gap-3"><Phone className="w-4 h-4" /> +357 22 466711</li>
                <li className="flex items-center gap-3"><MapPin className="w-4 h-4" /> ΠΑΓΚΥΠΡΙΟΝ ΓΥΜΝΑΣΙΟΝ</li>
              </ul>
            </div>
          </div>
          <div className="pt-12 border-t border-slate-100 text-center text-slate-400 text-sm">
            ©eliasgeorgiou
          </div>
        </div>
      </footer>

      {/* Program Modal */}
      <AnimatePresence>
        {selectedProgram && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProgram(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-6xl max-h-[90vh] bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row"
            >
              {/* Sidebar / Image Area */}
              <div className="hidden md:block w-1/3 relative overflow-hidden">
                <img 
                  src={selectedProgram.img} 
                  alt={selectedProgram.title} 
                  className="absolute inset-0 w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className={`absolute inset-0 bg-gradient-to-br ${selectedProgram.color} opacity-40 mix-blend-multiply`} />
                <div className="absolute inset-0 flex flex-col justify-end p-12 text-white">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center mb-6 border border-white/30">
                    {selectedProgram.icon}
                  </div>
                  <h3 className="text-4xl font-extrabold mb-4 leading-tight">{selectedProgram.title}</h3>
                  <p className="text-white/80 font-medium text-lg leading-relaxed">
                    {selectedProgram.tag} Initiative
                  </p>
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 flex flex-col bg-white">
                <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                  <div className="md:hidden flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${selectedProgram.color} flex items-center justify-center text-white shadow-lg`}>
                      {selectedProgram.icon}
                    </div>
                    <h3 className="text-xl font-extrabold">{selectedProgram.title}</h3>
                  </div>
                  <div className="hidden md:block">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                      Πληροφορίες Προγράμματος
                    </span>
                  </div>
                  <button 
                    onClick={() => setSelectedProgram(null)}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-900"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-8 md:p-16 custom-scrollbar">
                  <div className="prose prose-slate max-w-none 
                    prose-headings:font-extrabold prose-headings:text-slate-900 prose-headings:tracking-tight
                    prose-p:text-slate-600 prose-p:leading-relaxed prose-p:text-lg
                    prose-strong:text-brand prose-strong:font-bold
                    prose-hr:border-slate-100 prose-hr:my-12
                    prose-li:text-slate-600 prose-li:marker:text-brand
                    prose-img:rounded-3xl prose-img:shadow-xl
                    prose-blockquote:border-l-4 prose-blockquote:border-brand prose-blockquote:bg-brand/5 prose-blockquote:p-6 prose-blockquote:rounded-r-2xl
                  ">
                    <ReactMarkdown>{selectedProgram.content}</ReactMarkdown>
                  </div>
                </div>

                <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-6">
                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                          <img src={`https://i.pravatar.cc/100?u=${selectedProgram.title}${i}`} alt="User" />
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-slate-500 font-medium">
                      <span className="text-slate-900 font-bold">120+</span> άτομα συμμετέχουν ήδη
                    </p>
                  </div>
                  <button 
                    onClick={() => setSelectedProgram(null)}
                    className="w-full sm:w-auto px-10 py-4 bg-brand text-white font-bold rounded-full shadow-xl shadow-brand/20 hover:scale-105 transition-all active:scale-95"
                  >
                    Έλα μαζί μας
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
