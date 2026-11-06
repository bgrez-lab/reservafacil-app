const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const nodemailer = require('nodemailer');
const ContactMessage = require('../models/ContactMessage');

const contactLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false });

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
  });
}

router.get('/', (req, res) => {
  return res.render('contacto', { error: null, success: null });
});

router.post('/', contactLimiter, async (req, res) => {
  try {
    const { nombre, email, telefono, asunto, mensaje } = req.body;
    if (!nombre || !email || !asunto || !mensaje) {
      return res.status(400).render('contacto', { error: 'Todos los campos obligatorios deben completarse', success: null });
    }
    if (mensaje.length > 2000) {
      return res.status(400).render('contacto', { error: 'El mensaje es demasiado largo', success: null });
    }

    await ContactMessage.create({ nombre, email, telefono, asunto, mensaje });

    const institutionalEmail = process.env.CONTACT_EMAIL || process.env.SMTP_USER;
    if (institutionalEmail && process.env.SMTP_HOST) {
      const transporter = createTransporter();
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: institutionalEmail,
        subject: `[Contacto] ${asunto}`,
        text: `Nombre: ${nombre}\nEmail: ${email}\nTeléfono: ${telefono || '-'}\n\n${mensaje}`
      });
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: email,
        subject: 'Hemos recibido tu consulta',
        text: `Hola ${nombre},\n\nGracias por contactarnos. Hemos recibido tu mensaje y te responderemos pronto.\n\nReservaFácil SpA`
      });
    }

    return res.render('contacto', { error: null, success: 'Tu mensaje fue enviado correctamente.' });
  } catch (error) {
    console.error('Error en contacto:', error);
    return res.status(500).render('contacto', { error: 'No se pudo enviar el mensaje. Inténtalo nuevamente.', success: null });
  }
});

module.exports = router;
