```
wuliu_project/
├── .ai-config.json                          # AI配置文件
├── .gitignore                              # Git忽略文件配置
├── ai-comment-guidelines.md                 # AI注释指南文档
├── ai-development-workflow.md               # AI开发工作流文档
├── AUTO_PUSH_README.md                      # 自动推送说明文档
├── auto_push_simple.bat                     # 简化版自动推送批处理脚本
├── auto_push_v2.bat                         # 自动推送V2版批处理脚本
├── auto_push.bat                            # 自动推送批处理脚本
├── auto_push.ps1                            # 自动推送PowerShell脚本
├── backend/                                 # 后端服务目录
│   ├── .env                                 # 环境变量配置文件
│   ├── api/                                 # API接口定义目录
│   │   └── handlers/                        # API处理器目录
│   │       ├── admin/                       # 管理员相关接口
│   │       │   ├── auth/                    # 认证相关接口
│   │       │   ├── order/                   # 订单管理接口
│   │       │   ├── tenant-management/       # 租户管理接口
│   │       │   ├── tenants/                 # 租户审批接口
│   │       │   └── user/                    # 用户管理接口
│   │       ├── carrier/                     # 承运商相关接口
│   │       │   └── order/                   # 承运商订单接口
│   │       ├── customer/                    # 客户相关接口
│   │       │   └── order/                   # 客户订单接口
│   │       ├── public/                      # 公共接口
│   │       ├── setup/                       # 初始化设置接口
│   │       ├── tenant/                      # 租户接口
│   │       └── tenant-web/                  # 租户网站接口
│   │           └── order/                   # 租户网站订单接口
│   ├── config/                              # 配置文件目录
│   ├── data/                                # 数据文件目录
│   │   └── mydatabase.db                    # SQLite数据库文件
│   ├── db/                                  # 数据库相关目录
│   │   ├── migrations/                      # 数据库迁移文件
│   │   └── models/                          # 数据模型定义
│   ├── middleware/                          # 中间件目录
│   ├── node_modules/                        # Node.js依赖包目录
│   ├── openapi.yaml                         # OpenAPI规范文件
│   ├── package.json                         # Node.js项目配置文件
│   ├── server.js                            # 后端服务器主入口文件
│   ├── services/                            # 业务服务目录
│   ├── utils/                               # 工具函数目录
│   └── validate-openapi.js                  # OpenAPI验证脚本
├── check_and_start_redis.bat                # 检查并启动Redis批处理脚本
├── check-api-naming-consistency.js          # API命名一致性检查脚本
├── check-consistency.js                     # 一致性检查脚本
├── CLEANUP_REPORT.md                        # 清理报告文档
├── code-generation-template.hbs             # 代码生成模板文件
├── CONFIG_INFO.md                           # 配置信息文档
├── db-field-mapping.json                    # 数据库字段映射文件
├── digttal-twin.html                        # 数字孪生演示页面
├── docs/                                    # 文档目录
│   ├── API_INTEGRATION_GUIDE.md             # API集成指南
│   ├── API_TESTING_README.md                # API测试说明
│   ├── api-validation-checklist-v1.csv      # API验证清单CSV文件
│   ├── FIX_SUMMARY.md                       # 修复总结文档
│   ├── HANDLER_MAPPING.md                   # 处理器映射文档
│   ├── PC_FRONTEND_DESIGN.md                # PC前端设计文档
│   ├── WX_PROGRAM_API_INTEGRATION.md        # 微信小程序API集成文档
│   └── WX_PROGRAM_DESIGN.md                 # 微信小程序设计文档
├── fix_openapi.js                           # OpenAPI修复脚本
├── install_and_start_redis.ps1              # 安装并启动Redis PowerShell脚本
├── install_redis_en.ps1                     # 英文版安装Redis PowerShell脚本
├── install_redis_fixed.ps1                  # 修复版安装Redis PowerShell脚本
├── install_redis.bat                        # 安装Redis批处理脚本
├── itisok/                                  # 状态检查目录
│   └── ok.js                                # 状态检查脚本
├── launch_scripts_manager.bat               # 启动脚本管理器批处理脚本
├── launch_scripts_manager.ps1               # 启动脚本管理器PowerShell脚本
├── logs/                                    # 日志目录
├── nodemon.json                             # Nodemon配置文件
├── node_modules/                            # Node.js依赖包目录
├── open_scripts_folder.bat                  # 打开脚本文件夹批处理脚本
├── package.json                             # 项目配置文件
├── project_presentation.html                # 项目展示页面
├── PROJECT_STRUCTURE.md                     # 项目结构文档
├── PROJECT_SUMMARY.md                       # 项目总结文档
├── project-structure.md                     # 项目结构文档（副本）
├── project.config.json                      # 项目配置文件
├── README.md                                # 项目说明文档
├── scripts/                                 # 脚本目录
│   ├── check_status.bat                     # 检查状态批处理脚本
│   ├── check-handler-duplicates.cjs         # 检查处理器重复项脚本
│   ├── fix-empty-handlers.js                # 修复空处理器脚本
│   ├── full_stack_start_fixed.ps1           # 修复版全栈启动PowerShell脚本
│   ├── full_stack_start.bat                 # 全栈启动批处理脚本
│   ├── full_stack_start.ps1                 # 全栈启动PowerShell脚本
│   ├── generate-handler-map.js              # 生成处理器映射脚本
│   ├── quick_full_stack_start.bat           # 快速全栈启动批处理脚本
│   ├── quick_start.bat                      # 快速启动批处理脚本
│   ├── simple_backend_start.bat             # 简单后端启动批处理脚本
│   ├── start_all_services.bat               # 启动所有服务批处理脚本
│   ├── start_all_services.ps1               # 启动所有服务PowerShell脚本
│   └── START_SCRIPTS_README.md              # 启动脚本说明文档
├── setup_schedule.bat                       # 设置计划任务批处理脚本
├── setup-docs.bat                           # 设置文档批处理脚本
├── start_redis_linux.sh                     # Linux下启动Redis脚本
├── swaggerDef.js                            # Swagger定义文件
├── tenant-web/                              # 租户网站前端目录
│   ├── .gitignore                           # Git忽略文件配置
│   ├── index.html                           # 主页面文件
│   ├── jsconfig.json                        # JavaScript配置文件
│   ├── package.json                         # Node.js项目配置文件
│   ├── README.md                            # 租户网站说明文档
│   ├── src/                                 # 源代码目录
│   │   ├── assets/                          # 静态资源目录
│   │   │   ├── base.css                     # 基础样式文件
│   │   │   ├── logo.svg                     # Logo文件
│   │   │   └── main.css                     # 主样式文件
│   │   ├── components/                      # 组件目录
│   │   │   ├── HelloWord.vue                # 示例组件
│   │   │   ├── TheWelcome.vue               # 欢迎组件
│   │   │   └── WelcomeItem.vue              # 欢迎项目组件
│   │   └── main.js                          # 主入口文件
│   └── vite.config.js                       # Vite配置文件
├── validation-metadata.json                 # 验证元数据文件
├── validation-rules.js                      # 验证规则脚本
├── validation-spec.md                       # 验证规范文档
├── web/                                     # Web前端目录
│   ├── admin-web/                           # 管理员网站前端
│   ├── customer-web/                        # 客户网站前端
│   └── tenant-web/                          # 租户网站前端
└── wx-program/                              # 微信小程序目录
    ├── app.js                               # 小程序逻辑文件
    ├── app.json                             # 小程序配置文件
    ├── app.wxss                             # 小程序全局样式文件
    ├── assets/                              # 静态资源目录
    │   └── icons/                           # 图标目录
    │       ├── home-active.png              # 激活状态首页图标
    │       ├── home.png                     # 首页图标
    │       ├── my-active.png                # 激活状态我的图标
    │       ├── my.png                       # 我的图标
    │       ├── order-active.png             # 激活状态订单图标
    │       └── order.png                    # 订单图标
    ├── pages/                               # 页面目录
    │   ├── company-register/                # 公司注册页面
    │   ├── index/                           # 首页
    │   ├── login/                           # 登录页面
    │   ├── logs/                            # 日志页面
    │   ├── my/                              # 我的页面
    │   ├── order/                           # 订单页面
    │   ├── orderComparison/                 # 订单对比页面
    │   ├── orderList/                       # 订单列表页面
    │   ├── orderStatus/                     # 订单状态页面
    │   └── orderTrack/                      # 订单跟踪页面
    ├── project.config.json                  # 项目配置文件
    └── utils/                               # 工具函数目录
        └── validation-rules.js              # 验证规则脚本
```