const express = require('express');
const app = express();
const nodemailer = require('nodemailer');
const ejs = require('ejs');
const path = require('path');

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  res.send('Welcome to the email sending example!');
});

// Endpoint to send an email
app.get('/send-email', async (req, res) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'raghuveer@codegnan.com', // Your Gmail email address
        pass: 'xqbiemzyxrmybhue' // Your Gmail password
      }
    });

    const mailOptions = {
      from: 'raghuveer@codegnan.com', // Sender address
      to: 'raghuveer@codegnan.com', // Recipient address
      subject: 'Test Email from Node.js', // Subject line
      html: `
      <html>
        <body>
          <h1>Hello, John Doe</h1>
          <p>This is a test email sent from Node.js.</p>
        </body>
      </html>
    `  
      
      // Render the EJS template
    };

    // Send email
    await transporter.sendMail(mailOptions);
    res.send('Email sent successfully!');
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).send('An error occurred while sending the email.');
  }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});