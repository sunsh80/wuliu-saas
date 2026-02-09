const fs = require('fs');
const yaml = require('js-yaml');

console.log('尝试解析YAML文件以定位格式错误...');

try {
  const content = fs.readFileSync('C:\\Users\\Administrator\\Desktop\\wuliu_project\\backend\\openapi.yaml', 'utf8');
  console.log('文件读取成功，开始解析...');
  
  // 尝试解析YAML
  const doc = yaml.load(content);
  console.log('✅ YAML解析成功！');
} catch (error) {
  console.error('❌ YAML解析失败:', error.message);
  console.error('错误位置大约在:', error.mark ? `行 ${error.mark.line + 1}, 列 ${error.mark.column + 1}` : '未知位置');
  
  // 尝试分段解析来定位问题
  console.log('\\n尝试分段解析来定位问题...');
  const lines = content.split('\\n');
  const chunkSize = 1000; // 每次解析1000行
  
  for (let i = 0; i < lines.length; i += chunkSize) {
    const chunk = lines.slice(i, i + chunkSize).join('\\n');
    try {
      yaml.load(chunk);
      // console.log(`块 ${i / chunkSize + 1} (${i + 1}-${Math.min(i + chunkSize, lines.length)}) 解析成功`);
    } catch (chunkError) {
      console.log(`❌ 问题可能在行 ${i + 1} 到 ${Math.min(i + chunkSize, lines.length)} 之间`);
      console.log(`   错误信息: ${chunkError.message}`);
      
      // 在这个范围内进一步细分
      const subChunkSize = 100;
      for (let j = i; j < Math.min(i + chunkSize, lines.length); j += subChunkSize) {
        const subChunk = lines.slice(j, j + subChunkSize).join('\\n');
        try {
          yaml.load(subChunk);
        } catch (subChunkError) {
          console.log(`   ❌ 更精确的问题范围: 行 ${j + 1} 到 ${Math.min(j + subChunkSize, lines.length)}`);
          
          // 打印问题行附近的上下文
          console.log('   问题行附近的上下文:');
          for (let k = Math.max(0, j - 2); k < Math.min(lines.length, j + subChunkSize + 2); k++) {
            const prefix = k === j ? '>>> ' : '    ';
            console.log(`${prefix}${k + 1}: ${lines[k]}`);
          }
          break; // 只报告第一个发现的问题
        }
      }
      break; // 只报告第一个大块的问题
    }
  }
}