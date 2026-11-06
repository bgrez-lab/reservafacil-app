const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth');
const ChatbotQA = require('../models/ChatbotQA');

router.get('/', async (req, res) => {
  try {
    if (require('mongoose').connection.readyState !== 1) {
      return res.render('chatbot', { qas: [] });
    }
    const qas = await ChatbotQA.find({ activo: true }).sort({ categoria: 1 });
    return res.render('chatbot', { qas });
  } catch (error) {
    return res.render('chatbot', { qas: [] });
  }
});

router.post('/ask', async (req, res) => {
  try {
    const question = (req.body.pregunta || '').toLowerCase().trim();
    if (!question) {return res.json({ respuesta: 'Por favor escribe una consulta.' });}

    const qas = await ChatbotQA.find({ activo: true });
    const match = qas.find((qa) => question.includes(qa.pregunta.toLowerCase()) || qa.pregunta.toLowerCase().includes(question));
    if (match) {return res.json({ respuesta: match.respuesta, categoria: match.categoria });}
    return res.json({ respuesta: 'No tengo una respuesta para eso. ¿Deseas que un ejecutivo te contacte?' });
  } catch (error) {
    return res.status(500).json({ error: 'Error del chatbot' });
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
