'use strict';

// GET /trending?limit=10
// returns the top trending queries based on the recency decay score.

function createTrendingRoute(trending) {
  return (req, res) => {
    const limit   = Math.min(parseInt(req.query.limit, 10) || 10, 20);
    const results = trending.getTopTrending(limit);
    return res.json({ trending: results });
  };
}

module.exports = { createTrendingRoute };
