const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const { OAuth2Client } = require('google-auth-library');

const oAuth2Client = process.env.GOOGLE_CLIENT_ID ? new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'postmessage'
) : null;

router.post('/google-auth', async (req, res) => {
    try {
        const { code } = req.body;
        if (!oAuth2Client) {
            return res.status(503).json({ error: 'Google OAuth not configured on server (Missing GOOGLE_CLIENT_ID)' });
        }
        const { tokens } = await oAuth2Client.getToken(code);
        // Send back the refresh token to be saved in Settings
        res.json({ refreshToken: tokens.refresh_token, accessToken: tokens.access_token });
    } catch (error) {
        console.error('Google Auth Token Exchange Error:', error);
        res.status(400).json({ error: 'Failed to exchange Google authorization code' });
    }
});

router.post('/', async (req, res) => {
    try {
        const { emails, location, timestamp, senderEmail, senderPassword, subject, text } = req.body;

        if (!emails || !Array.isArray(emails) || emails.length === 0) {
            return res.status(400).json({ error: 'No emergency emails provided' });
        }

        if (!senderEmail || !senderPassword) {
            return res.status(400).json({ error: 'Sender email and app password are required' });
        }

        // If senderPassword is very long, it's likely a Google OAuth Refresh Token
        const isOAuth = senderPassword && senderPassword.length > 30;

        let authOptions = {};
        if (isOAuth) {
            authOptions = {
                type: 'OAuth2',
                user: senderEmail,
                clientId: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                refreshToken: senderPassword
            };
        } else {
            authOptions = {
                user: senderEmail,
                pass: senderPassword
            };
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: authOptions
        });

        const defaultSubject = '🚨 EMERGENCY: SOS Alert Triggered – ReSHM';
        const defaultText = `An SOS alert was triggered from the ReSHM dashboard at ${new Date(timestamp || Date.now()).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}.\n\nPlease check on the individual immediately.\n\n—\nReSHM Emergency Response System`;

        const mailOptions = {
            from: `"ReSHM SOS" <${senderEmail}>`,
            to: emails.join(', '),
            subject: subject || defaultSubject,
            text: text || defaultText
        };

        try {
            await transporter.sendMail(mailOptions);
            return res.status(200).json({ message: 'SOS emails sent successfully' });
        } catch (smtpErr) {
            console.error('SMTP send error:', smtpErr.message);
            return res.status(422).json({
                error: 'SMTP delivery failed',
                detail: smtpErr.message.includes('auth') || smtpErr.message.includes('535')
                    ? 'Authentication failed — check sender email and app password in Settings'
                    : smtpErr.message
            });
        }

    } catch (error) {
        console.error('Error sending SOS email:', error);
        res.status(500).json({ error: 'Failed to send SOS emails' });
    }
});

module.exports = router;
