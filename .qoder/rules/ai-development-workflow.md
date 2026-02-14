# AI开发工作流程

## 目的
本文档描述了在项目中进行AI辅助开发的标准工作流程。

## API参数命名规范

在进行API开发时，请遵循以下命名规范：

- 前端JavaScript变量使用camelCase（如orderId, carrierId）
- 后端API路径参数使用snake_case（如order_id, carrier_id）
- 数据库字段使用snake_case（如order_id, carrier_id）
- 请求体参数使用camelCase（如orderId, carrierId）

## 1. 代码生成前的准备

### 1.1. 理解项目结构
- 阅读 `project-structure.md` 了解整体架构
- 检查 `.ai-config.json` 了解AI配置
- 熟悉 `validation-metadata.json` 中的验证规则

### 1.2. 确定验证需求
- 确定新功能需要哪些验证规则
- 检查是否已有相似的验证规则
- 如需新增验证规则，更新 `validation-metadata.json`

## 2. 代码生成流程

### 2.1. API端点开发
1. 参考 `code-generation-template.hbs` 中的API端点模板
2. 在 `openapi.yaml` 中定义API规范
3. 创建对应的处理程序文件
4. 使用验证中间件进行输入验证
5. 确保验证规则与 `validation-metadata.json` 一致

### 2.2. 数据库操作
1. 如需新增表，更新 `backend/db/schema.js`
2. 创建对应的模型文件
3. 确保字段类型与验证规则匹配

### 2.3. 前端验证
1. 确保前端验证与后端验证规则一致
2. 使用 `validation-rules.js` 中的共享验证函数
3. 提供良好的用户体验反馈

## 3. 代码审查清单

### 3.1. 验证一致性
- [ ] 验证规则与 `validation-metadata.json` 一致
- [ ] 前后端验证规则保持一致
- [ ] 使用了共享验证库中的函数

### 3.2. 注释规范
- [ ] 遌用了AI友好的注释规范
- [ ] 添加了必要的AI元数据注释
- [ ] 包含了业务逻辑说明

### 3.3. 错误处理
- [ ] 有适当的错误处理逻辑
- [ ] 错误信息对用户友好
- [ ] 日志记录适当

## 4. 测试流程

### 4.1. 一致性检查
1. 运行 `node check-consistency.js` 检查验证规则一致性
2. 确保所有验证规则都匹配

### 4.2. 功能测试
1. 测试API端点的各种输入情况
2. 验证错误处理逻辑
3. 确保数据正确存储和检索

## 5. 提交前检查

### 5.1. 文件更新
- [ ] 更新了相关的文档文件
- [ ] 验证规则元数据已更新
- [ ] 一致性检查通过

### 5.2. 代码质量
- [ ] 代码风格与项目保持一致
- [ ] 没有冗余或未使用的代码
- [ ] 注释清晰且有用

## 6. AI指令规范

### 6.1. 代码生成指令
```
// AI-INSTRUCTION:
// When generating code for this project:
// 1. Refer to validation-metadata.json for validation rules
// 2. Use shared validation library functions
// 3. Follow the comment guidelines in ai-comment-guidelines.md
// 4. Ensure consistency between frontend and backend validation
// 5. Add appropriate error handling and logging
// 6. Use the templates in code-generation-template.hbs
// 7. When working with database code, use better-sqlite3 consistently across all files
// 8. Ensure all database-related files use the same database module
```

### 6.2. 验证规则更新指令
```
// AI-INSTRUCTION:
// When adding new validation rules:
// 1. Update validation-metadata.json first
// 2. Add corresponding validation functions to validation-rules.js
// 3. Update both frontend and backend validation
// 4. Run consistency check after changes
// 5. Update documentation if needed
```

### 6.3. 数据库代码生成指令
```
// AI-INSTRUCTION:
// When generating database-related code:
// 1. Use unified database module (require('../../db') or similar) instead of hardcoding database connections
// 2. Check existing database files to ensure consistency
// 3. If direct database connections are found, update all database files to use unified database module
// 4. Update package.json to include sqlite3 dependency if needed
// 5. Provide Promise wrappers for asynchronous operations when needed
// 6. Follow the database interaction patterns in section 7.2
// 7. Always use getDb() function from unified database module instead of creating new connections
```

