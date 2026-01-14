// api/handlers/auth/getAdminProfile.js
const { getDb } = require('../../../../db/index.js');
const { jwt } = require('../../../../utils');

module.exports = async (c) => {
  const token = c.request.headers.authorization?.split(' ')[1];
  if (!token) {
    return {
      status: 401,
      body: { success: false, error: 'No token provided' }
    };
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key_for_testing');
  } catch (err) {
    return {
      status: 401,
      body: { success: false, error: 'Invalid or expired token' }
    };
  }

  const db = getDb();
  const user = await db.get(
    `SELECT id, username, email, phone, name, role, type, organization_id, organization_name, organization_type 
     FROM users 
     WHERE id = ?`,
    [decoded.id]
  );

  if (!user) {
    return {
      status: 404,
      body: { success: false, error: 'User not found' }
    };
  }

  return {
    status: 200,
    body: {
      success: true,
      data: { user }
    }
  };
};