# 物流系统API自动化测试

这是一个用于测试物流系统API的自动化测试套件，包含多个测试脚本，用于验证系统的各种功能。

## 测试脚本说明

### 主要测试文件
- `automated_test.js` - 基础API功能测试
- `comprehensive_api_test.js` - 全面的API功能测试
- `carrier_login_test.js` - 承运商登录专项测试
- `complete_carrier_flow_test.js` - 完整的承运商端到端流程测试
- `comprehensive_end_to_end_test.js` - 全面的端到端测试
- `comprehensive_role_test.js` - 角色权限测试

### 自动化测试运行器
- `final_api_test_runner.js` - 主自动化测试运行器，可依次运行所有测试
- `run_api_tests.bat` - Windows批处理脚本，用于便捷运行测试

## 如何运行测试

### 方法一：使用批处理脚本（推荐）
```bash
# 直接双击运行 run_api_tests.bat 或在命令行中执行
./run_api_tests.bat
```

### 方法二：手动运行
```bash
# 运行单个测试
node automated_test.js

# 运行所有测试
node final_api_test_runner.js
```

## 测试报告

- 测试报告将保存为 `test_report.json`
- 详细的日志将保存在 `logs/api_test_runner.log`

## 当前测试结果摘要

根据最近一次运行的结果：
- 总时间: 约48.8秒
- 总测试数: 6
- 通过: 6
- 失败: 0
- 跳过: 0
- 成功率: 100%

注意：虽然测试全部通过，但部分API调用存在认证相关错误（401 Unauthorized）和权限错误（403 Forbidden），这表明系统在认证和授权方面可能存在需要修复的问题。

## 日志级别

- INFO: 一般信息
- WARN: 警告信息
- ERROR: 错误信息
- DEBUG: 调试信息

## 系统要求

- Node.js >= 14.x
- 后端服务需在端口3000上运行