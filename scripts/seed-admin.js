require('dotenv').config();
const { connectDatabase } = require('../db/connection');
const User = require('../models/User');
const ChatbotQA = require('../models/ChatbotQA');
const SocialLink = require('../models/SocialLink');
const { hashPassword } = require('../utils/password');

async function seedAdmin() {
  await connectDatabase();

  const email = (process.env.ADMIN_EMAIL || 'admin@reservafacil.com').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const nombre = process.env.ADMIN_NAME || 'Administrador';

  const passwordHash = await hashPassword(password);

  await User.findOneAndUpdate(
    { email },
    { nombre, email, passwordHash, rol: 'admin', activo: true },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const qaCount = await ChatbotQA.countDocuments();
  if (qaCount === 0) {
    await ChatbotQA.insertMany([
      { pregunta: '¿Cómo agendo una reserva?', respuesta: 'Ingresa a Nueva Reserva, selecciona servicio, fecha y hora, y confirma.', categoria: 'reservas' },
      { pregunta: '¿Puedo cancelar una reserva?', respuesta: 'Sí, desde Mis Reservas puedes cancelar tus reservas activas.', categoria: 'reservas' },
      { pregunta: '¿Cómo contacto a la empresa?', respuesta: 'Usa el formulario de contacto o el chatbot para solicitar atención.', categoria: 'contacto' }
    ]);
  }

  const socialCount = await SocialLink.countDocuments();
  if (socialCount === 0) {
    await SocialLink.insertMany([
      { plataforma: 'Instagram', url: 'https://instagram.com/reservafacil', activo: true, orden: 1 },
      { plataforma: 'Facebook', url: 'https://facebook.com/reservafacil', activo: true, orden: 2 },
      { plataforma: 'LinkedIn', url: 'https://linkedin.com/company/reservafacil', activo: true, orden: 3 }
    ]);
  }

  console.log('Administrador listo:', email);
  if (!process.env.ADMIN_PASSWORD) {
    console.warn('ATENCION: se uso la contraseña por defecto "admin123". Define ADMIN_PASSWORD antes de producción.');
  }

  process.exit(0);
}

seedAdmin().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