## 7. 常见模式

### 7.1. API端点模式
- 使用OpenAPI规范定义端点
- 应用验证中间件
- 实现错误处理
- 返回标准化响应

### 7.2. 数据库交互模式
- 统一使用项目中指定的数据库模块（如 `better-sqlite3`）
- 使用参数化查询防止SQL注入
- 实现事务处理
- 验证输入数据
- 处理数据库错误
- 对于异步操作，提供适当的Promise包装器

### 7.3. 验证模式
- 客户端预验证
- API层验证
- 业务逻辑验证
- 数据库约束

## 8. 故障排除

### 8.1. 验证不一致
- 运行 `node check-consistency.js` 检查
- 确保所有验证规则都更新
- 检查正则表达式格式

### 8.2. API规范问题
- 验证OpenAPI YAML格式
- 检查模式定义
- 确保端点定义正确

### 8.3. 数据库问题
- 检查SQL语法
- 验证字段类型
- 确保外键关系正确
- 确保使用统一的数据库模块（如 `better-sqlite3`）
- 避免混用不同的数据库模块（如 `sqlite3` 和 `better-sqlite3`）

### 8.4. 数据库模块一致性问题
- 检查所有数据库相关文件是否使用相同的数据库模块
- 确保 package.json 中包含了正确的数据库依赖
- 验证数据库连接和操作代码的API兼容性
- 如需切换数据库模块，确保所有相关文件都同步更新

### 8.5. 模块化数据库访问问题
- 检查是否在 handler 文件中直接创建了数据库连接
- 确保所有数据库操作都通过统一的数据库管理模块进行
- 避免在多个地方重复创建数据库连接
- 验证是否正确使用了 `getDb()` 函数而非直接创建新连接

## 9. 最佳实践

1. **渐进式开发**: 小步快跑，频繁提交
2. **文档先行**: 先更新文档再写代码
3. **验证一致**: 前后端验证规则必须一致
4. **错误处理**: 优雅处理各种错误情况
5. **代码复用**: 最大化利用共享验证库
6. **测试驱动**: 先写测试再实现功能
7. **模块一致性**: 在整个项目中统一使用相同的数据库模块，推荐使用 `sqlite3`（require('sqlite3').verbose()），避免使用需要本地编译的模块
8. **模块化数据库访问**: 避免在 handler 文件中直接创建数据库连接，使用统一的数据库管理模块（如 `require('../../db')`），确保所有数据库操作都通过统一的连接管理

## 10. 数据库模块使用指南

### 10.1 选择合适的数据库模块
- 使用传统的 `sqlite3` 模块（require('sqlite3').verbose()）
- `sqlite3` 模块更稳定，不需要本地编译，在各种环境中兼容性更好
- 使用回调API进行数据库操作，或使用Promise包装器实现异步操作

### 10.2 正确的导入和使用方式
```javascript
// 推荐方式 - 使用统一的数据库模块（避免硬编码数据库连接）
const { getDb } = require('../../db'); // 根据实际路径调整

// 在函数内部获取数据库连接
function someHandlerFunction(req, res) {
  const db = getDb(); // 获取统一的数据库连接
  
  // 使用回调方式进行数据库操作
  db.get('SELECT * FROM table WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error(err);
    } else {
      console.log(row);
    }
  });

  // 对于需要异步操作的情况，使用统一的数据库连接
  const runAsync = (sql, params) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this);
        }
      });
    });
  };
}
```

### 10.3 模块化数据库访问
- 避免在 handler 文件中直接创建数据库连接
- 使用项目统一的数据库管理模块 `require('../../db')`
- 确保所有数据库操作都通过统一的连接管理
- 不要在多个地方重复创建数据库连接

