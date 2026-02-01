const nodemailer = require('nodemailer');

// Create reusable transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
};

/**
 * Send OTP email for MFA
 * @param {string} to - Recipient email
 * @param {string} otp - One-time password
 * @param {string} username - User's username
 * @returns {Promise<boolean>} Success status
 */
const sendOTPEmail = async (to, otp, username) => {
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: process.env.EMAIL_FROM || 'noreply@courseregistration.com',
            to: to,
            subject: '🔐 Your Verification Code - Course Registration System',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .header h1 { color: white; margin: 0; font-size: 24px; }
                        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
                        .otp-box { background: white; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                        .otp-code { font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px; }
                        .warning { color: #dc3545; font-size: 12px; margin-top: 20px; }
                        .footer { text-align: center; margin-top: 20px; color: #6c757d; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🎓 Course Registration System</h1>
                        </div>
                        <div class="content">
                            <p>Hello <strong>${username}</strong>,</p>
                            <p>You've requested to log in to the Course Registration System. Please use the following verification code:</p>
                            <div class="otp-box">
                                <div class="otp-code">${otp}</div>
                                <p style="color: #6c757d; margin-top: 10px;">Valid for ${process.env.OTP_EXPIRY_MINUTES || 5} minutes</p>
                            </div>
                            <p>If you didn't request this code, please ignore this email or contact support immediately.</p>
                            <p class="warning">⚠️ Never share this code with anyone. Our team will never ask for your verification code.</p>
                        </div>
                        <div class="footer">
                            <p>This is an automated message. Please do not reply.</p>
                            <p>© 2026 Course Registration System. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        // In development, log OTP to console
        if (process.env.NODE_ENV === 'development') {
            console.log(`📧 OTP for ${to}: ${otp}`);
        }

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Email sending failed:', error.message);
        // In development, still return true and log the OTP
        if (process.env.NODE_ENV === 'development') {
            console.log(`📧 [DEV MODE] OTP for ${to}: ${otp}`);
            return true;
        }
        return false;
    }
};

/**
 * Send registration confirmation email
 * @param {string} to - Recipient email
 * @param {string} username - User's username
 * @param {string} courseName - Course name
 * @returns {Promise<boolean>} Success status
 */
const sendRegistrationConfirmation = async (to, username, courseName) => {
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: process.env.EMAIL_FROM || 'noreply@courseregistration.com',
            to: to,
            subject: '✅ Course Registration Confirmed',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .header h1 { color: white; margin: 0; font-size: 24px; }
                        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
                        .success-box { background: white; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); border-left: 4px solid #28a745; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>✅ Registration Confirmed</h1>
                        </div>
                        <div class="content">
                            <p>Hello <strong>${username}</strong>,</p>
                            <div class="success-box">
                                <p>You have been successfully registered for:</p>
                                <h2 style="color: #28a745;">${courseName}</h2>
                            </div>
                            <p>You can view your registered courses in your dashboard.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        if (process.env.NODE_ENV === 'development') {
            console.log(`📧 Registration confirmation sent to ${to} for ${courseName}`);
        }

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Email sending failed:', error.message);
        return false;
    }
};

module.exports = {
    sendOTPEmail,
    sendRegistrationConfirmation
};
