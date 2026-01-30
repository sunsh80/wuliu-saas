// backend/api/handlers/tenant/registerTenantWeb.js
const bcrypt = require('bcrypt');
// const jwt = require('jsonwebtoken'); // 如果需要返回 JWT Token
const { getDb } = require('../../../db/index.js'); // 使用项目提供的数据库获取方法
const { validatePhone, validateEmail, validatePassword } = require('../../../../validation-rules.js'); // 引入共享验证规则

// --- 添加这行调试日志 ---
console.log("### DEBUG: Loading CORRECTED registerTenantWeb.js - Handling customer vs carrier registration ###");

module.exports = async (c /*, req, res */) => {
    // --- 添加请求开始的调试日志 ---
    console.log("### DEBUG: registerTenantWeb.js - Request Body Received:", JSON.stringify(c.request.body, null, 2));

    // --- 获取请求体 ---
    const { name, contact_person, contact_phone, email, password, roles, address } = c.request.body;

    console.log("### DEBUG: registerTenantWeb.js - Extracted Variables - name:", name, "contact_person:", contact_person, "contact_phone:", contact_phone, "email:", email, "password:", !!password, "roles:", roles, "address:", address);

    // --- 区分注册类型 ---
    // 如果 roles 仅包含 'customer'，则视为客户快速注册
    const isCustomerOnly = Array.isArray(roles) && roles.length === 1 && roles[0] === 'customer';

    console.log("### DEBUG: registerTenantWeb.js - isCustomerOnly:", isCustomerOnly);

    // --- 1. Input Validation (Basic) ---
    // 客户快速注册只需要 phone 和 password
    if (isCustomerOnly) {
        console.log("### DEBUG: registerTenantWeb.js - Processing Customer Registration ###");
        if (!contact_phone || !password) {
            console.log("### DEBUG: registerTenantWeb.js - Customer Registration FAILED: Missing phone or password ###");
            return {
                statusCode: 400,
                body: {
                    success: false,
                    error: 'MISSING_REQUIRED_FIELDS',
                    message: 'For customer registration, contact phone and password are required.'
                }
            };
        }
        // 为新客户设置默认值
        const defaultName = `Customer_${contact_phone}`;
        const defaultContactPerson = `User_${contact_phone}`;
        const defaultEmail = `customer_${contact_phone}@example.com`;
        const defaultAddress = null;

        // 重新赋值为默认值，避免后续使用未定义变量
        var finalName = defaultName;
        var finalContactPerson = defaultContactPerson;
        var finalEmail = defaultEmail;
        var finalAddress = defaultAddress;
        var finalRoles = roles;

        console.log("### DEBUG: registerTenantWeb.js - Customer Registration - Default Values Set ###");

    } else {
        console.log("### DEBUG: registerTenantWeb.js - Processing FULL Tenant Registration ###");
        // 承运商或完整租户注册，需要所有字段
        if (!name || !contact_person || !contact_phone || !email || !password || !roles) {
            console.log("### DEBUG: registerTenantWeb.js - FULL Registration FAILED: Missing required fields ###");
            console.log("### DEBUG: Details - name:", !!name, "contact_person:", !!contact_person, "contact_phone:", !!contact_phone, "email:", !!email, "password:", !!password, "roles:", !!roles);
            return {
                statusCode: 400,
                body: {
                    success: false,
                    error: 'MISSING_REQUIRED_FIELDS',
                    message: 'Name, contact person, phone, email, password, and roles are required for full tenant registration.'
                }
            };
        }

        // 验证 roles 数组内容
        if (!Array.isArray(roles) || roles.length === 0) {
            console.log("### DEBUG: registerTenantWeb.js - FULL Registration FAILED: Invalid roles array ###");
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
                console.log(`### DEBUG: registerTenantWeb.js - FULL Registration FAILED: Invalid role " $ {role}" ###`);
                return {
                    statusCode: 400,
                    body: {
                        success: false,
                        error: 'INVALID_ROLES',
                        message: `Role " $ {role}" is not allowed. Valid roles are:  $ {validRoles.join(', ')}.`
                    }
                };
            }
        }

        // 将接收到的值赋给最终变量
        var finalName = name;
        var finalContactPerson = contact_person;
        var finalEmail = email;
        var finalAddress = address;
        var finalRoles = roles;

        console.log("### DEBUG: registerTenantWeb.js - FULL Registration - All Required Fields Present ###");
    }

    // 使用共享验证库进行格式验证
    if (!validatePhone(contact_phone)) {
        console.log("### DEBUG: registerTenantWeb.js - Validation FAILED: Invalid phone format ###");
        return {
            statusCode: 400,
            body: {
                success: false,
                error: 'INVALID_PHONE_FORMAT',
                message: 'Contact phone number format is incorrect.'
            }
        };
    }

    // 使用共享验证库验证密码强度
    if (!validatePassword(password)) {
        console.log("### DEBUG: registerTenantWeb.js - Validation FAILED: Weak password ###");
        return {
            statusCode: 400,
            body: {
                success: false,
                error: 'WEAK_PASSWORD',
                message: 'Password must be at least 6 characters long.'
            }
        };
    }

    // 对于客户注册，使用默认邮箱，应验证其格式；对于完整租户注册，验证提供的邮箱格式
    if (!isCustomerOnly && !validateEmail(finalEmail)) { // 验证最终的邮箱（可能是默认的）
        console.log("### DEBUG: registerTenantWeb.js - Validation FAILED: Invalid email format for finalEmail:", finalEmail);
        return {
            statusCode: 400,
            body: {
                success: false,
                error: 'INVALID_EMAIL_FORMAT',
                message: 'Email format is incorrect.'
            }
        };
    }

    // 对于客户注册，验证默认邮箱的格式
    if (isCustomerOnly && !validateEmail(finalEmail)) {
        console.log("### DEBUG: registerTenantWeb.js - Validation FAILED: Invalid default email format for customer registration:", finalEmail);
        return {
            statusCode: 400,
            body: {
                success: false,
                error: 'INVALID_EMAIL_FORMAT',
                message: 'Generated email format is incorrect.'
            }
        };
    }

    // Password strength validation (basic)
    if (password.length < 6) {
        console.log("### DEBUG: registerTenantWeb.js - Validation FAILED: Weak password ###");
        return {
            statusCode: 400,
            body: {
                success: false,
                error: 'WEAK_PASSWORD',
                message: 'Password must be at least 6 characters long.'
            }
        };
    }

    console.log("### DEBUG: registerTenantWeb.js - All validations passed, proceeding to DB operations ###");

    let db;
    try {
        db = getDb(); // Get the database instance

        // --- START TRANSACTION ---
        await db.run('BEGIN TRANSACTION');

        // --- 2. Check for existing email or phone ---
        const emailCheckQuery = 'SELECT id FROM tenants WHERE email = ?';
        const existingByEmail = await db.get(emailCheckQuery, [finalEmail.toLowerCase().trim()]);
        if (existingByEmail) {
            // Rollback the transaction if conflict is found
            await db.run('ROLLBACK');
            console.log("### DEBUG: registerTenantWeb.js - DB Check FAILED: Email already registered ###");
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
            console.log("### DEBUG: registerTenantWeb.js - DB Check FAILED: Phone already registered ###");
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
            finalName.trim(),
            finalContactPerson.trim(),
            contact_phone.trim(),
            finalEmail.toLowerCase().trim(), // Store email lowercase
            hashedPassword,
            JSON.stringify(finalRoles), // Assuming roles are stored as JSON string
            finalAddress ? finalAddress.trim() : null // Optional address
        ]);

        const newTenantId = tenantResult.lastID;

        // Insert User (Link to Tenant)
        // CRITICAL: Ensure we are using 'user_type', NOT 'type'
        const userInsertQuery = `
            INSERT INTO users (email, username, name, role, roles, type, user_type, password_hash, tenant_id, phone, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`;
        await db.run(userInsertQuery, [
            finalEmail.toLowerCase().trim(),     // ? 1 (email)
            contact_phone.trim(),               // ? 2 (username) - Using phone as username
            finalContactPerson.trim(),          // ? 3 (name) - Using contact_person as user's name
            finalRoles[0],                      // ? 4 (role - first role as primary)
            JSON.stringify(finalRoles),         // ? 5 (roles - all roles as JSON string)
            'user',                             // ? 6 (type)
            'tenant_user',                      // ? 7 (user_type - set to 'tenant_user' for tenant signups)
            hashedPassword,                     // ? 8 (password_hash)
            newTenantId,                        // ? 9 (tenant_id)
            contact_phone.trim()                // ? 10 (phone)
        ]);

        // --- COMMIT TRANSACTION ---
        await db.run('COMMIT');

        console.log(`[registerTenantWeb] New tenant registered successfully: ID= $ {newTenantId}, Name= $ {finalName}, Email= $ {finalEmail}, Phone= $ {contact_phone}, Type= $ {isCustomerOnly ? 'CUSTOMER_ONLY' : 'FULL_TENANT'}`);

        // --- 5. Prepare Response ---
        const responseBody = {
            success: true,
            message: 'Tenant registered successfully',
            data: {
                tenant_id: newTenantId.toString(),
                name: finalName.trim(),
                email: finalEmail.toLowerCase().trim(),
                contact_person: finalContactPerson.trim(),
                contact_phone: contact_phone.trim(),
                roles: finalRoles,
                status: 'active'
            }
        };
