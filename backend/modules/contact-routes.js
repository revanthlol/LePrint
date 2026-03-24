// backend/modules/contact-routes.js
const express = require('express');
const nodemailer = require('nodemailer');
const router = express.Router();

const log = require('./logger');

const SUPPORT_EMAIL = 'support@leprint.in';

/**
 * POST /api/contact
 * Public endpoint — no auth required.
 * Sends a contact form submission email to support@leprint.in.
 */
router.post('/contact', async (req, res) => {
    const { name, email, subject, message } = req.body;

    // ── Validate required fields ──────────────────────────────────────────
    const missing = [];
    if (!name    || typeof name    !== 'string' || !name.trim())    missing.push('name');
    if (!email   || typeof email   !== 'string' || !email.trim())   missing.push('email');
    if (!message || typeof message !== 'string' || !message.trim()) missing.push('message');

    if (missing.length > 0) {
        return res.status(400).json({
            success: false,
            error: `Missing required fields: ${missing.join(', ')}`
        });
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
        return res.status(400).json({ success: false, error: 'Invalid email address' });
    }

    // ── Build email ───────────────────────────────────────────────────────
    const resolvedSubject = subject?.trim()
        ? subject.trim()
        : `Contact from ${name.trim()} via LePrint`;

    const html = `
        <div style="font-family: sans-serif; max-width: 600px;">
            <h2 style="margin-bottom: 4px;">New Contact Form Submission</h2>
            <p style="color: #666; margin-top: 0;">LePrint — contact@leprint.in</p>
            <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 16px 0;" />

            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px 0; color: #888; width: 100px; vertical-align: top;"><strong>Name</strong></td>
                    <td style="padding: 8px 0;">${escapeHtml(name.trim())}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #888; vertical-align: top;"><strong>Email</strong></td>
                    <td style="padding: 8px 0;">
                        <a href="mailto:${escapeHtml(email.trim())}">${escapeHtml(email.trim())}</a>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #888; vertical-align: top;"><strong>Subject</strong></td>
                    <td style="padding: 8px 0;">${escapeHtml(resolvedSubject)}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #888; vertical-align: top;"><strong>Message</strong></td>
                    <td style="padding: 8px 0; white-space: pre-wrap;">${escapeHtml(message.trim())}</td>
                </tr>
            </table>

            <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 16px 0;" />
            <p style="color: #aaa; font-size: 12px;">
                Sent via the LePrint contact form · ${new Date().toISOString()}
            </p>
        </div>
    `;

    // ── Send via Hostinger SMTP ───────────────────────────────────────────
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.hostinger.com',
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        await transporter.sendMail({
            from: `"LePrint Contact" <${process.env.EMAIL_USER}>`,
            to: SUPPORT_EMAIL,
            replyTo: email.trim(),
            subject: `[Contact] ${resolvedSubject}`,
            html,
        });

        log.info(`[Contact] Email sent from ${email.trim()} — "${resolvedSubject}"`);
        return res.json({ success: true });

    } catch (err) {
        log.error(`[Contact] Failed to send email: ${err.message}`);
        return res.status(500).json({
            success: false,
            error: 'Failed to send message. Please try again later.'
        });
    }
});

/** Escape HTML special characters to prevent injection in the email body */
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

module.exports = router;
