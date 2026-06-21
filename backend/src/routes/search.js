'use strict';

// POST /search
// just pushes the query to the batch buffer so we don't block the UI
// while writing to the db. returns a dummy success response.

function createSearchRoute(batchWriter) {
  return (req, res) => {
    const { query } = req.body || {};

    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ error: 'query field is required and must be a non-empty string' });
    }

    batchWriter.submit(query.trim());

    return res.json({
      message: 'Searched',
      query  : query.trim(),
    });
  };
}

module.exports = { createSearchRoute };
