const mongoose = require('mongoose');

const chatConversationSchema = new mongoose.Schema({
  pregunta: { type: String, required: true },
  respuesta: { type: String, required: true },
  categoria: { type: String, default: 'general' },
  ip: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('ChatConversation', chatConversationSchema);
