// Mock email notify helper used in dev/local environments
// Exports notifyFirstApprover(deferralData) which attempts a best-effort notification

export async function notifyFirstApprover(deferralData = {}) {
  try {
    // Use sender/recipient from deferralData when available (fallbacks for local dev)
    const from = deferralData.from || 'ericmewa5@gmail.com';
    const to = (deferralData.currentApprover && deferralData.currentApprover.email) || deferralData.to || 'ericouma4188@gmail.com';

    const customerName = deferralData.customerName || deferralData.createdBy || 'Customer';
    const deferralNumber = deferralData.deferralNumber || 'DEF-UNKNOWN';
    const documentRequested = (deferralData.documents && deferralData.documents[0] && (deferralData.documents[0].name || deferralData.documents[0])) || deferralData.documentName || deferralData.deferralTitle || 'Document';

    const subject = `DEFERRAL REQUEST (${deferralNumber})`;

    const appUrl = (typeof window !== 'undefined' && window.location && window.location.origin) ? window.location.origin : (process.env.VITE_APP_URL || 'http://localhost:5173');
    // Prefer VITE_EMAIL_APPROVAL_REDIRECT_BASE (points to helper /r/:id) if provided; else use VITE_EMAIL_APPROVAL_LINK literal, else fallback to app public route
    const approvalLinkTemplate = (typeof process !== 'undefined' && process.env && process.env.VITE_EMAIL_APPROVAL_REDIRECT_BASE)
      ? `${process.env.VITE_EMAIL_APPROVAL_REDIRECT_BASE.replace(/\/$/, '')}/r/{deferralNumber}`
      : ((typeof process !== 'undefined' && process.env && process.env.VITE_EMAIL_APPROVAL_LINK) ? process.env.VITE_EMAIL_APPROVAL_LINK : `${appUrl}/public/approver/review/{deferralNumber}`);
    let approvalLink = approvalLinkTemplate.includes('{deferralNumber}')
      ? approvalLinkTemplate.replace('{deferralNumber}', encodeURIComponent(deferralNumber))
      : approvalLinkTemplate;

    // Append approver position if present
    const approverPos = deferralData && (deferralData.targetApproverPosition || deferralData.approver);
    if (approverPos) {
      const sep = approvalLink.includes('?') ? '&' : '?';
      approvalLink = `${approvalLink}${sep}approver=${encodeURIComponent(approverPos)}`;
    }

    // Append preview payload if provided (base64-encoded JSON)
    if (deferralData && deferralData.preview) {
      try {
        // Use UTF-8-safe base64 encoding to avoid btoa Unicode errors
        const jsonPreview = JSON.stringify(deferralData.preview);
        let encoded;
        if (typeof TextEncoder !== 'undefined') {
          const bytes = new TextEncoder().encode(jsonPreview);
          let binary = '';
          for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
          encoded = btoa(binary);
        } else {
          // Fallback for environments without TextEncoder
          encoded = btoa(unescape(encodeURIComponent(jsonPreview)));
        }
        const sep2 = approvalLink.includes('?') ? '&' : '?';
        approvalLink = `${approvalLink}${sep2}preview=${encodeURIComponent(encoded)}`;
      } catch (err) {
        console.warn('[realEmailService] Failed to encode preview payload for approval link:', err);
      }
    }

    const body = `I hope this email finds you well, a deferral has been requested for ${customerName}.\n\nDeferral Number: ${deferralNumber}\nDocument requested: ${documentRequested}\n\nKindly action on it as soon as possible.\n\nTo access the approval page, kindly click on the link below;\n\n${approvalLink}`;

    // Simulate network latency
    await new Promise((r) => setTimeout(r, 300));

    const messageId = `local-gmail-${Date.now()}`;

    console.info('[realEmailService] Mock email sent', {
      from,
      to,
      subject,
      body,
      approvalLink,
      deferralNumber,
      messageId
    });

    // Return a structured response used by caller
    return {
      success: true,
      from,
      to,
      subject,
      body,
      approvalLink,
      messageId,
      sentVia: 'mock-local-gmail'
    };
  } catch (err) {
    console.error('[realEmailService] send error', err);
    return { success: false, error: err?.message || 'Unknown error' };
  }
}

export default { notifyFirstApprover };