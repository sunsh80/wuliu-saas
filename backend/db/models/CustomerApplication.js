// backend/db/models/CustomerApplication.js
const { getDb } = require('../connection'); // Use getDb function

class CustomerApplicationModel {
  getDb() {
    return getDb(); // Get the current DB instance
  }

  async create(data) {
    const db = this.getDb(); // Get current connection
    const { customer_id, tenant_id, status, application_data } = data;

    const sql = `
      INSERT INTO customer_applications (customer_id, tenant_id, status, application_data, created_at, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
    `;

    return new Promise((resolve, reject) => {
      db.run(
        sql,
        [customer_id, tenant_id, status, JSON.stringify(application_data)],
        function (err) {
          if (err) {
            console.error('Error creating customer application:', err);
            return reject(err);
          }
          // Resolve with the new ID and data
          resolve({
            id: this.lastID,
            customer_id,
            tenant_id,
            status,
            application_data,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
      );
    });
  }

  async findById(id) {
    const db = this.getDb(); // Get current connection
    const sql = `SELECT * FROM customer_applications WHERE id = ?`;

    return new Promise((resolve, reject) => {
      db.get(sql, [id], (err, row) => {
        if (err) {
          console.error('Error finding customer application by ID:', err);
          return reject(err);
        }
        if (row && row.application_data) {
          try {
            row.application_data = JSON.parse(row.application_data);
          } catch (parseErr) {
             console.warn('Warning: Could not parse application_data for ID', id, parseErr.message);
             // Optionally, you could leave it as a string or set to null
             // row.application_data = null;
          }
        }
        resolve(row);
      });
    });
  }

  async findByCustomerId(customerId) {
    const db = this.getDb(); // Get current connection
    const sql = `SELECT * FROM customer_applications WHERE customer_id = ? ORDER BY created_at DESC LIMIT 1`;

    return new Promise((resolve, reject) => {
      db.get(sql, [customerId], (err, row) => {
        if (err) {
          console.error('Error finding customer application by customer ID:', err);
          return reject(err);
        }
        if (row && row.application_data) {
          try {
            row.application_data = JSON.parse(row.application_data);
          } catch (parseErr) {
             console.warn('Warning: Could not parse application_data for customer ID', customerId, parseErr.message);
             // row.application_data = null;
          }
        }
        resolve(row);
      });
    });
  }

  async findByTenantId(tenantId) {
    const db = this.getDb(); // Get current connection
    const sql = `SELECT * FROM customer_applications WHERE tenant_id = ? ORDER BY created_at DESC`;

    return new Promise((resolve, reject) => {
      db.all(sql, [tenantId], (err, rows) => {
        if (err) {
          console.error('Error finding customer applications by tenant ID:', err);
          return reject(err);
        }
        resolve(
          rows.map((row) => {
            if (row.application_data) {
              try {
                row.application_data = JSON.parse(row.application_data);
              } catch (parseErr) {
                 console.warn('Warning: Could not parse application_data for tenant ID', tenantId, parseErr.message);
                 // row.application_data = null;
              }
            }
            return row;
          })
        );
      });
    });
  }

  async updateStatus(id, status) {
    const db = this.getDb(); // Get current connection
    const sql = `UPDATE customer_applications SET status = ?, updated_at = datetime('now') WHERE id = ?`;

    return new Promise((resolve, reject) => {
      db.run(sql, [status, id], function (err) {
        if (err) {
          console.error('Error updating customer application status:', err);
          return reject(err);
        }
        if (this.changes === 0) {
          return resolve(null); // No rows were updated
        }
        // Optionally, re-fetch the updated record
        resolve({ id, status, updated_at: new Date().toISOString() });
      });
    });
  }

  async updateApplicationData(id, applicationData) {
    const db = this.getDb(); // Get current connection
    const sql = `UPDATE customer_applications SET application_data = ?, updated_at = datetime('now') WHERE id = ?`;

    return new Promise((resolve, reject) => {
      db.run(sql, [JSON.stringify(applicationData), id], function (err) {
        if (err) {
          console.error('Error updating customer application data:', err);
          return reject(err);
        }
        if (this.changes === 0) {
          return resolve(null); // No rows were updated
        }
        // Optionally, re-fetch the updated record
        resolve({ id, application_data: applicationData, updated_at: new Date().toISOString() });
      });
    });
  }

  async deleteById(id) {
    const db = this.getDb(); // Get current connection
    const sql = `DELETE FROM customer_applications WHERE id = ?`;

    return new Promise((resolve, reject) => {
      db.run(sql, [id], function (err) {
        if (err) {
          console.error('Error deleting customer application:', err);
          return reject(err);
        }
        resolve(this.changes > 0); // Return true if a row was deleted
      });
    });
  }

  async findAll(limit = 100, offset = 0) {
    const db = this.getDb(); // Get current connection
    const sql = `SELECT * FROM customer_applications ORDER BY created_at DESC LIMIT ? OFFSET ?`;

    return new Promise((resolve, reject) => {
      db.all(sql, [limit, offset], (err, rows) => {
        if (err) {
          console.error('Error fetching all customer applications:', err);
          return reject(err);
        }
        resolve(
          rows.map((row) => {
            if (row.application_data) {
              try {
                row.application_data = JSON.parse(row.application_data);
              } catch (parseErr) {
                 console.warn('Warning: Could not parse application_data', parseErr.message);
                 // row.application_data = null;
              }
            }
            return row;
          })
        );
      });
    });
  }

  async findByStatus(status, limit = 100, offset = 0) {
    const db = this.getDb(); // Get current connection
    const sql = `SELECT * FROM customer_applications WHERE status = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`;

    return new Promise((resolve, reject) => {
      db.all(sql, [status, limit, offset], (err, rows) => {
        if (err) {
          console.error('Error fetching customer applications by status:', err);
          return reject(err);
        }
        resolve(
          rows.map((row) => {
            if (row.application_data) {
              try {
                row.application_data = JSON.parse(row.application_data);
              } catch (parseErr) {
                 console.warn('Warning: Could not parse application_data', parseErr.message);
                 // row.application_data = null;
              }
            }
            return row;
          })
        );
      });
    });
  }
}

module.exports = CustomerApplicationModel; // Export the class