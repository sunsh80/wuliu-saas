const fs = require('fs');
const path = require('path');

// Read the problematic file
const filePath = './backend/openapi.yaml';
const content = fs.readFileSync(filePath, 'utf8');

// Split content into lines
const lines = content.split('\n');

// Track unique lines and their first occurrence position
const uniqueLines = [];
const seenLines = new Set();

// Process lines, keeping only unique ones except for intentional repetitions
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Skip duplicate lines, but preserve important structural elements
  if (!seenLines.has(line.trim()) || 
      line.trim() === '' || 
      line.startsWith('  ') && !line.startsWith('    ') ||
      line.includes('openapi:') ||
      line.includes('info:') ||
      line.includes('servers:') ||
      line.includes('tags:') ||
      line.includes('components:') ||
      line.includes('paths:') ||
      line.includes('type:') ||
      line.includes('properties:') ||
      line.includes('- name:') ||
      line.includes('operationId:') ||
      line.includes('responses:') ||
      line.includes('$ref:')
  ) {
    uniqueLines.push(line);
    if (line.trim() !== '') {
      seenLines.add(line.trim());
    }
  }
}

// Join the unique lines back
let cleanedContent = uniqueLines.join('\n');

// Additional processing to fix common OpenAPI structure issues
// Ensure proper document structure
const sections = ['openapi:', 'info:', 'servers:', 'tags:', 'components:', 'paths:'];
for (const section of sections) {
  // Find multiple occurrences of section headers and remove duplicates
  const regex = new RegExp(`^(${section})\\s*$`, 'gm');
  const matches = [...cleanedContent.matchAll(regex)];
  if (matches.length > 1) {
    // Keep only the first occurrence of each section header
    const firstIndex = matches[0].index;
    for (let i = 1; i < matches.length; i++) {
      const match = matches[i];
      // Remove duplicate section header
      cleanedContent = cleanedContent.substring(0, match.index) + 
                       cleanedContent.substring(match.index + match[0].length);
    }
  }
}

// Write the cleaned content back to file
fs.writeFileSync('./backend/openapi_cleaned.yaml', cleanedContent);

console.log('OpenAPI file cleaned successfully!');
console.log('Original line count:', lines.length);
console.log('Cleaned line count:', uniqueLines.length);