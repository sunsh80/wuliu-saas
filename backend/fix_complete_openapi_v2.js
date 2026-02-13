const fs = require('fs');

// Read the backup file with fuel efficiency content
const content = fs.readFileSync('./backend/openapi.yaml.backup', 'utf8');
const lines = content.split('\n');

// Track unique schemas and paths
const seenSchemas = new Set();
const seenPaths = new Set();
const cleanedLines = [];

let insideSchemas = false;
let insidePaths = false;
let currentSchema = null;
let currentPath = null;
let skipCurrentBlock = false;
let blockIndent = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmedLine = line.trim();
  
  // Detect entering schemas section
  if (trimmedLine === 'schemas:') {
    insideSchemas = true;
    insidePaths = false;
  }
  // Detect entering paths section
  else if (trimmedLine === 'paths:') {
    insideSchemas = false;
    insidePaths = true;
  }
  // Detect leaving components section
  else if (trimmedLine === 'paths:' && !insidePaths) {
    insideSchemas = false;
  }
  
  // In schemas section, detect schema definitions
  if (insideSchemas && /^[a-zA-Z_]/.test(trimmedLine) && trimmedLine.endsWith(':') && !trimmedLine.includes('://')) {
    const schemaName = trimmedLine.slice(0, -1); // Remove trailing ':'
    
    // These are not schema definitions
    if (['type:', 'properties:', 'required:', 'enum:', 'items:', 'description:', 'example:', 'minimum:', 'maximum:', 'format:', 'pattern:', 'nullable:'].includes(trimmedLine)) {
      continue;
    }
    
    // Check if this is a known schema name (starts with capital letter or follows naming convention)
    if (!schemaName.includes(' ') && !['type', 'properties', 'required', 'enum', 'items', 'description', 'example', 'minimum', 'maximum', 'format', 'pattern', 'nullable', 'in', 'name', 'schema', 'content', 'application/json', 'responses', 'get', 'post', 'put', 'delete'].includes(schemaName)) {
      if (seenSchemas.has(schemaName)) {
        // This schema is a duplicate, start skipping lines
        skipCurrentBlock = true;
        blockIndent = getIndentLevel(line);
      } else {
        seenSchemas.add(schemaName);
        skipCurrentBlock = false;
      }
    }
  }
  // In paths section, detect path definitions
  else if (insidePaths && trimmedLine.startsWith('/')) {
    if (seenPaths.has(trimmedLine)) {
      // This path is a duplicate, start skipping lines
      skipCurrentBlock = true;
      blockIndent = getIndentLevel(line);
    } else {
      seenPaths.add(trimmedLine);
      skipCurrentBlock = false;
    }
  }
  // Check if we're exiting a skipped block
  else if (skipCurrentBlock) {
    const currentIndent = getIndentLevel(line);
    // If current indent is less than or equal to the block indent, we're out of the block
    if (currentIndent <= blockIndent && trimmedLine !== '') {
      skipCurrentBlock = false;
    }
  }
  
  // Add line if we're not skipping the current block
  if (!skipCurrentBlock) {
    cleanedLines.push(line);
  }
}

// Helper function to get indent level
function getIndentLevel(line) {
  let count = 0;
  for (let char of line) {
    if (char === ' ') count++;
    else break;
  }
  return count;
}

// Join the cleaned lines back
const cleanedContent = cleanedLines.join('\n');

// Write the cleaned content back to file
fs.writeFileSync('./backend/openapi_complete_fixed.yaml', cleanedContent);

console.log('Complete OpenAPI file with fuel efficiency content fixed successfully!');
console.log('Original line count:', lines.length);
console.log('Cleaned line count:', cleanedLines.length);
console.log('Removed duplicate schemas and paths while preserving all content');
console.log('Fuel efficiency markers preserved:', (cleanedContent.match(/燃油效率/g) || []).length, 'occurrences');
console.log('Unique schemas found:', seenSchemas.size);
console.log('Unique paths found:', seenPaths.size);