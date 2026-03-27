// frontend/src/components/FAQPage.jsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Footer from './Footer';
import PublicNavbar from './PublicNavbar';
import { 
  ChevronDown, Printer, FileText, CreditCard, 
  Shield, HelpCircle, ArrowLeft, Search, X,
  ThumbsUp, ThumbsDown, Mail, Send
} from 'lucide-react';

const faqs = [
  {
    category: 'Supported Formats',
    icon: FileText,
    color: 'text-foreground',
    bg: 'bg-white/[0.06]',
    questions: [
      {
        q: 'What file formats can I print?',
        a: `LePrint supports the following file types:\n\n• PDF (.pdf) — Prints directly, no conversion needed\n• Microsoft Word (.doc, .docx) — Auto-converted to PDF\n• OpenDocument Text (.odt) — Auto-converted to PDF\n• Rich Text Format (.rtf) — Auto-converted to PDF\n• Plain Text (.txt, .md) — Auto-converted to PDF\n• Images (.png, .jpg, .jpeg) — Scaled to A4 and printed\n\nMaximum file size right now is 100 MB , but we are working on increasing it.`
      },
      {
        q: 'Are non-PDF files converted automatically?',
        a: 'Yes. Word documents, text files, and images are automatically converted to PDF on the kiosk before printing. You\'ll see a "Converting to PDF..." status update in real time. The process usually takes 5–15 seconds.'
      },
      {
        q: 'What if my file has special fonts or formatting?',
        a: 'Files are converted using LibreOffice on the kiosk. Standard fonts render correctly. Uncommon or embedded fonts may substitute during conversion. For best results, export your document as a PDF before uploading — this guarantees it prints exactly as designed.'
      }
    ]
  },
  {
    category: 'Failed Prints & Refunds',
    icon: CreditCard,
    color: 'text-foreground',
    bg: 'bg-white/[0.06]',
    questions: [
      {
        q: 'What happens if the printer jams or runs out of paper?',
        a: 'If a hardware failure (paper jam, out-of-paper, offline printer) interrupts your job after payment, your job is marked as FAILED in the system. Contact the kiosk operator or support with your Job ID — visible in your print history — to request a reprint or refund.'
      },
      {
        q: 'What if my job fails after I pay?',
        a: 'Jobs can fail due to conversion errors, network issues, or printer faults. In all cases:\n\n• The failure is logged with a reason\n• Your Job ID is preserved in History\n• You can contact support with the Job ID for a resolution\n\nWe do not charge for jobs that fail before printing begins.'
      },
      {
        q: 'How do I request a refund?',
        a: 'All refunds are handled centrally by LePrint as per our Refund Policy. To request a refund, email support@leprint.in with your Job ID and transaction details.\n\nSee our full Refund Policy at leprint.in/refund-policy for eligibility details and timelines.'
      }
    ]
  },
  {
    category: 'Privacy & Security',
    icon: Shield,
    color: 'text-foreground',
    bg: 'bg-white/[0.06]',
    questions: [
      {
        q: 'Are my documents stored on your servers?',
        a: 'Your uploaded file is stored on our server only long enough to be transferred to the kiosk printer (typically under 60 seconds). It is permanently deleted from the server immediately after the kiosk downloads it. Files are also deleted from the kiosk after printing. We do not retain any copy of your document.'
      },
      {
        q: 'Who can see my document?',
        a: 'Nobody. Your file is encrypted in transit (HTTPS), transferred directly to the kiosk, and deleted from our servers the moment the kiosk picks it up. Only the physical printer receives your document. No admin, no employee, and no other user can access your file.'
      },
      {
        q: 'Is my payment information secure?',
        a: 'Yes. Payments are processed through Razorpay, a PCI DSS compliant payment gateway. LePrint never stores your card details. Only a payment confirmation ID is saved for refund and audit purposes.'
      },
      {
        q: 'What data does LePrint store about me?',
        a: 'We store only:\n\n• Your name and email from Google Sign-In\n• Print job metadata: file name, page count, cost, status, and timestamps\n\nWe never store the content of your documents. Your print history is private and only visible to you.'
      }
    ]
  },
  {
    category: 'General',
    icon: HelpCircle,
    color: 'text-foreground',
    bg: 'bg-white/[0.06]',
    questions: [
      {
        q: 'How does LePrint work?',
        a: 'LePrint is a cloud-based kiosk printing system:\n\n1. Scan the QR code at a kiosk with your phone\n2. Log in with Google\n3. Upload your document\n4. Pay per page (₹3/page)\n5. Collect your printout\n\nYour phone controls the kiosk — no USB, no email, no app install required.'
      },
      {
        q: 'Can I print without creating an account?',
        a: 'No — a Google account is required. This lets us securely link jobs to you, provide print history, and handle refunds if something goes wrong. Sign-in takes under 5 seconds with your existing Google account.'
      },
      {
        q: 'How much does printing cost?',
        a: 'The current rate is ₹3 per page for black & white printing. The exact page count and total cost are shown on screen before you pay — so there are never any surprises. Color printing and double-sided options are coming in a future update.'
      }
    ]
  }
];

