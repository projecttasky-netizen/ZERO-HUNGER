import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { Logo } from './LandingPage';

const teamMembers = [
  {
    name: "Μέλπω Πιτταρά",
    role: "Μέντορας",
    quote: "Τεχνολογία που ενδυναμώνει, καινοτομία που εμπνέει, και συστήματα που κάνουν την εκπαίδευση, την υγεία και την προσβασιμότητα πιο δίκαιες.",
    img: "https://ccs.org.cy/assets/storage/ccs_women/0511202510045915-Melpo%20Pittara.jpg"
  },
  {
    name: "Ηλίας Γεωργίου",
    role: "Web Developer",
    quote: "Εξερευνώντας τεχνολογία, δημιουργικότητα και γνώση για να φτιάχνουμε λύσεις που εμπνέουν και ανοίγουν νέους δρόμους.",
    img: "https://i.postimg.cc/8kx74K6f/me.jpg"
  },
  {
    name: "Μυριάνθη Χριστοφή",
    role: "Ανάλυση Δεδομένων",
    quote: "Κάθε τρόφιμο μετράει: σώσε, μοιράσου, βοήθησε τους γύρω σου, με την τεχνολογία στο πλευρό σου.",
    img: "https://picsum.photos/seed/member1/200/200"
  },
  {
    name: "Ντιάνα Φεοντόροβα",
    role: "Ανάλυση Δεδομένων",
    quote: "Πιστεύω ότι το έργο μας θα βοηθήσει πραγματικά τους ανθρώπους και ολόκληρο τον κόσμο γενικά!",
    img: "https://picsum.photos/seed/member2/200/200"
  },
  {
    name: "Στυλιάνα Παπουή",
    role: "Designer",
    quote: "Ο σχεδιασμός είναι η γλώσσα της αλλαγής. Δημιουργούμε εμπειρίες που κάνουν τη διαφορά.",
    img: "https://picsum.photos/seed/member3/200/200"
  },
  {
    name: "Βασιλική Παπαδοπούλου",
    role: "Designer",
    quote: "Η αισθητική συναντά την κοινωνική προσφορά. Σχεδιάζουμε για ένα καλύτερο αύριο.",
    img: "https://picsum.photos/seed/member4/200/200"
  }
];

