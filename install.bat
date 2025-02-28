@echo off
echo 正在创建Chrome Console MCP项目...

:: 创建项目目录
mkdir chrome-console-mcp
cd chrome-console-mcp

:: 下载项目文件
echo 正在下载项目文件...
curl -L -o main.zip https://github.com/doctorcotton/chrome-console-mcp/archive/refs/heads/main.zip
tar -xf main.zip
xcopy /E /Y chrome-console-mcp-main\* .
rmdir /S /Q chrome-console-mcp-main
del main.zip

:: 安装依赖
echo 正在安装依赖...
npm install

echo 安装完成！
echo 请运行 npm run setup 完成配置