# 验证规范文档

## API参数命名规范

- 前端JavaScript变量使用camelCase（如orderId, carrierId）
- 后端API路径参数使用snake_case（如order_id, carrier_id）
- 数据库字段使用snake_case（如order_id, carrier_id）
- 请求体参数使用camelCase（如orderId, carrierId）

## 手机号验证
- 模式: `^1[3-9][0-9]{9}$`
- 用途: 中国手机号格式验证
- 应用场景: phone, contact_phone, driver_phone, customer_phone

## 用户名验证
- 模式: `^[a-zA-Z0-9_-]{3,20}$`
- 用途: 用户名格式验证
- 应用场景: username

## 姓名验证
- 模式: `^[\u4e00-\u9fa5a-zA-Z0-9_-]{1,50}$`
- 用途: 中文、英文姓名格式验证
- 应用场景: name, contact_person, driver_name

## 地址验证
- 模式: `^[\u4e00-\u9fa5a-zA-Z0-9\s\S]{1,200}$`
- 用途: 地址格式验证
- 应用场景: address

## 邮箱验证
- 模式: `^[^\s@]+@[^\s@]+\.[^\s@]+$`
- 用途: 邮箱格式验证
- 应用场景: email

## 密码验证
- 最小长度: 6位
- 用途: 密码强度验证
- 应用场景: password