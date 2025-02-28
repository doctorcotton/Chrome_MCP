# Chrome Console MCP服务器

这是一个MCP服务器，允许Claude访问本地Chrome浏览器的控制台信息并执行JavaScript代码。

## 快速开始

### 自动安装（推荐）

只需运行以下命令完成所有安装和配置：

```bash
npm run setup
```

然后按照屏幕上的说明操作。

### 手动安装

如果自动安装不起作用，请按照以下步骤手动安装：

1. 安装依赖：`npm install`
2. 构建项目：`npm run build`
3. 配置Claude Desktop（见下文）
4. 启动Chrome浏览器（见下文）
5. 启动MCP服务器：`npm start` 或 `npm run start:sse`（SSE模式）

## 使用方法

1. 启动Chrome浏览器（使用`start-chrome`脚本）
2. 启动MCP服务器：
   - 标准模式：使用`start-server`脚本
   - SSE模式：使用`start-server-sse`脚本
3. 如果使用SSE模式，可以访问 http://localhost:8000/static/index.html 查看控制台
4. 在Claude中使用以下命令：
   - 获取控制台日志：`请获取Chrome的控制台日志`
   - 执行JavaScript：`请在当前页面执行JavaScript代码：document.title`
   - 导航到URL：`请导航到 https://www.example.com`

## 连接模式

### 标准模式（stdio）

标准模式使用stdio与Claude Desktop通信，这是默认的连接方式。

### SSE模式

SSE模式使用Server-Sent Events与Claude Desktop通信，这种方式允许通过网络连接。

在Claude Desktop中添加SSE类型的MCP服务器时，使用以下URL：
```
http://localhost:8000/mcp
```

## 手动配置说明

### 配置Chrome浏览器

启动Chrome浏览器并开启远程调试：

```bash
# Windows
chrome.exe --remote-debugging-port=9222

# macOS
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222

# Linux
google-chrome --remote-debugging-port=9222
```

### 配置Claude Desktop

#### 标准模式（stdio）

编辑Claude Desktop配置文件：

* 在macOS上：`~/Library/Application Support/Claude/claude_desktop_config.json`
* 在Windows上：`%APPDATA%/Claude/claude_desktop_config.json`

添加以下配置：

```json
{
  "mcpServers": {
    "chrome-console": {
      "command": "node",
      "args": [
        "/path/to/mcp-server-chrome-console/build/index.js"
      ]
    }
  }
}
```

#### SSE模式

在Claude Desktop界面中，点击"Add MCP Server"按钮，然后：
1. 名称填写：`chrome-console-sse`
2. 类型选择：`sse`
3. 服务器URL填写：`http://localhost:8000/mcp`

## 调试

使用MCP Inspector进行调试：

```bash
npm run inspector
```

## 注意事项

1. 确保Chrome浏览器已启动并开启了远程调试端口
2. 此MCP服务器仅适用于本地开发和测试，不建议在生产环境中使用
3. 执行JavaScript代码时要小心，避免执行可能导致安全问题的代码

## 技术说明

此MCP服务器使用以下技术：

* **Model Context Protocol (MCP)** - 用于与Claude等AI助手通信的协议
* **Chrome DevTools Protocol (CDP)** - 用于与Chrome浏览器通信的协议
* **TypeScript** - 提供类型安全的JavaScript超集
* **Node.js** - 运行时环境
* **Express** - 用于SSE模式的Web服务器

## 许可证

MIT

## 一键安装

Windows用户可以下载并运行[install.bat](https://raw.githubusercontent.com/doctorcotton/chrome-console-mcp/main/install.bat)脚本：

```
curl -O https://raw.githubusercontent.com/doctorcotton/chrome-console-mcp/main/install.bat
install.bat
```

macOS/Linux用户可以运行以下命令：

```bash
curl -L https://github.com/doctorcotton/chrome-console-mcp/archive/refs/heads/main.tar.gz | tar xz
cd chrome-console-mcp-main
npm install
npm run setup
```