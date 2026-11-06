const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth');
const ChatbotQA = require('../models/ChatbotQA');
const ChatConversation = require('../models/ChatConversation');

router.get('/', async (req, res) => {
  try {
    if (require('mongoose').connection.readyState !== 1) {
      return res.render('chatbot', { qas: [], categorias: [] });
    }
    const qas = await ChatbotQA.find({ activo: true }).sort({ categoria: 1, pregunta: 1 });
    const categorias = [...new Set(qas.map((q) => q.categoria))];
    return res.render('chatbot', { qas, categorias });
  } catch (error) {
    return res.render('chatbot', { qas: [], categorias: [] });
  }
});

router.post('/ask', async (req, res) => {
  try {
    const question = (req.body.pregunta || '').trim();
    if (!question) {
      return res.json({ respuesta: 'Por favor escribe una consulta.', categoria: 'general' });
    }

    const qas = await ChatbotQA.find({ activo: true });
    const lower = question.toLowerCase();

    let match = qas.find((qa) => lower === qa.pregunta.toLowerCase());
    if (!match) {
      match = qas.find((qa) => qa.pregunta.toLowerCase().includes(lower) || lower.includes(qa.pregunta.toLowerCase()));
    }
    if (!match) {
      const words = lower.split(/\s+/).filter((w) => w.length > 3);
      match = qas.find((qa) => words.some((w) => qa.pregunta.toLowerCase().includes(w)));
    }

    let respuesta;
    let categoria = 'general';
    if (match) {
      respuesta = match.respuesta;
      categoria = match.categoria;
    } else {
      respuesta = 'No tengo una respuesta exacta para eso. Puedo ayudarte con reservas, horarios, cancelaciones o contacto. Si prefieres, solicita hablar con un ejecutivo.';
      categoria = 'sin-respuesta';
    }

    try {
      await ChatConversation.create({
        pregunta: question,
        respuesta,
        categoria,
        ip: req.ip || ''
      });
    } catch (logError) {
      console.error('No se pudo registrar la conversación:', logError.message);
    }

    return res.json({ respuesta, categoria });
  } catch (error) {
    return res.status(500).json({ respuesta: 'Error del chatbot. Inténtalo nuevamente.' });
  }
});

router.post('/contact-request', async (req, res) => {
  try {
    await ChatConversation.create({
      pregunta: `Solicitud de contacto: ${req.body.resumen || 'Sin detalle'}`,
      respuesta: 'Derivado a ejecutivo',
      categoria: 'contacto',
      ip: req.ip || ''
    });
    return res.json({ ok: true, mensaje: 'Un ejecutivo te contactará pronto.' });
  } catch (error) {
    return res.status(500).json({ ok: false, mensaje: 'No se pudo registrar la solicitud.' });
  }
});

router.get('/admin', requireAdmin, async (req, res) => {
  const qas = await ChatbotQA.find().sort({ categoria: 1 });
  return res.json(qas);
});

router.post('/', requireAdmin, async (req, res) => {
  try {
    const qa = await ChatbotQA.create(req.body);
    return res.status(201).json(qa);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const qa = await ChatbotQA.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!qa) {return res.status(404).json({ error: 'No encontrado' });}
    return res.json(qa);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await ChatbotQA.findByIdAndDelete(req.params.id);
    return res.json({ ok: true });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

module.exports = router;
