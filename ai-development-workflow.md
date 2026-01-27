# AI开发工作流程

## 目的
本文档描述了在项目中进行AI辅助开发的标准工作流程。

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

## 7. 常见模式

### 7.1. API端点模式
- 使用OpenAPI规范定义端点
- 应用验证中间件
- 实现错误处理
- 返回标准化响应

### 7.2. 数据库交互模式
- 使用参数化查询防止SQL注入
- 实现事务处理
- 验证输入数据
- 处理数据库错误

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

## 9. 最佳实践

1. **渐进式开发**: 小步快跑，频繁提交
2. **文档先行**: 先更新文档再写代码
3. **验证一致**: 前后端验证规则必须一致
4. **错误处理**: 优雅处理各种错误情况
5. **代码复用**: 最大化利用共享验证库
6. **测试驱动**: 先写测试再实现功能

## 10. AI协作提示

// AI-TIP:
// For optimal collaboration:
// 1. Always refer to the project documentation
// 2. Follow the established patterns
// 3. Maintain consistency with existing code
// 4. Use the validation system consistently
// 5. Add meaningful comments for future reference
// 6. Keep the big picture in mind when making changes