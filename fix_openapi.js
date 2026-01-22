#!/usr/bin/env node

// 修复 openapi.yaml 文件的脚本
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'backend', 'openapi.yaml');
const content = fs.readFileSync(filePath, 'utf8');

// 按行分割内容
const lines = content.split('\n');

// 跟踪已见过的路径
const seenPaths = new Set();
const filteredLines = [];
let skipBlock = false;
let currentPath = '';

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // 检查是否是路径定义行 (以 /api/ 开头且缩进为2个空格)
    const pathMatch = line.match(/^\s*(\/api\/.*)$/);
    if (pathMatch && line.trimStart().startsWith('/api/')) {
        const pathDef = pathMatch[1].trim();
        
        if (seenPaths.has(pathDef)) {
            console.log(`发现重复路径定义: ${pathDef}，跳过该块...`);
            skipBlock = true;
            currentPath = pathDef;
        } else {
            seenPaths.add(pathDef);
            filteredLines.push(line);
        }
    } else if (skipBlock) {
        // 检查是否是新的路径定义，或者是与当前块相同缩进的行（表示新块开始）
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#') && line.match(/^\s*\//) && !line.includes(':')) {
            // 这可能是另一个路径定义的开始
            const nextPathMatch = line.match(/^\s*(\/api\/.*)$/);
            if (nextPathMatch) {
                skipBlock = false;
                const newPath = nextPathMatch[1].trim();
                if (!seenPaths.has(newPath)) {
                    seenPaths.add(newPath);
                    filteredLines.push(line);
                }
            } else {
                // 继续跳过当前块
            }
        } else {
            // 继续跳过当前块
        }
    } else {
        filteredLines.push(line);
    }
}

// 写回文件
fs.writeFileSync(filePath, filteredLines.join('\n'));
console.log('openapi.yaml 文件修复完成！');