// frontend/src/components/Login.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { useGuest } from './GuestContext';
import { Printer, AlertCircle, UserX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Footer from './Footer';
import FeatureCards from './FeatureCards';

// Animation variants for reusability
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
            ease: "easeOut"
        }
    }
};


export function Login() {
    const { signInWithGoogle, isAuthenticated, loading: authLoading, error: authError } = useAuth();
    const { startGuestSession } = useGuest();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const redirectTo = searchParams.get('redirect') || '/app';

    // Smart redirect: if already logged in, redirect away
    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            navigate(redirectTo, { replace: true });
        }
    }, [authLoading, isAuthenticated, redirectTo, navigate]);

    const handleGoogleSignIn = async () => {
        try {
            setLoading(true);
            setError(null);
            
            await signInWithGoogle();
            navigate(redirectTo, { replace: true });
        } catch (err) {
            console.error('Login failed:', err);
            setError(err.message || 'Failed to sign in with Google');
        } finally {
            setLoading(false);
        }
    };

    const handleGuestContinue = () => {
        startGuestSession();
        navigate(redirectTo, { replace: true });
    };

    // Show nothing while auth state is loading (avoid flash)
    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
                <svg className="animate-spin h-10 w-10 text-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-[#0a0a0a]">
            <div className="flex-1 flex items-center justify-center px-4 py-8">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="max-w-md w-full relative z-10"
                >
                    {/* Main Card */}
                    <motion.div
                        variants={itemVariants}
                        className="bg-card/80 backdrop-blur-xl border border-border rounded-2xl shadow-2xl p-8 mb-6"
                    >
                        {/* Logo/Header */}
                        <div className="text-center mb-6">
                            {/* Floating Logo with pulse effect */}
                            <motion.div
                                animate={{
                                    y: [0, -10, 0],
                                }}
                                transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                                className="inline-block"
                            >
                                <motion.div
                                    whileHover={{ scale: 1.05, rotate: 5 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl mb-4 shadow-lg cursor-pointer"
                                >
                                    <Printer className="w-10 h-10 text-black" />
                                </motion.div>
                            </motion.div>

                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3, duration: 0.5 }}
                                className="text-4xl font-bold text-foreground mb-2"
                            >
                                LePrint
                            </motion.h1>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4, duration: 0.5 }}
                                className="text-muted-foreground text-sm"
                            >
                                Upload documents, pay online, print at any kiosk
                            </motion.p>
                        </div>

                        {/* How it works — compact */}
                        <div className="mb-6 p-4 rounded-xl bg-white/5 border border-border space-y-2">
                            <p className="text-sm font-semibold text-foreground">How it works</p>
                            <div className="flex items-start gap-2.5 text-sm text-muted-foreground">
                                <span className="shrink-0 w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[11px] font-bold text-foreground">1</span>
                                <span>Scan the QR code at a kiosk & upload your file</span>
                            </div>
                            <div className="flex items-start gap-2.5 text-sm text-muted-foreground">
                                <span className="shrink-0 w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[11px] font-bold text-foreground">2</span>
                                <span>Pay securely online via Razorpay</span>
                            </div>
                            <div className="flex items-start gap-2.5 text-sm text-muted-foreground">
                                <span className="shrink-0 w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[11px] font-bold text-foreground">3</span>
                                <span>Collect your printout at the kiosk</span>
                            </div>
                            <p className="text-xs text-muted-foreground/60 pt-1">
                                Printing starts only after successful payment.
                            </p>
                        </div>

                        {/* Error Message with animation */}
                        <AnimatePresence mode="wait">
                            {(error || authError) && (
                                <motion.div
                                    key="error"
                                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                                    animate={{ opacity: 1, height: "auto", marginBottom: 24 }}
                                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="overflow-hidden"
                                >
                                    <motion.div
                                        initial={{ x: -20 }}
                                        animate={{ x: 0 }}
                                        className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg"
                                    >
                                        <div className="flex items-start gap-3">
                                            <motion.div
                                                animate={{ rotate: [0, -10, 10, -10, 0] }}
                                                transition={{ duration: 0.5 }}
                                            >
                                                <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
                                            </motion.div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-destructive">
                                                    Authentication Failed
                                                </p>
                                                <p className="text-sm text-destructive/80 mt-1">
                                                    {error || authError}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Terms & Conditions Checkbox — enlarged for mobile */}
                        <label className="flex items-start gap-3.5 mb-6 cursor-pointer group p-3 -mx-3 rounded-xl hover:bg-white/5 transition-colors">
                            <div className="relative shrink-0 mt-0.5">
                                <input
                                    type="checkbox"
                                    checked={termsAccepted}
                                    onChange={(e) => setTermsAccepted(e.target.checked)}
                                    className="peer sr-only"
                                />
                                <div className={`w-6 h-6 rounded-md border-2 transition-all flex items-center justify-center ${
                                    termsAccepted
                                        ? 'bg-white border-white'
                                        : 'border-muted-foreground/40 group-hover:border-muted-foreground/70'
                                }`}>
                                    {termsAccepted && (
                                        <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>
                            </div>
                            <span className="text-sm text-muted-foreground leading-relaxed">
                                I agree to the{' '}
                                <a href="/terms" target="_blank" onClick={(e) => e.stopPropagation()} className="text-blue-400 hover:underline">Terms & Conditions</a>{' '}
                                and{' '}
                                <a href="/privacy-policy" target="_blank" onClick={(e) => e.stopPropagation()} className="text-blue-400 hover:underline">Privacy Policy</a>
                            </span>
                        </label>

                        {/* Google Sign In Button with enhanced interactions */}
                        <motion.button
                            onClick={handleGoogleSignIn}
                            disabled={loading || !termsAccepted}
                            whileHover={{ scale: termsAccepted ? 1.02 : 1 }}
                            whileTap={{ scale: termsAccepted ? 0.98 : 1 }}
                            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white hover:bg-gray-50 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                        >
                            <AnimatePresence mode="wait">
                                {loading ? (
                                    <motion.div
                                        key="loading"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex items-center gap-3"
                                    >
                                        <motion.svg
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                            className="h-5 w-5 text-gray-600"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </motion.svg>
                                        <span>Signing in...</span>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="ready"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex items-center gap-3"
                                    >
                                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                        </svg>
                                        <motion.span
                                            whileHover={{ x: 2 }}
                                            className="transition-transform"
                                        >
                                            Continue with Google
                                        </motion.span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.button>

                        {/* Divider */}
                        <div className="flex items-center gap-3 my-5">
                            <div className="flex-1 h-px bg-border" />
                            <span className="text-xs text-muted-foreground/50 uppercase tracking-wider">or</span>
                            <div className="flex-1 h-px bg-border" />
                        </div>

                        {/* Continue as Guest */}
                        <motion.button
                            onClick={handleGuestContinue}
                            disabled={!termsAccepted}
                            whileHover={{ scale: termsAccepted ? 1.01 : 1 }}
                            whileTap={{ scale: termsAccepted ? 0.98 : 1 }}
                            className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 bg-transparent border border-border rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <UserX className="w-4 h-4" />
                            Continue as Guest
                        </motion.button>
                        <p className="mt-3 text-center text-[11px] text-muted-foreground/30">
                            Limited to 3 prints per day
                        </p>
                    </motion.div>

                    <FeatureCards />
                </motion.div>
            </div>
            <Footer />
        </div>
    );
}
