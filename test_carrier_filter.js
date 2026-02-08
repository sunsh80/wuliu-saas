// 测试承运商过滤逻辑
function testCarrierFilter() {
    console.log('🧪 测试承运商过滤逻辑...\n');
    
    // 模拟一些租户数据
    const mockTenants = [
        {
            id: 1,
            name: 'ABC物流公司',
            contact_person: '张三',
            contact_phone: '13800138001',
            roles: '["carrier"]',  // JSON字符串格式
            status: 'active',
            created_at: '2024-01-01T10:00:00Z'
        },
        {
            id: 2,
            name: 'XYZ货运公司',
            contact_person: '李四',
            contact_phone: '13800138002',
            roles: '["carrier", "customer"]',  // JSON字符串格式
            status: 'active',
            created_at: '2024-01-02T10:00:00Z'
        },
        {
            id: 3,
            name: '某客户公司',
            contact_person: '王五',
            contact_phone: '13800138003',
            roles: '["customer"]',  // JSON字符串格式
            status: 'active',
            created_at: '2024-01-03T10:00:00Z'
        },
        {
            id: 4,
            name: 'DEF运输公司',
            contact_person: '赵六',
            contact_phone: '13800138004',
            roles: ['carrier'],  // 数组格式
            status: 'pending',
            created_at: '2024-01-04T10:00:00Z'
        }
    ];
    
    console.log('原始租户数据:');
    mockTenants.forEach(tenant => {
        console.log(`- ID: ${tenant.id}, Name: ${tenant.name}, Roles: ${tenant.roles}`);
    });
    
    console.log('\n执行过滤逻辑...');
    
    // 应用过滤逻辑
    const filteredCarriers = mockTenants.filter(tenant => {
        // 检查tenant.roles是否包含'carrier'
        if (typeof tenant.roles === 'string') {
            // 如果是字符串形式的JSON，解析后再检查
            try {
                const rolesArray = JSON.parse(tenant.roles);
                return Array.isArray(rolesArray) && rolesArray.includes('carrier');
            } catch (e) {
                console.warn('解析tenant.roles失败:', e);
                return false;
            }
        } else if (Array.isArray(tenant.roles)) {
            return tenant.roles.includes('carrier');
        }
        return false;
    });
    
    console.log('\n过滤后的承运商数据:');
    filteredCarriers.forEach(carrier => {
        console.log(`- ID: ${carrier.id}, Name: ${carrier.name}, Roles: ${JSON.stringify(carrier.roles)}`);
    });
    
    console.log(`\n总计: ${mockTenants.length} 个租户，过滤出 ${filteredCarriers.length} 个承运商`);
    
    // 验证结果
    const expectedCarrierIds = [1, 2, 4];  // 应该包含ID为1, 2, 4的租户
    const actualCarrierIds = filteredCarriers.map(c => c.id);
    
    console.log('\n验证结果:');
    console.log('期望的承运商标识:', expectedCarrierIds);
    console.log('实际的承运商标识:', actualCarrierIds);
    
    if (JSON.stringify(expectedCarrierIds.sort()) === JSON.stringify(actualCarrierIds.sort())) {
        console.log('✅ 过滤逻辑正确！');
    } else {
        console.log('❌ 过滤逻辑有问题！');
    }
}

// 运行测试
testCarrierFilter();