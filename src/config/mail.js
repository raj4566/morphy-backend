const nodemailer = require('nodemailer');

// Create reusable transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
        tls: {
            rejectUnauthorized: false
        }
    });
};

// Send email function
const sendEmail = async (options) => {
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
            to: options.email,
            subject: options.subject,
            html: options.html,
            text: options.text,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✉️  Email sent: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error(`❌ Error sending email: ${error.message}`);
        return { success: false, error: error.message };
    }
};

// Send inquiry notification to customer
const sendInquiryConfirmation = async (inquiryData) => {
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    background-color: #f4f4f4;
                    padding: 20px;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    background: white;
                    padding: 40px;
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                .header {
                    background: linear-gradient(135deg, #0A1612 0%, #0D1D16 100%);
                    color: #00FFB3;
                    padding: 30px;
                    text-align: center;
                    border-radius: 10px 10px 0 0;
                    margin: -40px -40px 30px -40px;
                }
                .header h1 {
                    margin: 0;
                    font-size: 28px;
                }
                .content {
                    padding: 20px 0;
                }
                .detail-row {
                    margin: 15px 0;
                    padding: 10px;
                    background: #f9f9f9;
                    border-left: 4px solid #00FFB3;
                }
                .detail-label {
                    font-weight: bold;
                    color: #0A1612;
                }
                .footer {
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 2px solid #00FFB3;
                    text-align: center;
                    color: #666;
                    font-size: 14px;
                }
                .cta-button {
                    display: inline-block;
                    padding: 15px 30px;
                    background: #00FFB3;
                    color: #0A1612;
                    text-decoration: none;
                    border-radius: 5px;
                    font-weight: bold;
                    margin: 20px 0;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>MORPHERGYX LLP</h1>
                    <p style="margin: 10px 0 0 0; color: #E8F0ED;">Waste-to-Value Biotechnology</p>
                </div>
                <div class="content">
                    <h2 style="color: #0A1612;">Thank You for Your Inquiry!</h2>
                    <p>Dear ${inquiryData.name},</p>
                    <p>We have received your inquiry and our team will review it shortly. Here are the details we received:</p>
                    
                    <div class="detail-row">
                        <span class="detail-label">Company:</span> ${inquiryData.company}
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Contact Person:</span> ${inquiryData.name}
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Email:</span> ${inquiryData.email}
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Phone:</span> ${inquiryData.phone}
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Product Interest:</span> ${inquiryData.interest}
                    </div>
                    ${inquiryData.volume ? `<div class="detail-row">
                        <span class="detail-label">Expected Volume:</span> ${inquiryData.volume} tonnes/year
                    </div>` : ''}
                    ${inquiryData.message ? `<div class="detail-row">
                        <span class="detail-label">Project Details:</span><br>${inquiryData.message}
                    </div>` : ''}
                    
                    <p><strong>What happens next?</strong></p>
                    <ul>
                        <li>Our team will review your inquiry within 24 hours</li>
                        <li>A dedicated account manager will reach out to discuss your specific needs</li>
                        <li>We'll schedule a consultation to explore how Morphergyx can help achieve your sustainability goals</li>
                    </ul>
                    
                    <center>
                        <a href="https://morphergyx.com" class="cta-button">Visit Our Website</a>
                    </center>
                </div>
                <div class="footer">
                    <p><strong>Morphergyx LLP</strong><br>
                    Pioneer in Waste-to-Value Biotechnology<br>
                    Email: info@morphergyx.com<br>
                    Web: www.morphergyx.com</p>
                    <p style="font-size: 12px; color: #999; margin-top: 15px;">
                        This is an automated confirmation email. Please do not reply to this email.
                    </p>
                </div>
            </div>
        </body>
        </html>
    `;

    return await sendEmail({
        email: inquiryData.email,
        subject: 'Thank You for Your Inquiry - Morphergyx LLP',
        html: html,
    });
};

// Send notification to admin
const sendAdminNotification = async (inquiryData) => {
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                }
                .container {
                    max-width: 700px;
                    margin: 0 auto;
                    padding: 20px;
                    background: #f9f9f9;
                }
                .header {
                    background: #0A1612;
                    color: #00FFB3;
                    padding: 20px;
                    text-align: center;
                }
                .content {
                    background: white;
                    padding: 30px;
                    margin-top: 20px;
                }
                .inquiry-detail {
                    margin: 10px 0;
                    padding: 10px;
                    background: #f5f5f5;
                    border-left: 4px solid #00FFB3;
                }
                .label {
                    font-weight: bold;
                    color: #0A1612;
                }
                .priority {
                    display: inline-block;
                    padding: 5px 15px;
                    background: #ff6b6b;
                    color: white;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: bold;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔔 New Inquiry Received</h1>
                    <span class="priority">ACTION REQUIRED</span>
                </div>
                <div class="content">
                    <p><strong>A new business inquiry has been submitted through the website.</strong></p>
                    <p>Submitted on: ${new Date().toLocaleString()}</p>
                    
                    <h3>Company Information:</h3>
                    <div class="inquiry-detail">
                        <span class="label">Company Name:</span> ${inquiryData.company}
                    </div>
                    
                    <h3>Contact Details:</h3>
                    <div class="inquiry-detail">
                        <span class="label">Contact Person:</span> ${inquiryData.name}
                    </div>
                    <div class="inquiry-detail">
                        <span class="label">Email:</span> <a href="mailto:${inquiryData.email}">${inquiryData.email}</a>
                    </div>
                    <div class="inquiry-detail">
                        <span class="label">Phone:</span> <a href="tel:${inquiryData.phone}">${inquiryData.phone}</a>
                    </div>
                    
                    <h3>Inquiry Details:</h3>
                    <div class="inquiry-detail">
                        <span class="label">Product Interest:</span> ${inquiryData.interest}
                    </div>
                    ${inquiryData.volume ? `<div class="inquiry-detail">
                        <span class="label">Expected Annual Volume:</span> ${inquiryData.volume} tonnes
                    </div>` : ''}
                    ${inquiryData.message ? `<div class="inquiry-detail">
                        <span class="label">Project Details:</span><br><br>${inquiryData.message}
                    </div>` : ''}
                    
                    <p style="margin-top: 30px; padding: 15px; background: #fff9e6; border-left: 4px solid #ffc107;">
                        <strong>⚡ Action Required:</strong> Please follow up with this inquiry within 24 hours.
                    </p>
                </div>
            </div>
        </body>
        </html>
    `;

    return await sendEmail({
        email: process.env.ADMIN_EMAIL,
        subject: `🔔 New Inquiry: ${inquiryData.company} - ${inquiryData.interest}`,
        html: html,
    });
};

module.exports = {
    sendEmail,
    sendInquiryConfirmation,
    sendAdminNotification,
};
