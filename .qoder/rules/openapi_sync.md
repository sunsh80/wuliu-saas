# OpenAPI 自动同步与校验规则（v1.0）

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