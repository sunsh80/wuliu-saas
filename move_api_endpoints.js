// 修复openapi.yaml文件，将错误插入的API端点移到正确位置
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'backend/openapi.yaml');
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔍 修复openapi.yaml文件，移动错误插入的API端点到正确位置...');

// 找到paths部分的开始位置
const pathsIndex = content.indexOf('\npaths:\n');
if (pathsIndex !== -1) {
  // 提取paths部分之前的内容
  const beforePaths = content.substring(0, pathsIndex + 8); // +8 to include '\npaths:\n'
  const afterPathsStart = content.substring(pathsIndex + 8);

  // 找到components部分的开始位置，以确定paths部分的结束
  const componentsIndex = afterPathsStart.indexOf('\ncomponents:\n');
  let pathsContent = '';
  let afterComponentsContent = '';

  if (componentsIndex !== -1) {
    pathsContent = afterPathsStart.substring(0, componentsIndex);
    afterComponentsContent = afterPathsStart.substring(componentsIndex);
  } else {
    // 如果没有找到components部分，假设剩余内容都是paths部分
    pathsContent = afterPathsStart;
  }

  // 检查paths部分是否已经包含了我之前添加的API端点
  const hasHealthEndpoint = pathsContent.includes('/api/health:');
  const hasSetupEndpoints = pathsContent.includes('/api/setup/status:') || pathsContent.includes('/api/setup/admin:');
  const hasPublicEndpoints = pathsContent.includes('/api/public/orders');
  const hasTenantEndpoints = pathsContent.includes('/api/tenant-web/register:') || pathsContent.includes('/api/tenant-web/login:');
  const hasCustomerEndpoints = pathsContent.includes('/api/customer/orders:');
  const hasCarrierEndpoints = pathsContent.includes('/api/carrier/orders:');
  const hasTenantWebEndpoints = pathsContent.includes('/api/tenant-web/orders/pending');

  console.log(`✅ Paths部分包含以下端点:`);
  console.log(`  - Health endpoint: ${hasHealthEndpoint}`);
  console.log(`  - Setup endpoints: ${hasSetupEndpoints}`);
  console.log(`  - Public endpoints: ${hasPublicEndpoints}`);
  console.log(`  - Tenant endpoints: ${hasTenantEndpoints}`);
  console.log(`  - Customer endpoints: ${hasCustomerEndpoints}`);
  console.log(`  - Carrier endpoints: ${hasCarrierEndpoints}`);
  console.log(`  - Tenant-web endpoints: ${hasTenantWebEndpoints}`);

  // 如果paths部分没有包含这些端点，我们需要从错误位置移除它们并在正确位置添加
  if (!hasHealthEndpoint || !hasSetupEndpoints || !hasPublicEndpoints || !hasTenantEndpoints || !hasCustomerEndpoints || !hasCarrierEndpoints || !hasTenantWebEndpoints) {
    // 从错误位置移除API端点定义（在tags部分附近，大约在第44行附近）
    let correctedContent = content;
    
    // 移除错误插入的API端点定义
    const lines = correctedContent.split(/\r?\n/);
    const filteredLines = [];
    
    let inWrongApiSection = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // 检查是否是错误插入的API端点（在tags部分而非paths部分）
      if (line.trim().startsWith('/api/') && 
          line.startsWith('  ') && 
          !line.startsWith('    ') && 
          i < 1797) { // 在paths部分之前
        console.log(`⚠️ 移除错误位置的API端点定义: ${line.trim()}`);
        inWrongApiSection = true;
        continue; // 跳过这一行
      }
      
      // 如果在错误API区域内，继续跳过直到遇到新的顶级元素
      if (inWrongApiSection) {
        if (line.trim() !== '' && !line.startsWith('  ')) {
          // 遇到新的顶级元素，结束跳过
          inWrongApiSection = false;
        } else {
          continue; // 继续跳过
        }
      }
      
      filteredLines.push(line);
    }
    
    correctedContent = filteredLines.join('\n');
    
    // 重新构建文件内容
    const newContent = correctedContent;
    
    // 写回文件
    fs.writeFileSync(filePath, newContent, 'utf8');
    
    console.log('✅ 已从错误位置移除API端点定义');
  } else {
    console.log('✅ 所有API端点已在正确位置');
  }
} else {
  console.error('❌ 未找到paths部分');
}

console.log('✅ openapi.yaml 文件结构已修复');