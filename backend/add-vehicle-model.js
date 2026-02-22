const fs = require('fs');

let openapi = fs.readFileSync('backend/openapi.yaml', 'utf8');

const endpoint = `
  /api/admin/vehicle-models:
    post:
      tags: [admin-vehicle-models]
      summary: 创建车型
      operationId: createVehicleModel
      security:
        - AdminSessionAuth: []
      requestBody:
        required: true
        content:
          application/json: { schema: { type: object } }
      responses:
        '201': { description: 创建成功 }
        '401': { $ref: '#/components/responses/UnauthorizedError' }
`;

const idx = openapi.indexOf('paths:');
if (idx === -1) {
  console.error('No paths section');
  process.exit(1);
}

const insertPos = idx + 6;
openapi = openapi.slice(0, insertPos) + endpoint + openapi.slice(insertPos);

fs.writeFileSync('backend/openapi.yaml', openapi, 'utf8');
console.log('Done');
