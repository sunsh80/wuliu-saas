// api/handlers/auth/adminLogout.js

module.exports = async (c) => {
  return {
    status: 200,
    body: { success: true, message: 'Logged out successfully' }
  };
};