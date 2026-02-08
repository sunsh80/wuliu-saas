// api/handlers/admin/tenants/listPendingTenants.js
const { getDb } = require('../../../../db/index.js');

module.exports = async (c) => {
    const page = parseInt(c.request.query.page) || 1;
    const limit = parseInt(c.request.query.limit) || 10;
    const offset = (page - 1) * limit;
    const searchQuery = c.request.query.search; // Search term for name or phone

    const database = getDb();

    let whereClause = 'WHERE status = ? ';
    const params = ['pending']; // 只查询待审核申请

    if (searchQuery) {
        const searchParam = `%${searchQuery}%`;
        whereClause += 'AND (name LIKE ? OR phone LIKE ?) '; // customer_applications表中是phone字段，不是contact_person
        params.push(searchParam, searchParam);
    }

    // Get total count for pagination
    const countResult = await database.get(
        `SELECT COUNT(*) as total FROM customer_applications ${whereClause}`,
        params
    );
    const totalItems = countResult.total || 0;
    const totalPages = Math.ceil(totalItems / limit);

    // Get paginated results
    const applications = await database.all(
        `SELECT id, name, phone, address, status, created_at, updated_at
         FROM customer_applications
         ${whereClause}
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, limit, offset]
    );

        // 将customer_applications表的字段映射到前端期望的格式
    const tenants = applications.map(app => ({
        id: app.id,
        name: app.name,
        contact_person: app.name, // 使用name作为联系人
        contact_phone: app.phone,
        email: '', // customer_applications表中没有email字段，暂时为空
        roles: '[]', // customer_applications表中没有roles字段
        status: app.status,
        created_at: app.created_at,
        address: app.address,
        service_radius_km: null,
        capacity_kg: null,
        capacity_m3: null,
        base_price_per_km: null,
        avg_rating: null
    }));

    return {
        statusCode: 200, // 使用正确的HTTP状态码
        body: {
            success: true,
            data: {
                tenants,
                pagination: {
                    current_page: page,
                    total_pages: totalPages,
                    total_items: totalItems,
                    per_page: limit
                }
            }
        }
    };
};