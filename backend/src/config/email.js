const nodemailer = require('nodemailer');
const config = require('./env');

// Create transporter based on environment
const createTransporter = () => {
  if (config.NODE_ENV === 'production') {
    return nodemailer.createTransporter({
      service: 'gmail', 
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD 
      }
    });
  } else {
    return nodemailer.createTransporter({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: process.env.ETHEREAL_EMAIL || 'ethereal.user@ethereal.email',
        pass: process.env.ETHEREAL_PASSWORD || 'ethereal.pass'
      }
    });
  }
};

const transporter = createTransporter();

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Email transporter error:', error);
  } else {
    console.log('Email server is ready to take our messages');
  }
});

module.exports = transporter;