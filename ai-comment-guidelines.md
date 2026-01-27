# AI友好的注释规范

## 目的
为了让AI更好地理解代码意图和业务逻辑，我们制定以下注释规范。

## 基本注释规范

### 1. 函数注释
```javascript
/**
 * 功能描述
 * @param {type} paramName - 参数说明
 * @returns {type} - 返回值说明
 * @example
 *   functionName(param) // 返回值说明
 */
function functionName(paramName) {
  // 实现逻辑
}
```

### 2. AI元数据注释
在关键代码处添加AI可识别的元数据：

```javascript
// AI-META: TYPE user_registration
// AI-META: VALIDATES phone, email, password
// AI-META: USES CustomerWebRegistration schema
// AI-META: OUTPUTS tenant_id, user_token
function registerUser(userData) {
  // 实现逻辑
}
```

### 3. 业务逻辑注释
```javascript
// BUSINESS-LOGIC: 用户注册流程
// 1. 验证输入数据格式
// 2. 检查用户是否已存在
// 3. 创建用户记录
// 4. 发送欢迎邮件
// 5. 返回用户令牌
```

## 验证相关注释

### 验证规则注释
```javascript
// VALIDATION-RULE: phone
// PATTERN: ^1[3-9][0-9]{9}$
// PURPOSE: 中国手机号格式验证
// EXAMPLE: 13800138000
if (!validatePhone(phone)) {
  throw new Error('Invalid phone number format');
}
```

### 数据库字段注释
```javascript
// DB-FIELD: users.phone
// VALIDATION: matches phone pattern from validation-metadata.json
// PURPOSE: 存储用户手机号
// FORMAT: 11位中国手机号
const phone = userData.phone;
```

## API端点注释

### 端点元数据
```javascript
// API-ENDPOINT: POST /api/tenant-web/register
// PURPOSE: 用户注册
// REQUEST-BODY: CustomerWebRegistration schema
// RESPONSE: Tenant registration success/failure
// VALIDATION: Uses shared validation library
```

## 模块关系注释

### 依赖关系
```javascript
// DEPENDS-ON: validation-rules.js
// USES: OpenAPI specification from openapi.yaml
// CONNECTS-TO: database via db/index.js
```

## 错误处理注释

### 错误类型
```javascript
// ERROR-HANDLING: 
// - ValidationError: 输入格式不正确
// - ConflictError: 用户已存在
// - ServerError: 数据库操作失败
```

## 代码生成提示

### AI指令注释
```javascript
// AI-INSTRUCTION: 
// When modifying this function, ensure:
// 1. All input fields are validated using shared validation library
// 2. Error messages are user-friendly
// 3. Sensitive data is properly sanitized
```

## 示例：完整函数注释

```javascript
/**
 * 用户注册函数
 * 处理新用户的注册请求，验证输入数据，创建用户记录
 * 
 * @param {Object} userData - 用户注册数据
 * @param {string} userData.phone - 用户手机号
 * @param {string} userData.password - 用户密码
 * @param {string[]} userData.roles - 用户角色数组
 * @returns {Promise<Object>} - 注册结果
 * 
 * @throws {ValidationError} - 当输入数据格式不正确时
 * @throws {ConflictError} - 当用户已存在时
 * 
 * @example
 * const result = await registerUser({
 *   phone: '13800138000',
 *   password: 'securePassword',
 *   roles: ['customer']
 * });
 */
// AI-META: TYPE user_registration
// AI-META: VALIDATES phone, password, roles
// AI-META: USES CustomerWebRegistration schema
// AI-META: AFFECTS users table, tenants table
// API-ENDPOINT: POST /api/tenant-web/register
// VALIDATION-RULES: phone(^1[3-9][0-9]{9}$), password(minLength:6)
async function registerUser(userData) {
  // 验证输入数据
  // 实现逻辑
}
```

## 重要提醒

1. 保持注释简洁但信息丰富
2. 使用标准格式，便于AI解析
3. 及时更新注释以反映代码变更
4. 重点关注业务逻辑和数据流向