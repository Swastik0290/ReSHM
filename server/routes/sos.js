const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

router.post('/', async (req, res) => {
    try {
        const { emails, location, timestamp, senderEmail, senderPassword } = req.body;

        if (!emails || !Array.isArray(emails) || emails.length === 0) {
            return res.status(400).json({ error: 'No emergency emails provided' });
        }

        const finalEmailUser = senderEmail || process.env.EMAIL_USER;
        const finalEmailPass = senderPassword || process.env.EMAIL_PASS;

        const transporter = nodemailer.createTransport({
            service: 'gmail', // Configure appropriate service or generic SMTP here
            auth: {
                user: finalEmailUser,
                pass: finalEmailPass
            }
        });

        const mailOptions = {
            // ==========================================
            // HOW TO CHANGE THE EMAIL MESSAGE
            // Edit the `subject` and `text` fields below 
            // to customize your SOS email exactly.
            // ==========================================
            from: finalEmailUser || '"ReSHM SOS" <noreply@reshm.network>',
            to: emails.join(', '),
            subject: 'EMERGENCY: SOS Alert Triggered',
            text: `An SOS alert was triggered from the ReSHM dashboard at ${new Date(timestamp || Date.now()).toLocaleString()}.\n\nPlease check on the individual immediately.`
        };

        if (finalEmailUser && finalEmailPass) {
            await transporter.sendMail(mailOptions);
            res.status(200).json({ message: 'SOS emails sent successfully' });
        } else {
            // Fallback for demonstration when no ENVs or Dashboard settings are configured
            console.warn('No Sender Email or Password provided. Simulating email send.');
            console.log('Would have sent to:', emails.join(', '));
            console.log('Payload:', mailOptions.text);
            res.status(200).json({ message: 'Simulated SOS emails sent (no sender configured)' });
        }

    } catch (error) {
        console.error('Error sending SOS email:', error);
        res.status(500).json({ error: 'Failed to send SOS emails' });
    }
});

module.exports = router;
