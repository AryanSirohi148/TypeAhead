'use strict';

// GET /cache/debug?prefix=<prefix>
// helps show off the consistent hashing logic by returning which node
// is handling a specific prefix and if it's a hit or miss.

function createCacheDebugRoute(cache) {
  return (req, res) => {
    const prefix     = (req.query.prefix || '').trim().toLowerCase();
    const { nodeName, node } = cache.getNodeInfo(prefix);
    const inspection = node.inspect(prefix);

    return res.json({
      prefix : prefix || '(empty)',
      routing: {
        assignedNode         : nodeName,
        physicalNodes        : ['node-0', 'node-1', 'node-2'],
        virtualNodesPerNode  : 50,
        totalRingPoints      : 150,
        explanation          : `MD5("${prefix}") maps clockwise to ${nodeName}`,
      },
      cacheStatus: inspection
        ? {
            hit        : true,
            ttlRemaining: `${inspection.ttlRemaining}s`,
            cachedAt   : inspection.cachedAt,
            resultCount: inspection.resultCount,
          }
        : {
            hit   : false,
            reason: 'Not in cache or expired (TTL = 60s)',
          },
      nodeStats: node.getStats(),
    });
  };
}

module.exports = { createCacheDebugRoute };