// --- Add session setting here ---
// Note: This assumes 'c' is your context object which has access to req.session
// If using Express-like req/res, it would be req.session.userId = ...
// Since you're using a custom context 'c', you might need to access session differently
// e.g., c.request.session.userId = newUserId;
// However, based on the context pattern used elsewhere, it's likely you need to pass
// session info through a different mechanism or ensure the calling framework handles it.
// For now, assuming direct access via c.request.session if available.

// Get the newly created user's ID from the insertion step.
// In your code, the user was inserted with:
// await db.run(userInsertQuery, [ ... ]);
// The last line in the transaction block is:
// const newTenantId = tenantResult.lastID;
// But you also need the user's ID. The user insert doesn't capture its lastID.
// You might need to get the user ID by querying back or modifying how the insertion works.
// Option 1: Query the user ID back using the unique phone/email
const newUserRecord = await db.get('SELECT id, tenant_id FROM users WHERE phone = ?', [contact_phone.trim()]);
if (!newUserRecord) {
    // This should ideally not happen if transaction succeeded
    console.error('[registerTenantWeb] Critical: Could not find newly created user record.');
    // Return error or handle gracefully, although transaction committed
    // Let's assume user was created and proceed, but log the issue
    // Or better, modify the insertion to capture user ID directly if possible
    // For now, re-querying seems most reliable here.
    // However, capturing the user ID from the INSERT statement itself is preferred.
    // SQLite doesn't have a direct way to get the last inserted ID of a specific table within a multi-statement transaction
    // unless you do it separately right after each INSERT.
    // So, re-querying is the safest option here after COMMIT.
    console.log("### DEBUG: registerTenantWeb.js - Attempting to fetch new user ID after COMMIT ###");
    const newUserAfterCommit = await db.get('SELECT id, tenant_id FROM users WHERE phone = ?', [contact_phone.trim()]);
    if (!newUserAfterCommit) {
        throw new Error("Failed to fetch newly created user after registration commit.");
    }
    console.log("### DEBUG: registerTenantWeb.js - Fetched new user ID:", newUserAfterCommit.id, "for tenant:", newUserAfterCommit.tenant_id);

    // IMPORTANT: You need to pass this session info back somehow.
    // This depends heavily on how your API framework handles sessions.
    // If c.setSession is available:
    // c.setSession({ userId: newUserAfterCommit.id, tenantId: newUserAfterCommit.tenant_id });
    // If c.request.session is available (like in Express):
    // c.request.session.userId = newUserAfterCommit.id;
    // c.request.session.tenantId = newUserAfterCommit.tenant_id;
    // The original code uses c.req.session (as per TenantSessionAuth.js)
    // So, let's use that.
    if (c.req && c.req.session) {
        c.req.session.userId = newUserAfterCommit.id;
        c.req.session.tenantId = newUserAfterCommit.tenant_id;
        console.log(`[registerTenantWeb] Login session set for user ${newUserAfterCommit.id}, tenant ${newUserAfterCommit.tenant_id} after registration.`);
    } else {
        console.warn("[registerTenantWeb] Warning: Could not set session, c.req.session not available in context.");
        // Depending on your framework, you might need to handle session differently
        // or return session info in the response body for the frontend to manage
    }

} else {
    // This branch shouldn't be reached easily, but just in case
    console.error('[registerTenantWeb] Unexpected state: newUserRecord found before COMMIT.');
    // Should ideally not happen given the flow, but handle gracefully if needed.
}

// Option 2 (Preferred if possible): Modify the transaction to capture user ID immediately after INSERT
// This requires changing the structure slightly to run user insert query and capture its ID right away.
// Example (not fully implemented here, but conceptually):
/*
const userResult = await db.run(userInsertQuery, [ ... ]);
const newUserId = userResult.lastID;
// Then after COMMIT:
if (c.req && c.req.session) {
    c.req.session.userId = newUserId;
    c.req.session.tenantId = newTenantId; // newTenantId is already available
}
*/
// However, since the current code doesn't capture userResult.lastID, Option 1 is safer for now.

// --- End Add session setting ---
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