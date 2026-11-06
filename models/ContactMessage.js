const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  telefono: { type: String, default: '' },
  asunto: { type: String, required: true, trim: true },
  mensaje: { type: String, required: true, trim: true, maxlength: 2000 },
  estado: { type: String, enum: ['nuevo', 'leido', 'respondido'], default: 'nuevo' }
}, { timestamps: true });

module.exports = mongoose.model('ContactMessage', contactSchema);
