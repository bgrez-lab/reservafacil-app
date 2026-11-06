const mongoose = require('mongoose');

const chatbotQASchema = new mongoose.Schema({
  pregunta: { type: String, required: true, trim: true },
  respuesta: { type: String, required: true, trim: true },
  categoria: { type: String, default: 'general' },
  activo: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('ChatbotQA', chatbotQASchema);
