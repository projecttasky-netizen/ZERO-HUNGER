import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Send, Bot, User, Sparkles, Loader2, MessageSquare, Info, ShieldCheck, HeartHandshake, Receipt } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const FAQ_SUGGESTIONS = [
  {
    icon: <ShieldCheck className="w-4 h-4" />,
    text: "Είναι ασφαλές το φαγητό που διανέμετε;",
    query: "Είναι ασφαλές το φαγητό που διανέμετε; Ποιες είναι οι διαδικασίες ελέγχου;"
  },
  {
    icon: <HeartHandshake className="w-4 h-4" />,
    text: "Πώς μπορώ να γίνω δωρητής τροφίμων;",
    query: "Θέλω να γίνω δωρητής τροφίμων. Ποια είναι τα βήματα και τι είδους τρόφιμα δέχεστε;"
  },
  {
    icon: <Receipt className="w-4 h-4" />,
    text: "Παρέχετε αποδείξεις για φορολογικούς σκοπούς;",
    query: "Παρέχετε αποδείξεις για φορολογικούς σκοπούς για τις δωρεές τροφίμων;"
  }
];

export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Γεια σας! Είμαι ο ψηφιακός βοηθός του Zero Hunger PGL Πώς μπορώ να σας βοηθήσω σήμερα σχετικά με τη σπατάλη τροφίμων ή τα προγράμματά μας;',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const model = "gemini-3-flash-preview";
      const chat = genAI.chats.create({
        model: model,
        config: {
          systemInstruction: `Είσαι ο ψηφιακός βοηθός του ZERO HUNGER PGL, ενός οργανισμού στην Κύπρο που καταπολεμά τη σπατάλη τροφίμων. 
          Οι απαντήσεις σου πρέπει να είναι ευγενικές, ενημερωτικές και να ενθαρρύνουν τη συμμετοχή.
          
          Βασικές πληροφορίες για το ZERO HUNGER PGL:
          1. Rescue Routes: Καθημερινή συλλογή από αρτοποιεία, ξενοδοχεία και αγορές.
          2. Cook Smart: Εργαστήρια μαγειρικής χωρίς σπατάλη για σχολεία και κοινότητες.
          3. FoodLink App: Εφαρμογή που συνδέει δωρητές με κοινωνικούς φορείς.
          
          Συχνές Ερωτήσεις:
          - Ασφάλεια: Ακολουθούμε αυστηρά πρότυπα υγιεινής και HACCP. Το φαγητό ελέγχεται κατά τη συλλογή και τη διανομή.
          - Δωρητές: Κάθε επιχείρηση τροφίμων μπορεί να γίνει δωρητής μέσω της εφαρμογής μας ή επικοινωνώντας μαζί μας.
          - Φορολογία: Ναι, παρέχουμε πιστοποιητικά δωρεάς που μπορούν να χρησιμοποιηθούν για φορολογικές ελαφρύνσεις σύμφωνα με την κυπριακή νομοθεσία.
          
          Απάντα πάντα στα Ελληνικά. Αν δεν γνωρίζεις κάτι, παρέπεμψε τον χρήστη στη φόρμα επικοινωνίας της ιστοσελίδας μας.`,
        },
      });

      const result = await chat.sendMessage({ message: text });
      const responseText = result.text;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseText || "Λυπάμαι, παρουσιάστηκε ένα πρόβλημα. Δοκιμάστε ξανά σε λίγο.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat Error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Παρουσιάστηκε σφάλμα κατά την επικοινωνία με τον βοηθό. Βεβαιωθείτε ότι η σύνδεσή σας είναι ενεργή.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbf9f4] flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center text-white shadow-lg shadow-brand/20">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-extrabold text-slate-900 leading-none">AI Assistant</h1>
                <p className="text-xs text-emerald-500 font-bold flex items-center gap-1 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Online & Έτοιμος να βοηθήσει
                </p>
              </div>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-brand/5 rounded-full border border-brand/10">
            <Sparkles className="w-4 h-4 text-brand" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand">Powered by Gemini</span>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
        <div className="max-w-4xl mx-auto space-y-6 pb-24">
          {/* Welcome Info */}
          {messages.length === 1 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm mb-8"
            >
              <h2 className="text-xl font-extrabold mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-brand" />
                Πώς μπορώ να βοηθήσω;
              </h2>
              <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                Είμαι εδώ για να απαντήσω στις ερωτήσεις σας σχετικά με τη λειτουργία του ZERO HUNGER PGL, τις δωρεές τροφίμων και την ασφάλεια των διαδικασιών μας.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {FAQ_SUGGESTIONS.map((faq, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(faq.query)}
                    className="flex items-center gap-3 p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:border-brand/30 hover:bg-brand/5 transition-all text-left group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400 group-hover:text-brand shadow-sm">
                      {faq.icon}
                    </div>
                    <span className="text-xs font-bold text-slate-700 group-hover:text-brand">{faq.text}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-[85%] sm:max-w-[75%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm ${
                    msg.role === 'user' ? 'bg-slate-200 text-slate-600' : 'bg-brand text-white'
                  }`}>
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={`p-4 rounded-2xl shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-brand text-white rounded-tr-none' 
                      : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    <p className={`text-[10px] mt-2 opacity-50 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="flex gap-3 items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm rounded-tl-none">
                <Loader2 className="w-4 h-4 text-brand animate-spin" />
                <span className="text-xs font-medium text-slate-400">Ο βοηθός σκέφτεται...</span>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <div className="bg-white border-t border-slate-200 p-4 sticky bottom-0 z-20">
        <div className="max-w-4xl mx-auto">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(input);
            }}
            className="relative flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Γράψτε την ερώτησή σας εδώ..."
              className="w-full bg-slate-50 border border-slate-200 rounded-full px-6 py-4 pr-16 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 p-3 bg-brand text-white rounded-full shadow-lg shadow-brand/20 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
          <p className="text-[10px] text-center text-slate-400 mt-3 font-medium">
            Ο AI βοηθός μπορεί να κάνει λάθη. Επαληθεύστε σημαντικές πληροφορίες.
          </p>
        </div>
      </div>
    </div>
  );
}
