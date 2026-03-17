const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

router.post('/', async (req, res) => {
    try {
        const { emails, location, timestamp, senderEmail, senderPassword } = req.body;

        if (!emails || !Array.isArray(emails) || emails.length === 0) {
            return res.status(400).json({ error: 'No emergency emails provided' });
        }

        if (!senderEmail || !senderPassword) {
            return res.status(400).json({ error: 'Sender email and app password are required' });
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: senderEmail,
                pass: senderPassword
            }
        });

        const mailOptions = {
            from: `"ReSHM SOS" <${senderEmail}>`,
            to: emails.join(', '),
            subject: '🚨 EMERGENCY: SOS Alert Triggered – ReSHM',
            text: `An SOS alert was triggered from the ReSHM dashboard at ${new Date(timestamp || Date.now()).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}.\n\nPlease check on the individual immediately.\n\n—\nReSHM Emergency Response System`
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
