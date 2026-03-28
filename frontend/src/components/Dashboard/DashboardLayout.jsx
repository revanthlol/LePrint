// frontend/src/components/Dashboard/DashboardLayout.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthProvider';
import { useGuest } from '../GuestContext';
import { Printer, History, LogOut, User, Menu, X, HelpCircle, Shield, LogIn, Mail, Map } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Footer from '../Footer';

export function DashboardLayout({ children, activeTab = 'print' }) {
    const { user, role, signOut } = useAuth();
    const { isGuest: guestCtxIsGuest, endGuestSession, jobsToday } = useGuest();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [headerVisible, setHeaderVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY > lastScrollY && currentScrollY > 80) {
                setHeaderVisible(false); // Scrolling down
            } else {
                setHeaderVisible(true); // Scrolling up
            }
            setLastScrollY(currentScrollY);
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [lastScrollY]);

    // Only treat as guest if GuestContext says guest AND there's no Firebase user
    const isGuest = guestCtxIsGuest && !user;
    const jobsLeft = Math.max(0, 3 - jobsToday);
  
    const tabs = [
      { id: 'print', label: 'Print', icon: Printer, path: '/app' },
      { id: 'map', label: 'Map', icon: Map, path: '/map' },
      // Hide history for guests
      ...(!isGuest ? [{ id: 'history', label: 'History', icon: History, path: '/history' }] : []),
      // Only show admin tab if user is admin
      ...(role === 'admin' || role === 'superadmin' ? [{
        id: 'admin', 
        label: 'Admin', 
        icon: Shield, 
        path: '/admin'
      }] : [])
    ];

    const handleTabClick = (tab) => {
        navigate(tab.path);
        setSidebarOpen(false);
    };

    const handleSignOut = async () => {
        if (isGuest) {
            endGuestSession();
        } else {
            await signOut();
        }
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a]">
            {/* Mobile Header - Floating Pill with Scroll-Hide */}
            <header className="lg:hidden fixed top-0 left-0 right-0 z-50 flex justify-center p-4 pointer-events-none">
                <motion.div
                    initial={{ y: 0 }}
                    animate={{ y: headerVisible ? 0 : -100 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center justify-between w-full max-w-md px-4 py-2.5 bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/50 pointer-events-auto"
                >
                    <div className="flex items-center gap-3">
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 hover:bg-white/[0.06] rounded-lg transition-colors"
                        >
                            <AnimatePresence mode="wait" initial={false}>
                                {sidebarOpen ? (
                                    <motion.div
                                        key="close"
                                        initial={{ rotate: -90, opacity: 0 }}
                                        animate={{ rotate: 0, opacity: 1 }}
                                        exit={{ rotate: 90, opacity: 0 }}
                                        transition={{ duration: 0.15 }}
                                    >
                                        <X className="w-5 h-5" />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="menu"
                                        initial={{ rotate: 90, opacity: 0 }}
                                        animate={{ rotate: 0, opacity: 1 }}
                                        exit={{ rotate: -90, opacity: 0 }}
                                        transition={{ duration: 0.15 }}
                                    >
                                        <Menu className="w-5 h-5" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.button>
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-white/10 to-transparent text-white border border-white/[0.08] flex items-center justify-center">
                                <Printer className="w-4 h-4" />
                            </div>
                            <span className="font-bold text-foreground">LePrint</span>
                        </div>
                    </div>
                    {isGuest ? (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/login')}
                            className="p-2 hover:bg-white/[0.06] rounded-lg transition-colors"
                        >
                            <LogIn className="w-5 h-5 text-muted-foreground" />
                        </motion.button>
                    ) : (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleSignOut}
                            className="p-2 hover:bg-red-500/10 rounded-lg transition-colors group"
                        >
                            <LogOut className="w-5 h-5 text-red-500/70 group-hover:text-red-400 transition-colors" />
                        </motion.button>
                    )}
                </motion.div>
            </header>

            {/* Sidebar - Desktop Floating */}
            <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] fixed top-4 left-4 bottom-4 z-40 rounded-3xl shadow-2xl shadow-black/20 overflow-hidden">
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="p-6 border-b border-white/[0.06]">
                        <div className="flex items-center gap-4">
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="w-10 h-10 rounded-[1rem] bg-gradient-to-br from-white/10 to-transparent text-white border border-white/10 flex items-center justify-center shadow-lg shadow-black/10"
                            >
                                <Printer className="w-5 h-5" />
                            </motion.div>
                            <div>
                                <h1 className="font-bold text-foreground">LePrint</h1>
                                <p className="text-xs text-muted-foreground">Fast & Reliable</p>
                            </div>
                        </div>
                    </div>

                    {/* User Info */}
                    <div className="p-4 border-b border-white/[0.06]">
                        <div className="flex items-center gap-3">
                            {isGuest ? (
                                <div className="w-10 h-10 bg-amber-500/10 rounded-full flex items-center justify-center">
                                    <User className="w-5 h-5 text-amber-400" />
                                </div>
                            ) : user?.photoURL ? (
                                <motion.img
                                    whileHover={{ scale: 1.05 }}
                                    src={user.photoURL}
                                    alt={user.displayName}
                                    className="w-10 h-10 rounded-full border-2 border-border"
                                />
                            ) : (
                                <div className="w-10 h-10 bg-white/[0.06] rounded-full flex items-center justify-center">
                                    <User className="w-5 h-5 text-muted-foreground" />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-foreground truncate text-sm">
                                    {isGuest ? 'Guest' : (user?.displayName || 'User')}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                    {isGuest ? 'No account' : user?.email}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 space-y-2">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;

                            return (
                                <motion.button
                                    key={tab.id}
                                    whileHover={{ scale: 1.02, x: 4 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleTabClick(tab)}
                                    className={`
                                        w-full flex items-center gap-3 px-4 py-3 rounded-lg
                                        transition-all duration-200 text-left relative
                                        ${isActive
                                            ? 'bg-white/[0.06] text-white border border-white/[0.08]'
                                            : 'text-muted-foreground hover:bg-white/[0.04] hover:text-foreground border border-transparent'
                                        }
                                    `}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="font-medium">{tab.label}</span>
                                </motion.button>
                            );
                        })}

                        {/* ── NEW: FAQ link ── */}
                        <motion.button
                            whileHover={{ scale: 1.02, x: 4 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate('/app/faq')}
                            className={`
                                w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left relative
                                ${activeTab === 'faq'
                                    ? 'bg-white/[0.06] text-white border border-white/[0.08]'
                                    : 'text-muted-foreground hover:bg-white/[0.04] hover:text-foreground border border-transparent'
                                }
                            `}
                        >
                            <HelpCircle className="w-5 h-5" />
                            <span className="font-medium">Help & FAQ</span>
                        </motion.button>

                        {/* ── NEW: Contact Support link ── */}
                        <motion.button
                            whileHover={{ scale: 1.02, x: 4 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate('/app/contact')}
                            className={`
                                w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left relative
                                ${activeTab === 'contact'
                                    ? 'bg-white/[0.06] text-white border border-white/[0.08]'
                                    : 'text-muted-foreground hover:bg-white/[0.04] hover:text-foreground border border-transparent'
                                }
                            `}
                        >
                            <Mail className="w-5 h-5" />
                            <span className="font-medium">Contact Support</span>
                        </motion.button>
                    </nav>

                    {/* Guest Session Card */}
                    {isGuest && (
                        <div className="mx-4 mb-3 p-3 bg-white/[0.03] border border-white/[0.08] rounded-lg">
                            <div className="flex items-center gap-2 mb-1.5">
                                <User className="w-4 h-4 text-amber-400" />
                                <span className="text-sm font-medium text-foreground">Guest Session</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground mb-3">
                                {jobsLeft} job{jobsLeft !== 1 ? 's' : ''} left today · History unavailable
                            </p>
                            <button
                                onClick={() => navigate('/login')}
                                className="w-full text-xs py-2 px-3 border border-white/[0.06] rounded-md text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all"
                            >
                                Sign in for full access →
                            </button>
                        </div>
                    )}

                    {/* Logout / Sign-in */}
                    <div className="p-4 border-t border-white/[0.06]">
                        {isGuest ? (
                            <motion.button
                                whileHover={{ scale: 1.02, x: 4 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => navigate('/login')}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-white/[0.04] hover:text-foreground transition-all"
                            >
                                <LogIn className="w-5 h-5" />
                                <span className="font-medium">Sign In</span>
                            </motion.button>
                        ) : (
                            <motion.button
                                whileHover={{ scale: 1.02, x: 4 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleSignOut}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all"
                            >
                                <LogOut className="w-5 h-5" />
                                <span className="font-medium">Logout</span>
                            </motion.button>
                        )}
                    </div>
                </div>
            </aside>

            {/* Sidebar - Mobile */}
            <AnimatePresence>
                {sidebarOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="lg:hidden fixed inset-0 bg-black/50 z-40"
                            onClick={() => setSidebarOpen(false)}
                        />
                        
                        {/* Sidebar */}
                        <motion.aside
                            initial={{ x: -300 }}
                            animate={{ x: 0 }}
                            exit={{ x: -300 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="lg:hidden fixed top-4 left-4 bottom-4 bg-[#0a0a0a]/80 backdrop-blur-2xl border border-white/[0.08] z-50 w-64 rounded-3xl shadow-2xl"
                        >
                            <div className="flex flex-col h-full">
                                {/* User Info */}
                                <div className="p-4 border-b border-white/[0.06]">
                                    <div className="flex items-center gap-3">
                                        {isGuest ? (
                                            <div className="w-10 h-10 bg-amber-500/10 rounded-full flex items-center justify-center">
                                                <User className="w-5 h-5 text-amber-400" />
                                            </div>
                                        ) : user?.photoURL ? (
                                            <img
                                                src={user.photoURL}
                                                alt={user.displayName}
                                                className="w-10 h-10 rounded-full border-2 border-border"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 bg-white/[0.06] rounded-full flex items-center justify-center">
                                                <User className="w-5 h-5 text-muted-foreground" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-foreground truncate text-sm">
                                                {isGuest ? 'Guest' : (user?.displayName || 'User')}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {isGuest ? 'No account' : user?.email}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Navigation */}
                                <nav className="flex-1 p-4 space-y-2">
                                    {tabs.map((tab) => {
                                        const Icon = tab.icon;
                                        const isActive = activeTab === tab.id;

                                        return (
                                            <button
                                                key={tab.id}
                                                onClick={() => handleTabClick(tab)}
                                                className={`
                                                    w-full flex items-center gap-3 px-4 py-3 rounded-lg
                                                    transition-all duration-200 text-left
                                                    ${isActive
                                                        ? 'bg-white/[0.06] text-white border border-white/[0.08]'
                                                        : 'text-muted-foreground hover:bg-white/[0.04] hover:text-foreground border border-transparent'
                                                    }
                                                `}
                                            >
                                                <Icon className="w-5 h-5" />
                                                <span className="font-medium">{tab.label}</span>
                                            </button>
                                        );
                                    })}

                                    {/* ── NEW: FAQ link ── */}
                                    <button
                                        onClick={() => { navigate('/app/faq'); setSidebarOpen(false); }}
                                        className={`
                                            w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left
                                            ${activeTab === 'faq'
                                                ? 'bg-white/[0.06] text-white border border-white/[0.08]'
                                                : 'text-muted-foreground hover:bg-white/[0.04] hover:text-foreground border border-transparent'
                                            }
                                        `}
                                    >
                                        <HelpCircle className="w-5 h-5" />
                                        <span className="font-medium">Help & FAQ</span>
                                    </button>

                                    {/* ── NEW: Contact Support link ── */}
                                    <button
                                        onClick={() => { navigate('/app/contact'); setSidebarOpen(false); }}
                                        className={`
                                            w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left
                                            ${activeTab === 'contact'
                                                ? 'bg-white/[0.06] text-white border border-white/[0.08]'
                                                : 'text-muted-foreground hover:bg-white/[0.04] hover:text-foreground border border-transparent'
                                            }
                                        `}
                                    >
                                        <Mail className="w-5 h-5" />
                                        <span className="font-medium">Contact Support</span>
                                    </button>
                                </nav>

                                {/* Guest Session Card - Mobile */}
                                {isGuest && (
                                <div className="mx-4 mb-3 p-3 bg-white/[0.03] border border-white/[0.08] rounded-lg">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <User className="w-4 h-4 text-amber-400" />
                                        <span className="text-sm font-medium text-foreground">Guest Session</span>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground mb-3">
                                        {jobsLeft} job{jobsLeft !== 1 ? 's' : ''} left today · History unavailable
                                    </p>
                                    <button
                                        onClick={() => { navigate('/login'); setSidebarOpen(false); }}
                                        className="w-full text-xs py-2 px-3 border border-white/[0.06] rounded-md text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all"
                                    >
                                        Sign in for full access →
                                    </button>
                                </div>
                                )}

                                {/* Logout */}
                                <div className="p-4 border-t border-white/[0.06]">
                                    {isGuest ? (
                                        <button
                                            onClick={() => { navigate('/login'); setSidebarOpen(false); }}
                                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-white/[0.04] hover:text-foreground transition-all"
                                        >
                                            <LogIn className="w-5 h-5" />
                                            <span className="font-medium">Sign In</span>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleSignOut}
                                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                        >
                                            <LogOut className="w-5 h-5" />
                                            <span className="font-medium">Logout</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="lg:ml-72 min-h-screen flex flex-col">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="p-6 lg:p-10 pt-28 lg:pt-10 flex-1"
                >
                    {children}
                </motion.div>
                <Footer />
            </main>
        </div>
    );
}