### 10.4 避免常见错误
- 项目中统一使用 `sqlite3` 模块，避免使用 `better-sqlite3`（因为它需要本地编译，在某些环境中可能不可用）
- 确保 package.json 中包含正确的依赖
- 更新所有使用数据库的文件以保持一致性

## 11. AI协作提示

// AI-TIP:
// For optimal collaboration:
// 1. Always refer to the project documentation
// 2. Follow the established patterns
// 3. Maintain consistency with existing code
// 4. Use the validation system consistently
// 5. Add meaningful comments for future reference
// 6. Keep the big picture in mind when making changes
// 7. When working with database code, ensure consistency in module usage across the project

## 语义流程指导

当开发新功能时，请遵循以下语义流程：

1. **查阅项目规范**：
   - 首先查看 `ai-development-workflow.md` 了解标准开发流程
   - 阅读 `ai-comment-guidelines.md` 了解注释规范
   - 检查 `validation-spec.md` 了解现有验证规则

2. **理解现有架构**：
   - 查看 `PROJECT_STRUCTURE.md` 了解API端点模式
   - 研究 `backend/openapi.yaml` 中的API定义
   - 分析 `backend/db/schema.js` 中的数据结构

3. **定位关键文件**：
   - 根据功能类型确定需要修改的核心文件
   - 检查相关处理程序和前端代码
   - 确认依赖关系和数据流向

4. **AI指令结构**：
   - 明确说明新功能的需求和目标
   - 指定使用现有验证规则
   - 要求遵循API参数命名规范：路径参数使用snake_case，前端变量使用camelCase
   - 强调需要更新OpenAPI规范文件

5. **开发顺序**：
   - 先更新OpenAPI规范定义新功能
   - 再开发后端处理逻辑
   - 最后更新相关文档和测试

6. **质量要求**：
   - 确保与现有验证系统一致
   - 遵循数据库字段命名规范
   - 添加适当的错误处理和日志记录
   - 更新相关文档

7. **测试验证**：
   - 运行 `check-consistency.js` 验证规则一致性
   - 确保新功能符合API参数命名规范

   
## 🎯 核心目标
所有 API 接口和数据模型必须与 `openapi.yaml` 严格一致，实现“代码即文档”。

## ✅ 强制要求

### 1. 文件位置与格式
- `openapi.yaml` 必须位于项目根目录。
- 使用 **YAML 1.2** 格式，**2 空格缩进**，禁止制表符（Tab）。
- 所有 `$ref` 路径必须用**双引号包裹**，例如：`"$ref": "#/components/schemas/OrderDTO"`

### 2. 自动生成逻辑
- 每次生成新 Controller 或修改 DTO 类时，必须：
  - 自动更新 `openapi.yaml` 中对应的 `paths` 和 `components.schemas`
  - 新增字段必须出现在 schema 的 `properties` 中，并标注 `type`、`example`（如适用）
- 若 `openapi.yaml` 不存在，先生成基础模板（含 info、servers、基本 components）

### 3. 字段规范
- 所有字段名使用 **蛇形命名法**（如 `contact_phone`）
- 必填字段必须包含 `required` 列表
- 枚举类型必须用 `enum` 明确列出值（如 `status: [created
            - pending
            - pending_claim
            - claimed
            - quoted
            - awarded
            - dispatched
            - in_transit
            - delivered
            - cancelled]`）

### 4. 输出前校验
- 在返回代码前，内部执行 YAML 语法检查：
  - 缩进层级正确
  - 无重复 key
  - 所有引用路径有效（如 `#/components/schemas/DriverInfo` 必须存在）

## 🚫 禁止行为
- 手动在代码中写死 API 路径而不更新 openapi.yaml
- 修改 DTO 后不同步 schema
- 输出 JSON 格式的 OpenAPI（必须是 YAML）

## 🔁 增量更新原则
- 仅修改受影响的 paths/schemas，**不要重写整个文件**
- 保留用户可能添加的自定义扩展（如 `x-freight-priority`）

> 此规则适用于所有后端语言（Java/Spring Boot, Node.js, Python/FastAPI 等）