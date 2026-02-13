// Final fix script to clean up the openapi.yaml file
const fs = require('fs');
const path = require('path');

// Read the current openapi.yaml file
const filePath = path.join(__dirname, 'openapi.yaml');
let content = fs.readFileSync(filePath, 'utf8');

console.log('Starting final cleanup of openapi.yaml...');

// Split content into lines
const lines = content.split('\n');

// Find all occurrences of the problematic path
const pathMarker = '/api/tenant-web/vehicles:';
const indices = [];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim() === pathMarker) {
    indices.push(i);
  }
}

console.log(`Found ${indices.length} occurrences of ${pathMarker}`);

if (indices.length > 1) {
  // Keep the first occurrence and remove the rest
  const firstOccurrenceEnd = findEndOfPathDefinition(lines, indices[0]);
  
  let newContent = [];
  
  // Add everything before the first path definition
  for (let i = 0; i < indices[0]; i++) {
    newContent.push(lines[i]);
  }
  
  // Add the first path definition
  for (let i = indices[0]; i <= firstOccurrenceEnd; i++) {
    newContent.push(lines[i]);
  }
  
  // Find next path definition after the first occurrence to preserve the rest of the file
  let nextPathStart = firstOccurrenceEnd + 1;
  for (let i = firstOccurrenceEnd + 1; i < lines.length; i++) {
    if (lines[i].trim().startsWith('  /') && lines[i].trim().endsWith(':') && !lines[i].includes('/api/tenant-web/vehicles:')) {
      nextPathStart = i;
      break;
    }
  }
  
  // Add everything after the last duplicate
  for (let i = nextPathStart; i < lines.length; i++) {
    newContent.push(lines[i]);
  }
  
  // Write the cleaned content back
  fs.writeFileSync(filePath, newContent.join('\n'), 'utf8');
  console.log('Duplicate path definitions removed successfully!');
} else {
  console.log('No duplicates found for this specific path.');
}

// Helper function to find the end of a path definition block
function findEndOfPathDefinition(lines, startIndex) {
  for (let i = startIndex + 1; i < lines.length; i++) {
    // Path definitions typically end when we encounter the next path definition or a top-level element
    if (lines[i].trim().startsWith('  /') || lines[i].trim() === 'components:' || lines[i].trim() === 'paths:') {
      return i - 1;
    }
  }
  return lines.length - 1;
}

console.log('Final cleanup completed!');