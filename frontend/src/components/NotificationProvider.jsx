// frontend/src/components/NotificationProvider.jsx
// In-app toasts (sonner) + browser push notifications for job status updates

import { createContext, useContext, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const NotificationContext = createContext(null);

const PERM_KEY = 'leprint_notif_perm'; // 'granted' | 'denied' | 'dismissed'

// Status → toast config
const STATUS_TOASTS = {
    SENT_TO_PI: { title: 'Job sent to kiosk', desc: 'Your job has reached the printer' },
    QUEUED:     { title: 'Queued', desc: 'Your job is in the queue' },
    PRINTING:   { title: 'Printing started', desc: 'Your document is being printed' },
    SCANNING:   { title: 'Scanning', desc: 'Your document is being scanned' },
    COMPLETED:  { title: 'Done! 🎉', desc: 'Your document is ready for pickup' },
    FAILED:     { title: 'Job failed', desc: 'Tap for details', isError: true },
};

export function NotificationProvider({ children }) {
    const lastNotifiedRef = useRef(null);

    // Fire sonner toast on key status transitions
    const notifyJobStatus = useCallback((status, jobId) => {
        const config = STATUS_TOASTS[status];
        if (!config) return;

        // Deduplicate — don't fire same status twice in a row
        const key = `${jobId}-${status}`;
        if (lastNotifiedRef.current === key) return;
        lastNotifiedRef.current = key;

        if (config.isError) {
            toast.error(config.title, { description: config.desc });
        } else if (status === 'COMPLETED') {
            toast.success(config.title, { description: config.desc });
        } else {
            toast(config.title, { description: config.desc });
        }

        // Browser push if tab is not visible
        if (document.visibilityState !== 'visible') {
            sendPushNotification(config.title, config.desc);
        }
    }, []);

    // Soft permission request — returns true if we should show the nudge UI
    const shouldShowPushNudge = useCallback(() => {
        try {
            const stored = localStorage.getItem(PERM_KEY);
            if (stored) return false; // already answered
            if (!('Notification' in window)) return false;
            if (Notification.permission === 'granted') return false;
            if (Notification.permission === 'denied') return false;
            return true;
        } catch {
            return false;
        }
    }, []);

    // Actually request permission (call from soft nudge "Allow" button)
    const requestPushPermission = useCallback(async () => {
        try {
            if (!('Notification' in window)) return;
            const result = await Notification.requestPermission();
            localStorage.setItem(PERM_KEY, result);
        } catch {
            // fail silently
        }
    }, []);

    // Dismiss nudge without requesting
    const dismissPushNudge = useCallback(() => {
        try {
            localStorage.setItem(PERM_KEY, 'dismissed');
        } catch {
            // fail silently
        }
    }, []);

    // Send browser notification
    const sendPushNotification = useCallback((title, body) => {
        try {
            if (!('Notification' in window)) return;
            if (Notification.permission !== 'granted') return;
            new Notification(title, {
                body,
                icon: '/favicon.svg',
                badge: '/favicon.svg',
            });
        } catch {
            // fail silently
        }
    }, []);

    return (
        <NotificationContext.Provider value={{
            notifyJobStatus,
            shouldShowPushNudge,
            requestPushPermission,
            dismissPushNudge,
        }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const ctx = useContext(NotificationContext);
    if (!ctx) {
        // Return no-op functions if used outside provider
        return {
            notifyJobStatus: () => {},
            shouldShowPushNudge: () => false,
            requestPushPermission: () => {},
            dismissPushNudge: () => {},
        };
    }
    return ctx;
}
