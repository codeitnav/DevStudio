const transporter = require('../config/email');
const config = require('../config/env');

/**
 * Send password reset email
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email
 * @param {string} options.name - Recipient name
 * @param {string} options.resetUrl - Password reset URL
 * @returns {Promise} - Email send result
 */
const sendPasswordResetEmail = async ({ email, name, resetUrl }) => {
  try {
    const mailOptions = {
      from: {
        name: 'DevStudio Team',
        address: process.env.EMAIL_FROM || 'noreply@devstudio.com'
      },
      to: email,
      subject: 'Password Reset Request - DevStudio',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset - DevStudio</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f4f4f4;
                }
                .container {
                    background: white;
                    padding: 30px;
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                }
                .logo {
                    font-size: 28px;
                    font-weight: bold;
                    color: #2563eb;
                    margin-bottom: 10px;
                }
                .reset-button {
                    display: inline-block;
                    background-color: #2563eb;
                    color: white !important;
                    padding: 15px 30px;
                    text-decoration: none;
                    border-radius: 5px;
                    font-weight: bold;
                    margin: 20px 0;
                    text-align: center;
                }
                .reset-button:hover {
                    background-color: #1d4ed8;
                }
                .warning {
                    background-color: #fef3cd;
                    border: 1px solid #ffeaa7;
                    border-radius: 5px;
                    padding: 15px;
                    margin: 20px 0;
                }
                .footer {
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #eee;
                    font-size: 14px;
                    color: #666;
                    text-align: center;
                }
                .code {
                    background-color: #f8f9fa;
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-family: monospace;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">DevStudio</div>
                    <h2>Password Reset Request</h2>
                </div>
                
                <p>Hello <strong>${name}</strong>,</p>
                
                <p>We received a request to reset your password for your DevStudio account. If you didn't make this request, you can safely ignore this email.</p>
                
                <p>To reset your password, please click the button below:</p>
                
                <div style="text-align: center;">
                    <a href="${resetUrl}" class="reset-button">Reset My Password</a>
                </div>
                
                <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                <p class="code">${resetUrl}</p>
                
                <div class="warning">
                    <strong>⚠️ Important:</strong>
                    <ul>
                        <li>This link will expire in <strong>10 minutes</strong> for security reasons</li>
                        <li>You can only use this link once</li>
                        <li>If you didn't request this reset, please secure your account immediately</li>
                    </ul>
                </div>
                
                <p>Need help? Contact our support team at <a href="mailto:support@devstudio.com">support@devstudio.com</a></p>
                
                <div class="footer">
                    <p>Best regards,<br>The DevStudio Team</p>
                    <p>This email was sent to ${email}. If you no longer wish to receive these emails, you can <a href="#">unsubscribe here</a>.</p>
                </div>
            </div>
        </body>
        </html>
      `,
      text: `
        Hello ${name},

        We received a request to reset your password for your DevStudio account.

        To reset your password, please visit this link: ${resetUrl}

        This link will expire in 10 minutes for security reasons.

        If you didn't request this reset, please ignore this email.

        Best regards,
        The DevStudio Team
      `
    };

    const result = await transporter.sendMail(mailOptions);
    
    console.log('Password reset email sent successfully');
    console.log('Message ID:', result.messageId);
    
    // For development with Ethereal, log the preview URL
    if (config.NODE_ENV === 'development') {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(result));
    }

    return {
      success: true,
      messageId: result.messageId,
      previewUrl: config.NODE_ENV === 'development' ? nodemailer.getTestMessageUrl(result) : null
    };

  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

/**
 * Send welcome email to new users
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email
 * @param {string} options.name - Recipient name
 * @returns {Promise} - Email send result
 */
const sendWelcomeEmail = async ({ email, name }) => {
  try {
    const mailOptions = {
      from: {
        name: 'DevStudio Team',
        address: process.env.EMAIL_FROM || 'noreply@devstudio.com'
      },
      to: email,
      subject: 'Welcome to DevStudio! 🎉',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to DevStudio</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f4f4f4;
                }
                .container {
                    background: white;
                    padding: 30px;
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                }
                .logo {
                    font-size: 28px;
                    font-weight: bold;
                    color: #2563eb;
                    margin-bottom: 10px;
                }
                .cta-button {
                    display: inline-block;
                    background-color: #16a34a;
                    color: white !important;
                    padding: 15px 30px;
                    text-decoration: none;
                    border-radius: 5px;
                    font-weight: bold;
                    margin: 20px 0;
                }
                .feature-list {
                    background-color: #f8fafc;
                    padding: 20px;
                    border-radius: 5px;
                    margin: 20px 0;
                }
                .footer {
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #eee;
                    font-size: 14px;
                    color: #666;
                    text-align: center;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">DevStudio</div>
                    <h2>Welcome to DevStudio! 🎉</h2>
                </div>
                
                <p>Hello <strong>${name}</strong>,</p>
                
                <p>Welcome to DevStudio - the collaborative code editor that brings developers together! We're excited to have you join our community.</p>
                
                <div class="feature-list">
                    <h3>🚀 What you can do with DevStudio:</h3>
                    <ul>
                        <li><strong>Real-time Collaboration:</strong> Code together with your team in real-time</li>
                        <li><strong>Multiple Languages:</strong> Support for 20+ programming languages</li>
                        <li><strong>Video Chat:</strong> Built-in WebRTC for seamless communication</li>
                        <li><strong>Project Management:</strong> Organize your code in rooms and folders</li>
                        <li><strong>Role-based Access:</strong> Control who can edit, view, or invite others</li>
                    </ul>
                </div>
                
                <p>Ready to start coding? Create your first room and invite your team!</p>
                
                <div style="text-align: center;">
                    <a href="${config.CORS_ORIGIN}/dashboard" class="cta-button">Go to Dashboard</a>
                </div>
                
                <p>If you have any questions or need help getting started, don't hesitate to reach out to our support team at <a href="mailto:support@devstudio.com">support@devstudio.com</a></p>
                
                <div class="footer">
                    <p>Happy coding!<br>The DevStudio Team</p>
                    <p>Follow us on social media for updates and tips!</p>
                </div>
            </div>
        </body>
        </html>
      `,
      text: `
        Hello ${name},

        Welcome to DevStudio - the collaborative code editor!

        What you can do with DevStudio:
        - Real-time Collaboration: Code together with your team
        - Multiple Languages: Support for 20+ programming languages  
        - Video Chat: Built-in WebRTC communication
        - Project Management: Organize code in rooms and folders
        - Role-based Access: Control permissions

        Visit your dashboard: ${config.CORS_ORIGIN}/dashboard

        Need help? Contact us at support@devstudio.com

        Happy coding!
        The DevStudio Team
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent successfully');
    
    return {
      success: true,
      messageId: result.messageId
    };

  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw new Error('Failed to send welcome email');
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendWelcomeEmail
};
