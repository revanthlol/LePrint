// frontend/src/components/Dashboard/DashboardLayout.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthProvider';
import { useGuest } from '../GuestContext';
import { Printer, History, LogOut, User, Menu, X, HelpCircle, Shield, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Footer from '../Footer';

export function DashboardLayout({ children, activeTab = 'print' }) {
    const { user, role, signOut } = useAuth();
    const { isGuest, endGuestSession, jobsToday } = useGuest();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const jobsLeft = Math.max(0, 3 - jobsToday);
  
    const tabs = [
      { id: 'print', label: 'Print', icon: Printer, path: '/' },
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
            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 bg-card/95 backdrop-blur-md border-b border-border z-50 px-4 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 hover:bg-accent rounded-lg transition-colors"
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
                            <Printer className="w-5 h-5 text-primary" />
                            <span className="font-bold text-foreground">LePrint</span>
                        </div>
                    </div>
                    {isGuest ? (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/login')}
                            className="p-2 hover:bg-accent rounded-lg transition-colors"
                        >
                            <LogIn className="w-5 h-5 text-muted-foreground" />
                        </motion.button>
                    ) : (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleSignOut}
                            className="p-2 hover:bg-accent rounded-lg transition-colors"
                        >
                            <LogOut className="w-5 h-5 text-muted-foreground" />
                        </motion.button>
                    )}
                </div>
            </div>

            {/* Sidebar - Desktop */}
            <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-card/95 backdrop-blur-md border-r border-border fixed top-0 left-0 h-full z-40">
                <div className="flex flex-col h-full">
                {/* Logo */}
                    <a href="/" className="block">
                        <div className="p-6 border-b border-border cursor-pointer">
                            <div className="flex items-center gap-3">
                                <motion.div
                                    whileHover={{ scale: 1.05, rotate: 3 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm border border-border"
                                >
                                    <Printer className="w-6 h-6 text-black" />
                                </motion.div>
                                <div>
                                    <h1 className="font-bold text-foreground">LePrint</h1>
                                    <p className="text-xs text-muted-foreground">Fast & Reliable</p>
                                </div>
                            </div>
                        </div>
                    </a>

                    {/* User Info */}
                    <div className="p-4 border-b border-border">
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
                                <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center">
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
                                            ? 'bg-primary text-primary-foreground shadow-lg'
                                            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
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
                            onClick={() => navigate('/faq')}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left text-muted-foreground hover:bg-accent hover:text-foreground"
                        >
                            <HelpCircle className="w-5 h-5" />
                            <span className="font-medium">Help & FAQ</span>
                        </motion.button>
                    </nav>

                    {/* Guest Session Card */}
                    {isGuest && (
                        <div className="mx-4 mb-3 p-3 bg-muted/10 border border-border rounded-lg">
                            <div className="flex items-center gap-2 mb-1.5">
                                <User className="w-4 h-4 text-amber-400" />
                                <span className="text-sm font-medium text-foreground">Guest Session</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground mb-3">
                                {jobsLeft} job{jobsLeft !== 1 ? 's' : ''} left today · History unavailable
                            </p>
                            <button
                                onClick={() => navigate('/login')}
                                className="w-full text-xs py-2 px-3 border border-border rounded-md text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all"
                            >
                                Sign in for full access →
                            </button>
                        </div>
                    )}

                    {/* Logout / Sign-in */}
                    <div className="p-4 border-t border-border">
                        {isGuest ? (
                            <motion.button
                                whileHover={{ scale: 1.02, x: 4 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => navigate('/login')}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
                            >
                                <LogIn className="w-5 h-5" />
                                <span className="font-medium">Sign In</span>
                            </motion.button>
                        ) : (
                            <motion.button
                                whileHover={{ scale: 1.02, x: 4 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleSignOut}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
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
                        {/* Overlay */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="lg:hidden fixed inset-0 bg-black/50 z-30"
                            onClick={() => setSidebarOpen(false)}
                        />
                        
                        {/* Sidebar */}
                        <motion.aside
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="lg:hidden fixed top-0 left-0 h-full bg-card/95 backdrop-blur-md border-r border-border z-40 w-64"
                        >
                            <div className="flex flex-col h-full">
                                {/* User Info */}
                                <div className="p-4 border-b border-border mt-16">
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
                                            <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center">
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
                                                        ? 'bg-primary text-primary-foreground shadow-lg'
                                                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
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
                                        onClick={() => { navigate('/faq'); setSidebarOpen(false); }}
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left text-muted-foreground hover:bg-accent hover:text-foreground"
                                    >
                                        <HelpCircle className="w-5 h-5" />
                                        <span className="font-medium">Help & FAQ</span>
                                    </button>
                                </nav>

                                {/* Guest Session Card - Mobile */}
                                {isGuest && (
                                    <div className="mx-4 mb-3 p-3 bg-muted/10 border border-border rounded-lg">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <User className="w-4 h-4 text-amber-400" />
                                            <span className="text-sm font-medium text-foreground">Guest Session</span>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground mb-3">
                                            {jobsLeft} job{jobsLeft !== 1 ? 's' : ''} left today · History unavailable
                                        </p>
                                        <button
                                            onClick={() => { navigate('/login'); setSidebarOpen(false); }}
                                            className="w-full text-xs py-2 px-3 border border-border rounded-md text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all"
                                        >
                                            Sign in for full access →
                                        </button>
                                    </div>
                                )}

                                {/* Logout */}
                                <div className="p-4 border-t border-border">
                                    {isGuest ? (
                                        <button
                                            onClick={() => { navigate('/login'); setSidebarOpen(false); }}
                                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
                                        >
                                            <LogIn className="w-5 h-5" />
                                            <span className="font-medium">Sign In</span>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleSignOut}
                                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
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
            <main className="lg:ml-64 min-h-screen flex flex-col">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="p-6 lg:p-8 pt-20 lg:pt-8 flex-1"
                >
                    {children}
                </motion.div>
                {activeTab !== 'print' && <Footer />}
            </main>
        </div>
    );
}
