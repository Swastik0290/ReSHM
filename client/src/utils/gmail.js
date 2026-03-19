/**
 * Helper to formulate and send an email using the Gmail REST API directly from the frontend.
 * Requires a valid Google OAuth access_token with the 'https://www.googleapis.com/auth/gmail.send' scope.
 */

const createRawEmail = (to, subject, message) => {
    const emailData = [
        `To: ${to}`,
        `Subject: ${subject}`,
        `MIME-Version: 1.0`,
        `Content-Type: text/plain; charset=utf-8`,
        '',
        message
    ].join('\n');

    // Base64URL encode the email
    return btoa(unescape(encodeURIComponent(emailData)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
};

export const sendEmailViaGmailAPI = async (accessToken, toEmails, subject, message) => {
    if (!accessToken) throw new Error("No Google Access Token is available");

    const emails = Array.isArray(toEmails) ? toEmails : [toEmails];

    for (const to of emails) {
        const raw = createRawEmail(to, subject, message);

        const response = await fetch('https://gmail.googleapis.com/upload/gmail/v1/users/me/messages/send', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ raw })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || "Failed to send email via Google Gmail API");
        }
    }
};
