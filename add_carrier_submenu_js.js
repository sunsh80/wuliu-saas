/**
 * 批量为承运商端页面添加二级导航 JavaScript 交互
 */

const fs = require('fs');
const path = require('path');

const tenantWebDir = 'C:\\Users\\Administrator\\Desktop\\wuliu_project\\web\\tenant-web\\public';

// 需要添加二级导航 JS 的文件
const filesToUpdate = [
    'orders.html',
    'quotes.html',
    'vehicles.html',
    'applications.html',
    'profile.html',
    'violations.html',
    'settings.html',
    'map.html',
    'map-management.html',
    'carrier-stop-points.html',
    'dashboard.html'
];

// 二级导航 JavaScript 代码
const submenuJs = `
    // 二级导航菜单交互
    document.querySelectorAll('.submenu-toggle').forEach(toggle => {
      toggle.addEventListener('click', function(e) {
        e.preventDefault();
        const parentLi = this.closest('.has-submenu');
        if (parentLi) {
          parentLi.classList.toggle('open');
        }
      });
    });
`;

let updatedCount = 0;

filesToUpdate.forEach(filename => {
    const filePath = path.join(tenantWebDir, filename);
    
    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  文件不存在：${filename}`);
        return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 在 DOMContentLoaded 中添加二级导航交互
    const oldDomContentLoaded = "document.addEventListener('DOMContentLoaded', function() {";
    const newDomContentLoaded = `document.addEventListener('DOMContentLoaded', function() {${submenuJs}`;
    
    if (content.includes(oldDomContentLoaded)) {
        content = content.replace(oldDomContentLoaded, newDomContentLoaded);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ 已添加二级导航 JS：${filename}`);
        updatedCount++;
    } else {
        console.log(`⚠️  未找到 DOMContentLoaded：${filename}`);
    }
});

console.log(`\n更新完成：${updatedCount} 个文件\n`);
