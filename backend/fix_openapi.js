// Script to remove duplicate API definitions from openapi.yaml
const fs = require('fs');
const path = require('path');

// Read the current openapi.yaml file
const filePath = path.join(__dirname, 'openapi.yaml');
const content = fs.readFileSync(filePath, 'utf8');

// Split the content into lines
const lines = content.split('\n');

// Track which paths we've seen
const seenPaths = new Set();
const newLines = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Check if this line defines a path (starts with 2 spaces followed by /)
  const pathMatch = line.match(/^  \/(.*)$/);
  
  if (pathMatch) {
    const pathDef = pathMatch[0].trim(); // Get the path definition
    
    if (seenPaths.has(pathDef)) {
      // This is a duplicate path - skip it until we find the next path or end
      console.log(`Skipping duplicate path: ${pathDef}`);
      continue;
    } else {
      // First time seeing this path - add it to the set
      seenPaths.add(pathDef);
      newLines.push(line);
    }
  } else {
    // Not a path definition, just add the line
    newLines.push(line);
  }
}

// Write the cleaned content back to the file
const newContent = newLines.join('\n');
fs.writeFileSync(filePath, newContent, 'utf8');

console.log('Duplicate API definitions removed successfully!');