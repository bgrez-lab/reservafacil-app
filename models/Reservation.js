const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  servicioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  fecha: { type: String, required: true },
  hora: { type: String, required: true },
  estado: { type: String, enum: ['pendiente', 'confirmada', 'cancelada', 'completada'], default: 'pendiente' }
}, { timestamps: true });

reservationSchema.index({ fecha: 1, hora: 1 }, { unique: true, partialFilterExpression: { estado: { $ne: 'cancelada' } } });

module.exports = mongoose.model('Reservation', reservationSchema);
