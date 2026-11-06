const mongoose = require('mongoose');

const socialLinkSchema = new mongoose.Schema({
  plataforma: { type: String, required: true, trim: true },
  url: { type: String, required: true, trim: true },
  activo: { type: Boolean, default: true },
  orden: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('SocialLink', socialLinkSchema);
