const nodemailer = require('nodemailer');

// Create a transporter using the default SMTP transport
const transporter = nodemailer.createTransport({
    service: 'Gmail', // Use your email service provider (e.g., Gmail)
    auth: {
        user: 'satyadeepg@codegnan.com', // Your email address
        pass: '9603996089' // Your email password (You can use an app-specific password for security)
    }
});

// Function to send a welcome email
async function sendWelcomeEmail(toEmail) {
    try {
        // Send mail with defined transport object
        const info = await transporter.sendMail({
            from: 'your-email@gmail.com', // Sender email address
            to: toEmail, // Recipient email address
            subject: 'Welcome to Your App', // Email subject
            text: 'Welcome to Your App! Thank you for signing up.' // Email content (plain text)
        });

        console.log('Email sent: ', info.response);
    } catch (error) {
        console.error('Error sending email: ', error);
    }
}

module.exports = {
    sendWelcomeEmail
};
