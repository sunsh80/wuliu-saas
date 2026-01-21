// api/handlers/tenant-management/listAllTenants.js
const { getDb } = require('../../../../db/index.js');

module.exports = async (c) => {
    const page = parseInt(c.request.query.page) || 1;
    const limit = parseInt(c.request.query.limit) || 10;
    const offset = (page - 1) * limit;
    const statusFilter = c.request.query.status; // 'pending', 'approved', 'rejected', 'active', 'inactive'
    const searchQuery = c.request.query.search; // Search term for name or contact_person

    const database = getDb();

    let whereClause = '';
    const params = [];

    if (statusFilter) {
        whereClause += 'WHERE status = ? ';
        params.push(statusFilter);
    }

    if (searchQuery) {
        const searchParam = `%${searchQuery}%`;
        if (whereClause) {
            whereClause += 'AND ';
        } else {
            whereClause = 'WHERE ';
        }
        whereClause += '(name LIKE ? OR contact_person LIKE ?) ';
        params.push(searchParam, searchParam);
    }

    // Get total count for pagination
    const countResult = await database.get(
        `SELECT COUNT(*) as total FROM tenants ${whereClause}`,
        params
    );
    const totalItems = countResult.total;
    const totalPages = Math.ceil(totalItems / limit);

    // Get paginated results
    const tenants = await database.all(
        `SELECT id, name, contact_person, contact_phone, email, status, created_at, address, service_radius_km, capacity_kg, capacity_m3, base_price_per_km, avg_rating
         FROM tenants
         ${whereClause}
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, limit, offset]
    );

    return {
        status: 200,
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