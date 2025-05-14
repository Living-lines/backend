const express = require('express');
const nodemailer = require('nodemailer');
require('dotenv').config();

const router = express.Router();

router.post('/', async (req, res) => {
  const { name, email, message, location } = req.body;

  if (!name || !email || !message || !location) {
    console.error('Missing required fields:', req.body);
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: "ganeshyadav.puli9010@gmail.com",
      pass: "gqemkhdeanolkibm",
    },
  });

  const mailOptions = {
    from: email,
    to: "ganeshyadav.puli9010@gmail.com",
    subject: 'New Contact Form Submission',
    html: `
      <h3>Contact Details</h3>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong> ${message}</p>
      <p><strong>Location:</strong> ${location}</p>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Mail sent:', info.response);
    res.status(200).json({ message: 'Mail sent' });
  } catch (error) {
    console.error('❌ Error sending mail:', error.message);
    console.error(error);
    res.status(500).json({ error: 'Failed to send mail', details: error.message });
  }
});

module.exports = router;
