const { registerVest, getAllVests, updateVest, deleteVest } = require('../db');

function registerVestRoutes(app) {
  /**
   * POST /api/vests — register a new vest
   * Body: { vestId, label?, operator?, zone? }
   */
  app.post('/api/vests', async (req, res) => {
    try {
      const { vestId, label, operator, zone } = req.body;
      const doc = await registerVest({ vestId, label, operator, zone });
      res.status(201).json(doc);
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ error: 'Un gilet avec cet ID existe déjà' });
      }
      console.error('Register vest error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * GET /api/vests — list all registered vests
   */
  app.get('/api/vests', async (_req, res) => {
    try {
      const vests = await getAllVests();
      res.json(vests);
    } catch (err) {
      console.error('List vests error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * PUT /api/vests/:vestId — update vest details
   * Body: { label?, operator?, zone?, status? }
   */
  app.put('/api/vests/:vestId', async (req, res) => {
    try {
      const { vestId } = req.params;
      const updated = await updateVest(vestId, req.body);
      if (!updated) {
        return res.status(404).json({ error: 'Gilet introuvable' });
      }
      res.json(updated);
    } catch (err) {
      console.error('Update vest error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * DELETE /api/vests/:vestId — remove a vest
   */
  app.delete('/api/vests/:vestId', async (req, res) => {
    try {
      const { vestId } = req.params;
      const deleted = await deleteVest(vestId);
      if (!deleted) {
        return res.status(404).json({ error: 'Gilet introuvable' });
      }
      res.status(204).end();
    } catch (err) {
      console.error('Delete vest error:', err);
      res.status(500).json({ error: err.message });
    }
  });
}

module.exports = { registerVestRoutes };
