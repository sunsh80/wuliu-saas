// backend/api/handlers/tenant/registerTenantWeb.js
const bcrypt = require('bcrypt');
// const jwt = require('jsonwebtoken'); // 如果需要返回 JWT Token
const { getDb } = require('../../../db/index.js'); // 使用项目提供的数据库获取方法

module.exports = async (c /*, req, res */) => {
  const { name, contact_person, contact_phone, email, password, roles, address } = c.request.body;
console.log("### DEBUG: Loading CORRECTED registerTenantWeb.js - Should use user_type ###");
  // --- 1. Input Validation (Basic) ---
  // 虽然 OpenAPI 会做一部分校验，但在 handler 内部做检查也是好习惯
  if (!name || !contact_person || !contact_phone || !email || !password || !roles) {
    return {
      statusCode: 400,
      body: {
        success: false,
        error: 'MISSING_REQUIRED_FIELDS',
        message: 'Name, contact person, phone, email, password, and roles are required.'
      }
    };
  }

  // Validate roles array content if provided
  if (!Array.isArray(roles) || roles.length === 0) {
    return {
      statusCode: 400,
      body: {
        success: false,
        error: 'INVALID_ROLES',
        message: 'Roles must be a non-empty array containing "customer" or "carrier".'
      }
    };
  }

  const validRoles = ['customer', 'carrier'];
  for (const role of roles) {
    if (!validRoles.includes(role)) {
      return {
        statusCode: 400,
        body: {
          success: false,
          error: 'INVALID_ROLES',
          message: `Role "${role}" is not allowed. Valid roles are: ${validRoles.join(', ')}.`
        }
      };
    }
  }

  // Phone & Email format validation (basic)
  const phoneRegex = /^1[3-9]\d{9}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!phoneRegex.test(contact_phone)) {
    return {
      statusCode: 400,
      body: {
        success: false,
        error: 'INVALID_PHONE_FORMAT',
        message: 'Contact phone number format is incorrect.'
      }
    };
  }

  if (!emailRegex.test(email)) {
    return {
      statusCode: 400,
      body: {
        success: false,
        error: 'INVALID_EMAIL_FORMAT',
        message: 'Email format is incorrect.'
      }
    };
  }

  // Password strength validation (basic)
  if (password.length < 6) {
    return {
      statusCode: 400,
      body: {
        success: false,
        error: 'WEAK_PASSWORD',
        message: 'Password must be at least 6 characters long.'
      }
    };
  }

  let db;
  try {
    db = getDb(); // Get the database instance

    // --- START TRANSACTION ---
    await db.run('BEGIN TRANSACTION');

    // --- 2. Check for existing email or phone ---
    // This check should happen *inside* the transaction for consistency if other concurrent writes are possible.
    // However, for basic prevention against double-clicks, it's often fine here too.
    const emailCheckQuery = 'SELECT id FROM tenants WHERE email = ?';
    const existingByEmail = await db.get(emailCheckQuery, [email.toLowerCase().trim()]);
    if (existingByEmail) {
      // Rollback the transaction if conflict is found
      await db.run('ROLLBACK');
      return {
        statusCode: 409,
        body: {
          success: false,
          error: 'EMAIL_ALREADY_REGISTERED',
          message: 'The email address is already registered.'
        }
      };
    }

    const phoneCheckQuery = 'SELECT id FROM tenants WHERE contact_phone = ?';
    const existingByPhone = await db.get(phoneCheckQuery, [contact_phone.trim()]);
    if (existingByPhone) {
      // Rollback the transaction if conflict is found
      await db.run('ROLLBACK');
      return {
        statusCode: 409,
        body: {
          success: false,
          error: 'PHONE_ALREADY_REGISTERED',
          message: 'The phone number is already registered.'
        }
      };
    }

    // --- 3. Hash Password ---
    const hashedPassword = await bcrypt.hash(password, 10);

    // --- 4. Insert into Database within Transaction ---
    // Insert Tenant
    const tenantInsertQuery = `
        INSERT INTO tenants (name, contact_person, contact_phone, email, password_hash, roles, status, address, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 'active', ?, datetime('now'), datetime('now'))`;
    const tenantResult = await db.run(tenantInsertQuery, [
        name.trim(),
        contact_person.trim(),
        contact_phone.trim(),
        email.toLowerCase().trim(), // Store email lowercase
        hashedPassword,
        JSON.stringify(roles), // Assuming roles are stored as JSON string
        address ? address.trim() : null // Optional address
    ]);
    const newTenantId = tenantResult.lastID;

  // Insert User (Link to Tenant)
  // CRITICAL: Ensure we are using 'user_type', NOT 'type'
  const userInsertQuery = `
   INSERT INTO users (email, username, name, role, type,user_type, password_hash, tenant_id, created_at, updated_at)
   VALUES (?, ?, ?,?, ?, ?, ?, ?, datetime('now'), datetime('now'))`;

  await db.run(userInsertQuery, [
    email.toLowerCase().trim(),    // ? 1 (email)
    contact_phone.trim(),          // ? 2 (username)
    contact_person.trim(),         // ? 3 (name)
    roles[0],    
    'user',                  // ? 4 (role - e.g., 'customer')
    'user',                   // ? 5 (user_type - set to 'customer' for 小程序 signups) <<< USE 'user_type' COLUMN NAME
    hashedPassword,               // ? 6 (password_hash)
    newTenantId                   // ? 7 (tenant_id)
  ]);

    // --- COMMIT TRANSACTION ---
    await db.run('COMMIT');

    console.log(`[registerTenantWeb] New tenant registered successfully: ID=${newTenantId}, Name=${name}, Email=${email}, Phone=${contact_phone}`);

    // --- 5. Prepare Response ---
    const responseBody = {
      success: true,
      message: 'Tenant registered successfully',
      data: {
        tenant_id: newTenantId.toString(),
        name: name.trim(),
        email: email.toLowerCase().trim(),
        contact_person: contact_person.trim(),
        contact_phone: contact_phone.trim(),
        roles: roles,
        status: 'active'
      }
    };

    return {
      statusCode: 201, // Created
      body: responseBody
    };

  } catch (error) {
    // If an error occurs *after* BEGIN TRANSACTION but *before* COMMIT,
    // we need to ROLLBACK to undo any partial changes made within the transaction.
    // The error handling will implicitly rollback if commit hasn't happened yet.
    // Explicitly attempt a rollback here just in case.
    if (db) {
      try {
        await db.run('ROLLBACK');
        console.log('[registerTenantWeb] Transaction rolled back due to error.');
      } catch (rollbackErr) {
        console.error('[registerTenantWeb] Error during rollback:', rollbackErr.message);
      }
    }

    console.error('[registerTenantWeb] Error during registration:', error.message);
    console.error('[registerTenantWeb] Error Stack:', error.stack);

    // Return a generic error to the client
    return {
      statusCode: 500,
      body: {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred during registration.'
      }
    };
  }
};