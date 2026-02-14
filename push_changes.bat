@echo off
echo 正在推送更改到远程仓库...

REM 检查是否有未提交的更改
git status --porcelain

if errorlevel 1 (
    echo 检测到未提交的更改
) else (
    echo 没有检测到未提交的更改
    pause
    exit /b
)

echo.
echo 添加所有更改到暂存区...
git add .

if errorlevel 1 (
    echo 添加文件到暂存区失败
    pause
    exit /b
)

echo.
echo 提交更改...
git commit -m "全面更新车型库维护和车辆管理功能

## 车型管理功能增强
- 实现车型软删除功能，使用status和deleted_at字段
- 为tenant_vehicles表添加vehicle_model_id字段，建立车型与车辆关联
- 实现车型使用状态检查，防止删除正在使用的车型
- 更新车型增删改查(CRUD)功能

## 车辆状态管理功能
- 在车辆列表中添加'停用/启用'按钮
- 按钮颜色根据当前状态变化（红色表示停用，绿色表示启用）
- 保留原有的'查看'和'编辑'功能
- 实现车辆状态切换功能

## 数据库结构优化
- 为vehicle_models表添加status和deleted_at字段
- 为tenant_vehicles表添加vehicle_model_id字段
- 确保数据完整性约束

## API文档同步
- 更新OpenAPI规范以反映所有数据库和API变更
- 添加VehicleModel、VehicleModelUpdate、VehicleInfo schema定义
- 确保文档与实际实现保持一致

## 前端界面改进
- 更新车辆管理页面UI
- 添加状态切换交互功能
- 优化用户体验
"

if errorlevel 1 (
    echo 提交更改失败
    pause
    exit /b
)

echo.
echo 推送更改到远程仓库...
git push origin master

if errorlevel 1 (
    echo 推送失败，请检查网络连接和权限
) else (
    echo 推送成功！
)

pause