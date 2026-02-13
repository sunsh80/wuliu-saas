// Script to remove duplicate HTTP methods within the same API path
const fs = require('fs');
const path = require('path');

// Read the current openapi.yaml file
const filePath = path.join(__dirname, 'openapi.yaml');
const content = fs.readFileSync(filePath, 'utf8');

// Split the content into lines
const lines = content.split('\n');

// Variables to track our position in the document
let newLines = [];
let insidePathDefinition = false;
let currentPath = '';
let seenMethods = new Set();

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmedLine = line.trim();
  
  // Check if this line is a path definition
  if (trimmedLine.match(/^  \/[a-zA-Z0-9/_\-{}:]+:$/)) {
    // This is a path definition line like "  /api/tenant-web/vehicles:"
    currentPath = trimmedLine;
    insidePathDefinition = true;
    seenMethods.clear(); // Reset methods for this new path
    newLines.push(line);
  } 
  // Check if this line is an HTTP method definition
  else if (insidePathDefinition && (trimmedLine === 'get:' || trimmedLine === 'post:' || trimmedLine === 'put:' || trimmedLine === 'patch:' || trimmedLine === 'delete:')) {
    const method = trimmedLine.slice(0, -1); // Remove the colon
    
    if (seenMethods.has(method)) {
      // This is a duplicate method - we need to skip this method definition
      // Find where this method definition ends (when we return to the same indentation level or less)
      console.log(`Skipping duplicate ${method} method in ${currentPath}`);
      
      const methodIndentation = line.search(/\S/); // Find indentation level
      i++; // Move to next line
      
      // Skip lines until we find a line with equal or less indentation
      while (i < lines.length) {
        const currentLine = lines[i];
        const currentIndentation = currentLine.search(/\S/);
        
        // If we have a non-empty line with same or less indentation, this method definition has ended
        if (currentIndentation <= methodIndentation && currentLine.trim() !== '') {
          i--; // Step back to process this line in the next iteration
          break;
        }
        
        i++;
      }
    } else {
      // First time seeing this method for this path - keep it
      seenMethods.add(method);
      newLines.push(line);
    }
  } else {
    // Regular line - just add it
    newLines.push(line);
    
    // If we encounter a top-level element (like components:, paths:), we're no longer in a path definition
    if (trimmedLine.match(/^(components|paths|info|openapi|servers):/)) {
      insidePathDefinition = false;
    }
  }
}

// Write the cleaned content back to the file
const newContent = newLines.join('\n');
fs.writeFileSync(filePath, newContent, 'utf8');

console.log('Duplicate HTTP methods within API paths removed successfully!');