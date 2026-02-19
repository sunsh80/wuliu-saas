// backend/api/handlers/map/stopPoints.js
const { getDb } = require('../../../db/index');

module.exports = async (c) => {
  console.log('🔍 [Map API] Stop Points handler called');
  
  try {
    const { region, type, limit = 50 } = c.request.query;

    let query = 'SELECT * FROM stop_points WHERE 1=1';
    const params = [];

    if (region) {
      query += ' AND region = ?';
      params.push(region);
    }
    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    query += ' AND status = \'active\' ORDER BY id LIMIT ?';
    params.push(parseInt(limit));

    const db = getDb();
    const stopPoints = await db.all(query, params);
    
    return { 
      status: 200, 
      body: { 
        success: true, 
        data: stopPoints 
      } 
    };
  } catch (error) {
    console.error('❌ [Map API] Stop Points error:', error);
    return { 
      status: 500, 
      body: { 
        success: false, 
        error: 'STOP_POINTS_FETCH_FAILED',
        message: error.message 
      } 
    };
  }
};