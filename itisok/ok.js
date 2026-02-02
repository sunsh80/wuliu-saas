    // === 模式 2: 客户登录（手机号 + 密码）===本段代码ok
    if (phone && password) {
      console.log('🔍 Login attempt for phone:', phone);
      try {
        console.log('🔍 Attempting customer password login for:', phone);
        const user = await db.get(
          `SELECT id, phone, password_hash, tenant_id FROM users WHERE phone = ? AND user_type = 'tenant_user'`,
          [phone]
        );
        console.log('🔍 Retrieved user from DB (SQLite):', user);

        if (!user) {
          console.log('❌ User not found in DB for phone:', phone);
          return { statusCode: 401, body: { success: false, error: 'INVALID_CREDENTIALS' } };
        }

        console.log('🔍 Stored password hash from DB:', user.password_hash);
        console.log('🔍 Input password for comparison:', password);
        const isValid = await bcrypt.compare(password, user.password_hash);
        console.log('🔍 Bcrypt compare result:', isValid);

        if (isValid) {
          console.log('✅ Login successful for phone:', phone);
          // 设置会话信息 - 这是关键修复
          if (!c.request.session) {
            console.error('❌ 会话对象不存在');
            return { statusCode: 500, body: { success: false, error: 'SESSION_ERROR' } };
          }

          // 确保 user.tenant_id 存在，否则可能需要从租户表查询或设置默认值
          // 假设 users 表中确实有 tenant_id 字段，否则需要查询
          // const userWithTenantInfo = await db.get("SELECT u.id, u.phone, u.tenant_id, t.name AS tenant_name FROM users u JOIN tenants t ON u.tenant_id = t.id WHERE u.id = ?", [user.id]);
          // c.request.session.tenantId = userWithTenantInfo?.tenant_id || user.tenant_id; // Fallback

          c.request.session.userId = user.id;
          console.log('🔐 会话已设置:', { userId: user.id });
          c.request.session.tenantId = user.tenant_id; // Ensure this field exists in DB query result
          c.request.session.userType = 'tenant_user';
          const userId = user.id; // Now 'user' should definitely be accessible here
          const data = { phone: user.phone, type: 'customer' };
          console.log('📤 Login response:', { userId, data });
          return { statusCode: 200, body: { success: true, userId: user.id, data: data } };
        } else {
          console.log('❌ Password verification failed for phone:', phone);
          return { statusCode: 401, body: { success: false, error: 'INVALID_CREDENTIALS' } };
        }
      } catch (error) {
        console.error('Error during customer login:', error.message);
        console.error('Full error stack:', error.stack);
        return { statusCode: 500, body: { success: false, error: 'INTERNAL_ERROR' } };
      }
    }
