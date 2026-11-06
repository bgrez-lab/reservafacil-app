const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth');
const SocialLink = require('../models/SocialLink');

router.get('/', async (req, res) => {
  const links = await SocialLink.find({ activo: true }).sort({ orden: 1, plataforma: 1 });
  return res.json(links);
});

router.get('/admin', requireAdmin, async (req, res) => {
  const links = await SocialLink.find().sort({ orden: 1, plataforma: 1 });
  return res.json(links);
});

router.post('/', requireAdmin, async (req, res) => {
  try {
    const link = await SocialLink.create(req.body);
    return res.status(201).json(link);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const link = await SocialLink.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!link) {return res.status(404).json({ error: 'No encontrado' });}
    return res.json(link);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await SocialLink.findByIdAndDelete(req.params.id);
    return res.json({ ok: true });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

module.exports = router;
