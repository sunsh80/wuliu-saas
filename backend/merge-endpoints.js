const fs = require('fs');

let openapi = fs.readFileSync('backend/openapi.yaml', 'utf8');
const endpoints = fs.readFileSync('backend/endpoints.yaml', 'utf8');

const idx = openapi.indexOf('components:');
if (idx === -1) {
  console.error('No components section');
  process.exit(1);
}

openapi = openapi.slice(0, idx) + endpoints + '\n\n' + openapi.slice(idx);

fs.writeFileSync('backend/openapi.yaml', openapi, 'utf8');
console.log('Done');