// Analytics helper
const trackFAQView = (questionId) => {
  try {
    const views = JSON.parse(localStorage.getItem('faq_views') || '{}');
    views[questionId] = (views[questionId] || 0) + 1;
    localStorage.setItem('faq_views', JSON.stringify(views));
  } catch (e) {
    console.error('Analytics error:', e);
  }
};

const trackHelpful = (questionId, helpful) => {
  try {
    const feedback = JSON.parse(localStorage.getItem('faq_feedback') || '{}');
    if (!feedback[questionId]) {
      feedback[questionId] = { helpful: 0, unhelpful: 0 };
    }
    if (helpful) {
      feedback[questionId].helpful++;
    } else {
      feedback[questionId].unhelpful++;
    }
    localStorage.setItem('faq_feedback', JSON.stringify(feedback));
  } catch (e) {
    console.error('Feedback tracking error:', e);
  }
};

function AccordionItem({ questionId, question, answer, isOpen, onToggle }) {
  const [voted, setVoted] = useState(null);

  const handleVote = (helpful) => {
    if (voted !== null) return; // Already voted
    setVoted(helpful);
    trackHelpful(questionId, helpful);
  };

  return (
    <div className="border-b border-white/[0.06] last:border-0">
      <button
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
        className="w-full flex items-start justify-between gap-4 py-5 text-left group"
        aria-expanded={isOpen}
      >
        <span className={`text-sm font-medium transition-colors ${isOpen ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>
          {question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="mt-0.5 shrink-0"
        >
          <ChevronDown className={`w-4 h-4 transition-colors ${isOpen ? 'text-foreground' : 'text-muted-foreground'}`} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pb-5 pr-8">
              {answer.split('\n').map((line, i) => (
                <p key={i} className={`text-sm text-muted-foreground/80 leading-relaxed ${line === '' ? 'mt-2' : ''}`}>
                  {line}
                </p>
              ))}

              {/* Was this helpful? */}
              <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center gap-3">
                <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/50">Helpful?</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleVote(true)}
                    disabled={voted !== null}
                    className={`p-1.5 rounded-lg border border-white/[0.08] transition-colors ${
                      voted === true
                        ? 'bg-white text-black'
                        : voted === false
                        ? 'opacity-20 cursor-not-allowed'
                        : 'bg-white/[0.03] text-muted-foreground hover:text-foreground hover:bg-white/[0.06]'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleVote(false)}
                    disabled={voted !== null}
                    className={`p-1.5 rounded-lg border border-white/[0.08] transition-colors ${
                      voted === false
                        ? 'bg-white text-black'
                        : voted === true
                        ? 'opacity-20 cursor-not-allowed'
                        : 'bg-white/[0.03] text-muted-foreground hover:text-foreground hover:bg-white/[0.06]'
                    }`}
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                  </button>
                </div>
                {voted !== null && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-[11px] text-muted-foreground/60 italic"
                  >
                    Thanks for your feedback!
                  </motion.span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ContactModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Contact form:', formData);
    setSubmitted(true);
    setTimeout(() => {
      onClose();
      setSubmitted(false);
      setFormData({ name: '', email: '', message: '' });
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[#1a1a1a]/95 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-8 max-w-md w-full shadow-2xl shadow-black/50"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/[0.06] border border-white/[0.08] rounded-xl flex items-center justify-center">
                <Mail className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-lg leading-none">Contact Support</h3>
                <p className="text-xs text-muted-foreground mt-1">We'll get back within 24 hours.</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/[0.06] rounded-xl transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-12 text-center"
            >
              <div className="w-16 h-16 bg-white/[0.06] border border-white/[0.08] rounded-2xl flex items-center justify-center mx-auto mb-6">
                <ThumbsUp className="w-8 h-8 text-foreground" />
              </div>
              <p className="text-foreground font-semibold text-lg mb-2">Message sent!</p>
              <p className="text-sm text-muted-foreground">We'll get back to you soon.</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60 mb-2 px-1">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-white/[0.02] border border-white/[0.08] rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-white/[0.05] focus:border-white/[0.15] backdrop-blur-md transition-all"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60 mb-2 px-1">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-white/[0.02] border border-white/[0.08] rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-white/[0.05] focus:border-white/[0.15] backdrop-blur-md transition-all"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60 mb-2 px-1">Message</label>
                <textarea
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-3 bg-white/[0.02] border border-white/[0.08] rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-white/[0.05] focus:border-white/[0.15] backdrop-blur-md resize-none transition-all"
                  placeholder="How can we help?"
                />
              </div>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-white text-black rounded-xl font-bold text-sm hover:bg-white/90 shadow-xl shadow-white/5 transition-all"
              >
                <Send className="w-4 h-4" />
                Send Message
              </button>
            </form>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function FAQPage({ inApp = false }) {
  const navigate = useNavigate();
  const [openItems, setOpenItems] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  const contentClasses = inApp 
    ? "w-full" 
    : "flex-1 max-w-3xl mx-auto px-6 pt-32 pb-20 w-full";

  // SEO Meta Tags
  useEffect(() => {
    document.title = 'FAQs & Support - LePrint';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Find answers about LePrint cloud printing: supported formats, refunds, privacy, and more. Get help instantly.');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'Find answers about LePrint cloud printing: supported formats, refunds, privacy, and more. Get help instantly.';
      document.head.appendChild(meta);
    }

    return () => {
      document.title = 'LePrint';
    };
  }, []);

  const toggle = (catIdx, qIdx) => {
    const key = `${catIdx}-${qIdx}`;
    const questionId = `${catIdx}-${qIdx}`;
    if (!openItems[key]) trackFAQView(questionId);
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Search filtering
  const filteredFaqs = useMemo(() => {
    if (!searchQuery.trim()) return faqs;
    const query = searchQuery.toLowerCase();
    return faqs.map(section => ({
      ...section,
      questions: section.questions.filter(q =>
        q.q.toLowerCase().includes(query) ||
        q.a.toLowerCase().includes(query)
      )
    })).filter(section => section.questions.length > 0);
  }, [searchQuery]);

  const hasResults = filteredFaqs.length > 0;

  return (
    <div className={inApp ? "" : "min-h-screen flex flex-col bg-[#0a0a0a]"}>
      {!inApp && <PublicNavbar />}

      <div className={contentClasses}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-12"
        >
          <span className="block text-[10px] md:text-xs uppercase tracking-[0.3em] text-muted-foreground font-bold mb-4">SUPPORT</span>
          <h1 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
            FAQs <span className="font-bold">& Support</span>
          </h1>
          <p className="text-base text-muted-foreground max-w-md">
            Everything you need to know about printing with LePrint.
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mb-12"
        >
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 group-focus-within:text-foreground/70 transition-colors" />
            <input
              type="text"
              placeholder="Search health, privacy, or job issues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-12 py-4 bg-white/[0.02] border border-white/[0.08] rounded-2xl text-foreground text-sm placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-white/[0.05] focus:border-white/[0.15] backdrop-blur-md transition-all shadow-2xl shadow-black/20"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-white/[0.06] rounded-xl transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/40 mt-4 px-2">
              {hasResults ? `Found ${filteredFaqs.reduce((acc, s) => acc + s.questions.length, 0)} result(s)` : 'No matches found'}
            </p>
          )}
        </motion.div>

        {/* FAQ sections */}
        {hasResults ? (
          <div className="space-y-8">
            {filteredFaqs.map((section, catIdx) => {
              const Icon = section.icon;
              return (
                <motion.div
                  key={catIdx}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: catIdx * 0.1 }}
                  className="bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl shadow-black/30"
                >
                  {/* Section header */}
                  <div className="flex items-center gap-4 px-6 py-5 border-b border-white/[0.06] bg-white/[0.02]">
                    <div className={`w-10 h-10 rounded-xl ${section.bg} border border-white/[0.08] flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${section.color}`} />
                    </div>
                    <h2 className="font-bold text-foreground text-sm tracking-tight">{section.category}</h2>
                  </div>

                  {/* Questions */}
                  <div className="px-6">
                    {section.questions.map((item, qIdx) => (
                      <AccordionItem
                        key={qIdx}
                        questionId={`${catIdx}-${qIdx}`}
                        question={item.q}
                        answer={item.a}
                        isOpen={!!openItems[`${catIdx}-${qIdx}`]}
                        onToggle={() => toggle(catIdx, qIdx)}
                      />
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 bg-white/[0.03] border border-white/[0.08] rounded-3xl backdrop-blur-md"
          >
            <div className="w-16 h-16 bg-white/[0.06] border border-white/[0.08] rounded-2xl flex items-center justify-center mx-auto mb-6">
              <HelpCircle className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <p className="text-foreground font-semibold text-lg mb-2">No results found</p>
            <p className="text-sm text-muted-foreground/60 mb-8 max-w-xs mx-auto leading-relaxed">
              We couldn't find an answer. Try different keywords or reach out to us.
            </p>
            <button
              onClick={() => navigate('/contact')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl text-sm font-bold hover:bg-white/90 shadow-xl shadow-white/5 transition-all"
            >
              <Mail className="w-4 h-4" />
              Contact Support
            </button>
          </motion.div>
        )}

        {/* Still have questions CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-20 pt-12 border-t border-white/[0.08] text-center"
        >
          <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground/50 mb-4">STILL HAVE QUESTIONS?</p>
          <p className="text-sm text-muted-foreground mb-8">We're here to help you get your printing done.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/contact')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/[0.06] border border-white/[0.08] hover:bg-white/[0.1] rounded-xl text-sm font-bold text-foreground transition-all"
            >
              <Mail className="w-4 h-4" />
              Open Support Ticket
            </button>
            <a 
              href="mailto:support@leprint.in" 
              className="text-sm text-foreground/70 hover:text-foreground underline underline-offset-4 transition-colors p-4"
            >
              Email support@leprint.in
            </a>
          </div>
        </motion.div>
      </div>

      {!inApp && <Footer />}
    </div>
  );
}
