# 物流项目启动脚本说明

本项目包含多个脚本来帮助您启动和管理整个物流项目（包括前端、后端、数据库和OpenAPI规范）。

## 脚本说明

### 1. full_stack_start.bat / full_stack_start.ps1
- **功能**：完整的全栈启动脚本
- **包含**：Redis服务、后端API、前端Web界面、OpenAPI规范对齐检查
- **使用方法**：双击运行或在命令行中执行

### 2. quick_full_stack_start.bat
- **功能**：快速启动整个项目
- **包含**：仅启动后端API和前端服务
- **使用方法**：日常开发时快速启动

### 3. start_all_services.bat / start_all_services.ps1
- **功能**：启动所有项目依赖和服务
- **包含**：Redis、Node.js环境、数据库等
- **使用方法**：首次设置或全面检查时使用

### 4. quick_start.bat
- **功能**：快速启动后端服务
- **使用方法**：仅需启动后端服务时使用

### 5. check_status.bat
- **功能**：检查所有服务状态
- **使用方法**：诊断问题时使用

## 服务端口信息

- **Backend API**: http://localhost:3000
- **Admin Web**: http://localhost:5173
- **Tenant Web**: http://localhost:5174
- **Customer Web**: http://localhost:5175

## 注意事项

1. **管理员权限**：运行脚本需要管理员权限，以确保能启动Redis服务
2. **依赖安装**：首次运行时会自动安装所有依赖
3. **OpenAPI对齐**：脚本会验证API实现与OpenAPI规范的一致性
4. **Redis服务**：确保Redis正确安装并运行，这对会话管理至关重要

## 故障排除

如果遇到问题，请按以下顺序检查：
1. 运行 `check_status.bat` 查看服务状态
2. 确保Node.js和npm已正确安装
3. 检查防火墙设置是否阻止了相应端口
4. 查看各服务的日志输出