export default function TeamPage() {
  return (
    <div className="min-h-screen bg-[#fbf9f4] font-sans">
      <header className="bg-white/85 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3 font-extrabold text-xl tracking-tight">
            <Logo className="w-10 h-10" />
            <span>Zero Hunger PGL</span>
          </Link>
          <Link to="/" className="flex items-center gap-2 text-slate-600 hover:text-brand transition-colors font-bold">
            <ArrowLeft className="w-4 h-4" /> Επιστροφή
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-24">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-extrabold mb-6"
          >
            Η Ομάδα μας
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-slate-600 max-w-2xl mx-auto"
          >
            Γνωρίστε τους ανθρώπους πίσω από το Zero Hunger PGL που εργάζονται καθημερινά για έναν κόσμο χωρίς σπατάλη.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {teamMembers.map((member, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-xl transition-all flex flex-col md:flex-row gap-8 items-center md:items-start"
            >
              <div className="w-32 h-32 rounded-full overflow-hidden flex-shrink-0 border-4 border-brand/10">
                <img src={member.img} alt={member.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-1">{member.name}</h3>
                <div className="text-brand font-bold text-sm uppercase tracking-wider mb-4">{member.role}</div>
                <p className="text-slate-600 italic leading-relaxed">"{member.quote}"</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-24 bg-white p-12 rounded-[40px] border border-slate-200 text-center shadow-sm">
          <h2 className="text-3xl font-extrabold mb-6">Συνεργάτες & Υποστηρικτές</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-12 items-center opacity-70 grayscale hover:grayscale-0 transition-all">
            <div className="flex flex-col items-center gap-4">
              <img src="https://www.beactive.cy/media/com_jbusinessdirectory/pictures/companies/238/cropped-1694510170.jpeg" alt="Παγκύπριο Γυμνάσιο" className="h-24 object-contain" referrerPolicy="no-referrer" />
              <span className="font-bold text-sm">Παγκύπριο Γυμνάσιο</span>
            </div>
            <div className="flex flex-col items-center gap-4">
              <img src="https://latsia-geri.eu/wp-content/uploads/2024/06/logoGR.png" alt="Δήμος Λατσιών-Γερίου" className="h-24 object-contain" referrerPolicy="no-referrer" />
              <span className="font-bold text-sm">Δήμος Λατσιών-Γερίου</span>
            </div>
            <div className="flex flex-col items-center gap-4">
              <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOEAAADhCAMAAAAJbSJIAAAAkFBMVEX/WgD/////UAD/TAD/vKH/7OD/VAD/zLf/mG3/s5r/0r//TwD/SgD//vv/8un/yLf/p4P/+fP/wKj/fUb/rY3/3M3/mnT/7eX/g1L/tJP/vaP/38v/cCv/h1n/mXr/qIr/xq7/0Lz/jl7/djX/n3z/ZiD/39X/YAD/YxH/eD//5dr/ZR3/k2n/lXH/fU7/1skE0SVVAAADfElEQVR4nO3c8VLaQBDH8fOSrkoCQhQQilUELCDW93+7hhmnf3SmdyGbu71Nf58n2O8kl5Dk1BgAAAAAAAAAAAAAAOgnK41CBy6WuajlLHBiObkSdlcELhyhEIUoRCEKUYhCFKIQhShEIQpRiEIUohCFKEQhClGIQh2F2fdvwnIbttAUmbDQgQAAAADwnyCi8+6toqXQu75Y6rSsNKunH8+LvHq5bmX9mmpifdxos62m7F1j4xQfLsgWu6d82sXzb5KFNtuM37rb8JdaIZU/n+ed1aVXaOnU0bmZZCEVu0WA91bpFGarKshu21QKi/1LiLxkCu0+D9SXRiHZccDd4AkUZodjuL4EConCnaBJFBb33d7fkyssHgL3CRcSdf4LJq1Ce4jxBzWChcUsQp9kYbmIEihXWF7HCRQrpHWkQKlCGsQKFCosI9wlRAuLeEdQpjDeGhQqzJYxAwUKs3HUwPiF9iluYPRCWg0jFz7HLmzzPD+ZflYP29lNK5u4gdnFb9RGL7Md2cJaailuoD1dlje/3ZRpfwD8C+0ueSAcXj9S8P9q0TH7eUFf/q4trw7cNg/MjfRLwDbeG98oBqtMetg2Gj/zjk6qri5/0H3TA6jyBK3Zhvf6bSk9aUu22Zu10X3grfUBNXp7f9yrXIFnze4Ug9g/sjpETb7Qr5VeYs7opkmgypvgl7LBKhzoPUPrQ/jqD5zqvYjWMv/70bneq2iNNt7A4UpzoLH+z0wzxZfRM+91plK9CA09eheh9IhMtvIVPqpehPWV1Pd2ptL6OPHF+2A4kZ6Qy/o2PUnvWmIrPY++c+WL0Ji95xCetBfSh+cQ6r4VGv8yVL8KTeFehkP1gWbvvhsq/71Wo1/uk/Sg/Trje3+h/1ZhrHvnxVL/MizcX9S0/+Y2vg/3o730fB1wvih90/wC8cu78yRd6F+GtHIWfvRgGbofDjc9KHTuLxlKj9cBcn5zmih/fXFmnTsRj30ovHUVTntws3AXDtQ/WKAQhRqgUHo+PhRKz8eHQun5+FAoPR8fCqXn40Oh9Hx8KJSejw+F0vPxoVB6Pj4USs/Hh0Lp+fhQKD0fHwql5+NDofR8fCiUno8PhdLz8aFQej4+FErPx4dC6fn4UCg9Hx8KpefjQ6H0fHwolJ6Pry4c/tPVugeFxpYOfQgEAAAAAAAAAAAAAAAI5jdCU1fsi75FnQAAAABJRU5ErkJggg==" alt="Foody" className="h-24 object-contain" referrerPolicy="no-referrer" />
              <span className="font-bold text-sm">Foody</span>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-12 border-t border-slate-200 text-center text-slate-400 text-sm">
        ©eliasgeorgiou Όλα τα δικαιώματα κατοχυρωμένα.
      </footer>
    </div>
  );
}
