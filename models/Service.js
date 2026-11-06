const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true },
  descripcion: { type: String, default: '' },
  duracionMinutos: { type: Number, default: 30, min: 5 },
  activo: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);
