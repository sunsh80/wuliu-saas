# 项目锚点说明

## Git 标签锚点
- **标签名称**: `map-integration-baseline`
- **提交哈希**: `89418da214a5ff81284909344a7c6ffb88e8ef9b`
- **创建时间**: 2026年2月15日
- **目的**: 第三方地图服务集成开发的基线锚点

## 回滚方法
如果需要回滚到此锚点，可以使用以下命令之一：

```bash
# 方法1: 切换到带标签的提交（推荐用于查看或从这里开始新分支）
git checkout map-integration-baseline

# 方法2: 将当前分支重置到此提交（谨慎使用，会丢失后续更改）
git reset --hard map-integration-baseline

# 方法3: 基于此标签创建新分支
git checkout -b map-development map-integration-baseline
```

## 包含的文件更改
- 更新了 `backend/openapi.yaml` 以包含地图服务API
- 创建了 `backend/openapi.yaml.before-map-dev` 作为备份
- 添加了 `docs/map_api_development_plan.md` 开发计划
- 添加了 `docs/third_party_map_integration.md` 集成文档