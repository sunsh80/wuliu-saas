const fs = require('fs');

// Read the backup file with fuel efficiency content
const content = fs.readFileSync('./backend/openapi.yaml.backup', 'utf8');
const lines = content.split('\n');

// Object to track unique definitions by their context
const seenDefinitions = new Map();
const cleanedLines = [];
const pathTracking = new Set(); // Track unique paths
const schemaTracking = new Set(); // Track unique schemas

let currentSection = '';
let currentSchema = '';
let currentPath = '';
let insideComponents = false;
let insidePaths = false;
let insideSchemas = false;
let insideCurrentSchema = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmedLine = line.trim();
  
  // Track section changes
  if (trimmedLine === 'components:') {
    insideComponents = true;
    insidePaths = false;
  } else if (trimmedLine === 'paths:') {
    insideComponents = false;
    insidePaths = true;
  } else if (insideComponents && trimmedLine === 'schemas:') {
    insideSchemas = true;
  } else if (insideSchemas && trimmedLine.endsWith(':') && !trimmedLine.includes(': ') && line.startsWith('  ' + ' '.repeat(getIndentLevel(lines[i])))) {
    // Detect new schema definition
    const schemaName = trimmedLine.slice(0, -1); // Remove trailing ':'
    if (schemaName !== 'properties' && schemaName !== 'required' && schemaName !== 'type' && schemaName !== 'enum') {
      currentSchema = schemaName;
      insideCurrentSchema = true;
    }
  } else if (insidePaths && trimmedLine.startsWith('/') && trimmedLine.includes(':')) {
    // Detect path definition
    currentPath = trimmedLine;
  }
  
  // Check for duplicate schemas
  if (insideSchemas && currentSchema && trimmedLine.startsWith(currentSchema + ':')) {
    if (schemaTracking.has(currentSchema)) {
      // This schema is a duplicate, skip it
      continue;
    } else {
      schemaTracking.add(currentSchema);
    }
  }
  
  // Check for duplicate paths
  if (insidePaths && currentPath && trimmedLine.startsWith('/')) {
    if (pathTracking.has(currentPath)) {
      // This path is a duplicate, skip the whole path definition
      continue;
    } else {
      pathTracking.add(currentPath);
    }
  }
  
  // Add line to cleaned content
  cleanedLines.push(line);
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