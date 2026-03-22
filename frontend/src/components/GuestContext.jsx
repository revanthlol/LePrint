// frontend/src/components/GuestContext.jsx
import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';

function generateId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    // Fallback for older browsers
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
}

const STORAGE_KEY = 'leprint_guest';
const MAX_JOBS_PER_DAY = 3;

const GuestContext = createContext({});

export function useGuest() {
    return useContext(GuestContext);
}

function getToday() {
    return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function readStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const data = JSON.parse(raw);

        // Daily reset
        if (data.lastJobDate !== getToday()) {
            data.jobsToday = 0;
            data.lastJobDate = getToday();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        }

        return data;
    } catch {
        return null;
    }
}

function writeStorage(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
        // localStorage unavailable — fail open
    }
}

export function GuestProvider({ children }) {
    const [session, setSession] = useState(() => readStorage());

    // FIX: Clear guest session when Firebase auth state returns a real user
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                // Real user logged in — wipe guest state immediately
                try { localStorage.removeItem(STORAGE_KEY); } catch {}
                setSession(null);
            }
        });
        return () => unsubscribe();
    }, []);

    const isGuest = !!session?.guestId;
    const guestId = session?.guestId || null;
    const jobsToday = session?.jobsToday || 0;
    const canCreateJob = jobsToday < MAX_JOBS_PER_DAY;
    const isLastJob = jobsToday === MAX_JOBS_PER_DAY - 1; // show nudge

    const startGuestSession = useCallback(() => {
        const existing = readStorage();
        if (existing?.guestId) {
            // Reuse existing guest ID (same device)
            setSession(existing);
            return existing.guestId;
        }

        const newSession = {
            guestId: generateId(),
            jobsToday: 0,
            lastJobDate: getToday(),
        };
        writeStorage(newSession);
        setSession(newSession);
        return newSession.guestId;
    }, []);

    const endGuestSession = useCallback(() => {
        try { localStorage.removeItem(STORAGE_KEY); } catch {}
        setSession(null);
    }, []);

    const incrementJobCount = useCallback(() => {
        setSession((prev) => {
            if (!prev) return prev;
            const updated = {
                ...prev,
                jobsToday: (prev.jobsToday || 0) + 1,
                lastJobDate: getToday(),
            };
            writeStorage(updated);
            return updated;
        });
    }, []);

    const value = useMemo(() => ({
        isGuest,
        guestId,
        jobsToday,
        canCreateJob,
        isLastJob,
        startGuestSession,
        endGuestSession,
        incrementJobCount,
    }), [isGuest, guestId, jobsToday, canCreateJob, isLastJob, startGuestSession, endGuestSession, incrementJobCount]);

    return (
        <GuestContext.Provider value={value}>
            {children}
        </GuestContext.Provider>
    );
}
