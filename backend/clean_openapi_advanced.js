const fs = require('fs');
const path = require('path');

// Read the problematic file
const filePath = './backend/openapi.yaml.backup';
const content = fs.readFileSync(filePath, 'utf8');

// Split content into lines
const lines = content.split('\n');

// Track unique content blocks to avoid removing legitimate repeated structures
const processedBlocks = new Set();
const cleanedLines = [];

// Process content in chunks to preserve logical structures
let currentBlock = '';
let insideSchema = false;
let insidePath = false;
let indentLevel = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmedLine = line.trim();
  
  // Detect beginning of new schema or path definitions
  if (trimmedLine.includes('type: object') && trimmedLine.startsWith('  ')) {
    insideSchema = true;
  } else if (trimmedLine.startsWith('/')) {
    insidePath = true;
    insideSchema = false;
  } else if (trimmedLine === '' || trimmedLine.startsWith('#')) {
    // Skip empty lines and comments for uniqueness check
    cleanedLines.push(line);
    continue;
  }
  
  // Create a key for this line considering its context
  const contextKey = `${trimmedLine}_${indentLevel}`;
  
  // Check if this specific content block already exists
  if (!processedBlocks.has(contextKey)) {
    processedBlocks.add(contextKey);
    cleanedLines.push(line);
  } else {
    // For schemas and paths, we need to be more careful about what we consider duplicate
    // Only skip if it's not part of a unique schema or path definition
    const isPartOfSchemaOrPath = insideSchema || insidePath;
    
    if (!isPartOfSchemaOrPath) {
      // This is a duplicate line outside of schema/path definitions, skip it
      continue;
    } else {
      // For schema/path parts, check if this creates a unique combination
      const fullContext = `${currentBlock}|${trimmedLine}`;
      if (!processedBlocks.has(fullContext)) {
        processedBlocks.add(fullContext);
        cleanedLines.push(line);
        currentBlock += trimmedLine + '|';
      }
    }
  }
  
  // Update indent level based on current line
  const currentIndent = line.length - line.trimStart().length;
  if (currentIndent < indentLevel && trimmedLine && !trimmedLine.startsWith('#')) {
    // Reset context when indent decreases significantly
    currentBlock = trimmedLine + '|';
  } else if (trimmedLine) {
    currentBlock += trimmedLine + '|';
  }
  indentLevel = currentIndent;
  
  // Reset flags when appropriate
  if (trimmedLine.startsWith('components:') || trimmedLine.startsWith('paths:')) {
    insideSchema = false;
    insidePath = false;
  }
}

// Join the cleaned lines back
let cleanedContent = cleanedLines.join('\n');

// Additional cleanup: remove multiple consecutive blank lines
cleanedContent = cleanedContent.replace(/\n\s*\n\s*\n/g, '\n\n');

// Write the cleaned content back to file
fs.writeFileSync('./backend/openapi_cleaned_with_fuel_efficiency.yaml', cleanedContent);

console.log('OpenAPI file with fuel efficiency content cleaned successfully!');
console.log('Original line count:', lines.length);
console.log('Cleaned line count:', cleanedLines.length);
console.log('Removed approximately', lines.length - cleanedLines.length, 'duplicate/redundant lines');