const fs = require('fs');
const readline = require('readline');
const { Transform } = require('stream');

class DeduplicateOperationIds extends Transform {
  constructor(options) {
    super(options);
    this.lineNumber = 0;
    this.seenOperationIds = new Set();
    this.duplicateCount = 0;
    this.modifiedLines = 0;
  }

  async _transform(chunk, encoding, callback) {
    const lines = chunk.toString().split('\n');
    const processedLines = [];

    for (let i = 0; i < lines.length; i++) {
      this.lineNumber++;
      let line = lines[i];

      // 检查是否是 operationId 行
      const operationIdMatch = line.match(/(\s*)operationId:(\s*)(\w+)/);
      if (operationIdMatch) {
        const [, indent, spacing, operationId] = operationIdMatch;
        
        if (this.seenOperationIds.has(operationId)) {
          // 这是一个重复的 operationId，我们需要修改它
          this.duplicateCount++;
          const newOperationId = `${operationId}_duplicate_${this.duplicateCount}`;
          
          // 替换 operationId
          line = `${indent}operationId:${spacing}${newOperationId}`;
          this.modifiedLines++;
          
          console.log(`第 ${this.lineNumber} 行: 重复的 operationId '${operationId}' 已重命名为 '${newOperationId}'`);
        } else {
          // 首次见到此 operationId
          this.seenOperationIds.add(operationId);
        }
      }

      processedLines.push(line);
    }

    // 除了最后一行，每行都需要加上换行符
    const result = processedLines.join('\n');
    callback(null, result);
  }

  _flush(callback) {
    console.log(`\\n处理完成:`);
    console.log(`- 总共修改了 ${this.modifiedLines} 个重复的 operationId`);
    console.log(`- 发现 ${this.seenOperationIds.size} 个唯一的 operationId`);
    callback(null);
  }
}

async function fixOpenApiSpec() {
  const inputFile = 'C:\\Users\\Administrator\\Desktop\\wuliu_project\\backend\\openapi.yaml';
  const outputFile = 'C:\\Users\\Administrator\\Desktop\\wuliu_project\\backend\\openapi_fixed.yaml';

  console.log('开始修复 OpenAPI 规范文件中的重复 operationId...');

  const readStream = fs.createReadStream(inputFile, { encoding: 'utf8' });
  const deduplicator = new DeduplicateOperationIds();
  const writeStream = fs.createWriteStream(outputFile, { encoding: 'utf8' });

  readStream
    .pipe(deduplicator)
    .pipe(writeStream)
    .on('finish', () => {
      console.log('\\n✅ 修复完成！');
      console.log(`输出文件: ${outputFile}`);
      
      // 提示用户替换原文件
      console.log('\\n📝 要应用修复，请执行以下操作:');
      console.log(`  1. 备份原文件: copy backend\\openapi.yaml backend\\openapi.yaml.backup`);
      console.log(`  2. 替换原文件: copy backend\\openapi_fixed.yaml backend\\openapi.yaml`);
    })
    .on('error', (err) => {
      console.error('\\n❌ 修复过程中发生错误:', err);
    });
}

fixOpenApiSpec().catch(console.error);