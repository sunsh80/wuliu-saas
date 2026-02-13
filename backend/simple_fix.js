// Simple script to clean up the openapi.yaml file by removing duplicate method definitions
const fs = require('fs');
const path = require('path');

// Read the current openapi.yaml file
const filePath = path.join(__dirname, 'openapi.yaml');
let content = fs.readFileSync(filePath, 'utf8');

console.log('Starting cleanup of openapi.yaml...');

// Method 1: Remove duplicate post: definitions by keeping only the first one in each path block
let lines = content.split('\n');
let newLines = [];
let insidePathBlock = false;
let currentPath = '';
let seenMethods = new Set();

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmedLine = line.trim();
  
  // Check if this is a path definition
  if (trimmedLine.startsWith('  /') && trimmedLine.endsWith(':') && !trimmedLine.includes('  - ') && !trimmedLine.includes('  required:')) {
    // New path definition
    currentPath = trimmedLine;
    insidePathBlock = true;
    seenMethods.clear();
    newLines.push(line);
  } 
  else if (insidePathBlock && (trimmedLine === 'get:' || trimmedLine === 'post:' || trimmedLine === 'put:' || 
         trimmedLine === 'patch:' || trimmedLine === 'delete:')) {
    // This is an HTTP method definition
    const method = trimmedLine.replace(':', '');
    
    if (seenMethods.has(method)) {
      // This is a duplicate method - skip this entire method block
      console.log(`Removing duplicate ${method} method in ${currentPath}`);
      
      // Skip lines until we find the next method definition or path definition with same/same-or-less indentation
      const currentIndent = line.search(/\S/);
      i++; // Move to next line
      
      while (i < lines.length) {
        const nextLine = lines[i];
        const nextIndent = nextLine.search(/\S/);
        const nextTrimmed = nextLine.trim();
        
        // Check if this is a new method or path definition
        if ((nextTrimmed === 'get:' || nextTrimmed === 'post:' || nextTrimmed === 'put:' || 
             nextTrimmed === 'patch:' || nextTrimmed === 'delete:') ||
            (nextTrimmed.startsWith('  /') && nextTrimmed.endsWith(':') && !nextTrimmed.includes('  - '))) {
          // This is a new method or path definition, go back one line to process it
          i--;
          break;
        }
        
        // If indentation goes back to path level (2 spaces) or less, this method block is ending
        if (nextIndent <= currentIndent && nextIndent <= 4 && nextTrimmed !== '') {
          i--; // Go back to reprocess this line
          break;
        }
        
        i++; // Skip this line
      }
    } else {
      // First occurrence of this method - keep it
      seenMethods.add(method);
      newLines.push(line);
    }
  } else {
    // Regular line - keep it
    newLines.push(line);
    
    // If we encounter a top-level element, we're no longer in a path block
    if (trimmedLine.match(/^(components|paths|info|openapi|servers|securitySchemes):/) && line.search(/\S/) === 0) {
      insidePathBlock = false;
    }
  }
}

content = newLines.join('\n');

// Write the cleaned content back to the file
fs.writeFileSync(filePath, content, 'utf8');

console.log('Cleanup completed!');