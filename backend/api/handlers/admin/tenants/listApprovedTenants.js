// api/handlers/admin/tenants/listApprovedTenants.js
const { getDb } = require('../../../../db/index.js');

module.exports = async (c) => {
    const page = parseInt(c.request.query.page) || 1;
    const limit = parseInt(c.request.query.limit) || 10;
    const offset = (page - 1) * limit;
    const searchQuery = c.request.query.search; // Search term for name or contact_person

    const database = getDb();

    // 查询条件：状态为 'approved' 的入驻申请 或 状态为 'active' 且包含 'carrier' 角色的租户
    let whereClause = 'WHERE (status = ? OR (status = ? AND roles LIKE ?)) ';
    const params = ['approved', 'active', '%carrier%']; // 查询已批准的申请或包含carrier角色的活跃租户

    if (searchQuery) {
        const searchParam = `%${searchQuery}%`;
        whereClause += 'AND (name LIKE ? OR contact_person LIKE ? OR contact_phone LIKE ?) ';
        params.push(searchParam, searchParam, searchParam);
    }

    // 构建查询语句，联合查询 customer_applications 和 tenants 表
    const query = `
        SELECT id, name, contact_person, contact_phone, email, roles, status, created_at, address, service_radius_km, capacity_kg, capacity_m3, base_price_per_km, avg_rating, 'application' as source
        FROM customer_applications
        WHERE status = 'approved'
        ${searchQuery ? `AND (name LIKE '%${searchQuery}%' OR phone LIKE '%${searchQuery}%')` : ''}
        UNION ALL
        SELECT id, name, contact_person, contact_phone, email, roles, status, created_at, address, service_radius_km, capacity_kg, capacity_m3, base_price_per_km, avg_rating, 'tenant' as source
        FROM tenants
        WHERE status = 'active' AND (roles LIKE '%carrier%' OR roles LIKE '%["carrier"]%' OR roles LIKE '%"carrier"%')
        ${searchQuery ? `AND (name LIKE '%${searchQuery}%' OR contact_person LIKE '%${searchQuery}%' OR contact_phone LIKE '%${searchQuery}%')` : ''}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
    `;

    // 由于UNION查询的复杂性，我们分别查询两个表
    const approvedApplications = await database.all(
        `SELECT id, name, phone as contact_phone, name as contact_person, '' as email, '[]' as roles, status, created_at, address, null as service_radius_km, null as capacity_kg, null as capacity_m3, null as base_price_per_km, null as avg_rating
         FROM customer_applications
         WHERE status = 'approved'
         ${searchQuery ? `AND (name LIKE ? OR phone LIKE ?)` : ''}
         ORDER BY created_at DESC`,
        searchQuery ? [`%${searchQuery}%`, `%${searchQuery}%`] : []
    );

    const approvedCarrierTenants = await database.all(
        `SELECT id, name, contact_person, contact_phone, email, roles, status, created_at, address, service_radius_km, capacity_kg, capacity_m3, base_price_per_km, avg_rating
         FROM tenants
         WHERE status = 'active' AND (roles LIKE ? OR roles LIKE ? OR roles LIKE ?)
         ${searchQuery ? `AND (name LIKE ? OR contact_person LIKE ? OR contact_phone LIKE ?)` : ''}
         ORDER BY created_at DESC`,
        [
            '%carrier%', 
            '%["carrier"]%', 
            '%"carrier"%',
            ...(searchQuery ? [`%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`] : [])
        ]
    );

    // 合并结果
    const allTenants = [...approvedApplications, ...approvedCarrierTenants];
    
    // 计算总数用于分页
    const totalItems = allTenants.length;
    const totalPages = Math.ceil(totalItems / limit);

    // 应用分页
    const startIndex = offset;
    const endIndex = Math.min(startIndex + limit, totalItems);
    const paginatedTenants = allTenants.slice(startIndex, endIndex);

    return {
        statusCode: 200, // 使用正确的HTTP状态码
        body: {
            success: true,
            data: {
                tenants: paginatedTenants,
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