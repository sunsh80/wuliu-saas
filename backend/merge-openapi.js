const fs = require('fs');

let openapiContent = fs.readFileSync('backend/openapi.yaml', 'utf8');
const endpointsContent = fs.readFileSync('backend/openapi-endpoints-to-add.yaml', 'utf8');

const insertIndex = openapiContent.indexOf('components:');
if (insertIndex === -1) {
  console.error('Cannot find components section');
  process.exit(1);
}

openapiContent = openapiContent.slice(0, insertIndex) + endpointsContent + '\n\n' + openapiContent.slice(insertIndex);

fs.writeFileSync('backend/openapi.yaml', openapiContent, 'utf8');
console.log('Done');
