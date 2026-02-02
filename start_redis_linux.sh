#!/bin/bash
# Linux/Mac 启动脚本 (供参考)

# 检查是否安装了Redis
if ! command -v redis-server &> /dev/null; then
    echo "Redis未安装，正在尝试安装..."
    
    # Ubuntu/Debian
    if command -v apt-get &> /dev/null; then
        sudo apt-get update
        sudo apt-get install redis-server
    # CentOS/RHEL/Fedora
    elif command -v yum &> /dev/null; then
        sudo yum install epel-release
        sudo yum install redis
    # macOS
    elif command -v brew &> /dev/null; then
        brew install redis
    else
        echo "无法自动安装Redis，请手动安装"
        exit 1
    fi
fi

# 启动Redis服务
sudo systemctl start redis
sudo systemctl enable redis

echo "Redis服务已启动并设置为开机自启"