Your policies are already much better than most early-stage startups. For PayU approval, the issue is mainly **consistency, clarity, and compliance wording** — especially around:

* shipping/delivery policy
* payment flow transparency
* refund clarity
* business description (LOB)
* guest/demo access
* mismatch between pages

Right now there are a few contradictions and missing sections that payment gateways usually flag.

Here’s exactly what to change.

---

# 1. ADD A SEPARATE “Shipping & Delivery Policy” PAGE

This is the biggest missing item.

Even though LePrint doesn’t physically ship products, PayU still expects a delivery/shipping policy page.

Create:

`/shipping-policy`

Title:

# Shipping & Delivery Policy

Add this content:

---

## Shipping & Delivery Policy

Last updated: May 26, 2026

LePrint is a cloud-based digital print service and does not ship physical products via courier or postal services.

All print, scan, and photocopy services are fulfilled directly at self-service LePrint kiosks selected by the user during the checkout process.

### Service Delivery

After successful payment:

* The uploaded document is securely transmitted to the selected kiosk
* The print or scan job becomes available immediately or within a few seconds
* Users can collect printed documents directly from the kiosk location

### No Physical Shipping

Since LePrint operates through on-site kiosk fulfillment:

* No courier delivery is involved
* No shipping charges are applied
* No tracking IDs or shipment partners are used

### Delivery Failures

If a kiosk is offline, unavailable, or unable to complete the job after payment:

* The job may be retried automatically
* Users may contact support for assistance
* Eligible cases are covered under our Refund & Cancellation Policy

### Contact

LePrint Support
[support@leprint.in](mailto:support@leprint.in)

---

# 2. FIX MAJOR CONTRADICTION IN PRIVACY POLICY

You currently say:

> deleted within 2 hours OR 30 mins after completion

But FAQ says:

> deleted immediately after kiosk downloads it

This inconsistency is BAD for compliance review.

Choose ONE policy.

Recommended:

## Replace THIS:

> These are stored temporarily on our servers and automatically deleted within 2 hours of upload or 30 minutes after job completion.

## WITH:

> Uploaded documents are stored temporarily only for job processing and are automatically deleted immediately after successful kiosk retrieval, or within a maximum of 2 hours if the job is not completed.

---

# 3. FIX ANOTHER CONTRADICTION (ACCOUNT REQUIRED vs GUEST LOGIN)

FAQ says:

> Google account is required

But your actual system has guest mode.

This WILL get flagged because reviewer will see guest access.

---

## Replace this FAQ:

> Can I print without creating an account?
> No — a Google account is required.

## WITH:

> Can I print without creating an account?
>
> Yes. LePrint supports limited guest access for quick printing without account creation.
>
> However, signing in with Google provides additional features including print history, faster reprints, and refund support.

---

# 4. FIX PRICE INCONSISTENCY

Terms says:

* ₹5/page

FAQ says:

* ₹3/page

This is a huge red flag for payment gateway compliance.

Make pricing consistent everywhere.

Recommended:
Avoid fixed pricing in legal docs.

---

## Replace Terms pricing section with:

| Service                      | Pricing                                                                                                                                  |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Printing / Scanning Services | Pricing varies based on paper type, color mode, page count, and kiosk location. Final charges are displayed before payment confirmation. |

Then remove fixed ₹3 references from FAQ too.

Replace with:

> Pricing is displayed before payment confirmation and may vary depending on print type, page count, and kiosk location.

This avoids future compliance issues forever.

---

# 5. ADD PAYMENT FLOW DESCRIPTION PAGE

PayU explicitly requested:

> complete payment flow and complete checkout journey

Create a page:
`/how-it-works`

Add:

# How LePrint Works

1. User scans the kiosk QR code
2. User logs in or continues as guest
3. User uploads document
4. User selects print settings
5. System calculates final cost
6. User completes payment through PayU
7. Kiosk receives encrypted print job
8. User collects printed document from kiosk
9. Uploaded files are automatically deleted after processing

Then add screenshots if possible:

* upload screen
* payment screen
* print success screen

PayU reviewers LOVE screenshots.

---

# 6. ADD BUSINESS DESCRIPTION (LOB)

PayU wants:

> complete LOB description

You should send this via email AND place shortened version on site footer/about page.

Use this:

LePrint is a cloud-based self-service kiosk platform that enables users to print, scan, and photocopy documents directly from their mobile devices.

Users scan a QR code at a LePrint kiosk, upload documents through the website, select print settings, complete payment online, and collect printed output instantly at the kiosk.

The platform supports both guest access and Google sign-in. Payments are collected digitally before print execution. No physical goods are shipped through courier services.

Uploaded files are stored temporarily only for processing and are automatically deleted after successful kiosk retrieval or expiry.

LePrint operates as a digital document fulfillment platform and does not provide downloadable digital products or subscription services.

---

# 7. ADD FOOTER LINKS (IMPORTANT)

Make sure ALL these are visible in footer on every page:

* Privacy Policy
* Terms of Service
* Refund & Cancellation Policy
* Shipping & Delivery Policy
* Contact Us
* FAQs / Support

Payment gateways check this immediately.

---

# 8. ADD CONTACT DETAILS TO FOOTER

Footer should include:

* business email
* business address
* support response time

Example:

> Support: [support@leprint.in](mailto:support@leprint.in)
> Response Time: 2 business days
> Bangalore, Karnataka, India

---

# 9. ADD “CONTACT US” PAGE

Create `/contact`

Include:

* support email
* registered address
* response time
* support hours

Payment gateways expect this.

---

# 10. FIX REFUND POLICY LANGUAGE

Current:

> We do not charge for jobs that fail before printing begins.

Good.

But add:

> Refunds are processed only after verification of transaction logs and kiosk job status.

This makes gateways happier.

---

# 11. REMOVE ABSOLUTE SECURITY CLAIMS

This is risky:

> Nobody. No admin, no employee, and no other user can access your file.

Never use absolute statements legally.

Replace with:

> Uploaded files are protected through encrypted transfer and restricted access controls. Access is limited only to systems necessary for processing the print job.

---

# 12. ADD COMPANY/ENTITY INFORMATION

Somewhere on footer/about/contact:

* Legal entity name
* city/state
* support email

Even if not incorporated yet, add operator details consistently.

---

# 13. IMPORTANT — CHANGE “XEROX”

Avoid using “xerox” legally in formal policy pages because it’s a trademark.

Replace:

* xerox

With:

* photocopying
* photocopy services

everywhere in legal docs.

---

# 14. THINGS THAT ARE ALREADY GOOD

These are already strong:

* refund scenarios
* deletion policy idea
* PCI/payment wording
* HTTPS mention
* jurisdiction clause
* prohibited content
* refund timelines
* support process

So you’re mostly fixing inconsistencies, not rewriting everything.

---

# FINAL PRIORITY ORDER

Do these FIRST:

1. Add Shipping Policy
2. Fix contradictory deletion wording
3. Fix guest login contradiction
4. Fix pricing inconsistencies
5. Add payment flow page
6. Add footer links/contact
7. Replace “xerox”
8. Send LOB email to PayU

Those alone will probably clear the review.

