/**
 * Chrome Console MCP 一键安装脚本
 * 
 * 此脚本自动完成MCP服务器的安装和配置
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { exec } from 'child_process';

/**
 * 获取Claude配置文件路径
 * @returns {string} 配置文件路径
 */
function getClaudeConfigPath(): string {
  const homedir = os.homedir();
  
  if (process.platform === 'darwin') { // macOS
    return path.join(homedir, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
  } else if (process.platform === 'win32') { // Windows
    return path.join(process.env.APPDATA || '', 'Claude', 'claude_desktop_config.json');
  } else { // Linux
    return path.join(homedir, '.config', 'Claude', 'claude_desktop_config.json');
  }
}

/**
 * 更新Claude配置文件
 */
function updateClaudeConfig() {
  const configPath = getClaudeConfigPath();
  const currentDir = process.cwd();
  const serverPath = path.join(currentDir, 'build', 'index.js');
  
  console.log('正在更新Claude配置...');
  
  try {
    let config = {};
    
    // 如果配置文件存在，读取现有配置
    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, 'utf8');
      config = JSON.parse(configContent);
    }
    
    // 添加或更新MCP服务器配置
    config.mcpServers = config.mcpServers || {};
    config.mcpServers['chrome-console'] = {
      command: 'node',
      args: [serverPath]
    };
    
    // 创建目录（如果不存在）
    const configDir = path.dirname(configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    // 写入更新后的配置
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(`Claude配置已更新: ${configPath}`);
  } catch (error) {
    console.error('更新Claude配置失败:', error);
    console.log('请手动更新Claude配置文件。');
  }
}

/**
 * 创建启动Chrome的脚本
 */
function createChromeStartScript() {
  console.log('正在创建Chrome启动脚本...');
  
  const scriptContent = process.platform === 'win32' 
    ? '@echo off\nstart chrome.exe --remote-debugging-port=9222'
    : '#!/bin/bash\n\nif [ "$(uname)" == "Darwin" ]; then\n  # macOS\n  /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=9222\nelse\n  # Linux\n  google-chrome --remote-debugging-port=9222\nfi';
  
  const scriptFileName = process.platform === 'win32' ? 'start-chrome.bat' : 'start-chrome.sh';
  const scriptPath = path.join(process.cwd(), scriptFileName);
  
  fs.writeFileSync(scriptPath, scriptContent);
  
  if (process.platform !== 'win32') {
    fs.chmodSync(scriptPath, '755'); // 使脚本可执行
  }
  
  console.log(`Chrome启动脚本已创建: ${scriptPath}`);
}

/**
 * 创建启动MCP服务器的脚本
 */
function createServerStartScript() {
  console.log('正在创建MCP服务器启动脚本...');
  
  const scriptContent = process.platform === 'win32'
    ? '@echo off\nnode build/index.js'
    : '#!/bin/bash\n\nnode build/index.js';
  
  const scriptFileName = process.platform === 'win32' ? 'start-server.bat' : 'start-server.sh';
  const scriptPath = path.join(process.cwd(), scriptFileName);
  
  fs.writeFileSync(scriptPath, scriptContent);
  
  if (process.platform !== 'win32') {
    fs.chmodSync(scriptPath, '755'); // 使脚本可执行
  }
  
  console.log(`MCP服务器启动脚本已创建: ${scriptPath}`);
}

/**
 * 创建静态HTML页面
 */
function createStaticHtml() {
  console.log('正在创建静态HTML页面...');
  
  // 创建静态目录
  const staticDir = path.join(process.cwd(), 'static');
  if (!fs.existsSync(staticDir)) {
    fs.mkdirSync(staticDir, { recursive: true });
  }
  
  // 创建简单的HTML页面
  const htmlContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chrome Console MCP</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      line-height: 1.6;
    }
    h1 {
      color: #333;
      border-bottom: 1px solid #eee;
      padding-bottom: 10px;
    }
    .card {
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 15px;
      margin-bottom: 20px;
      background-color: #f9f9f9;
    }
    code {
      background-color: #f0f0f0;
      padding: 2px 4px;
      border-radius: 3px;
      font-family: monospace;
    }
    .success {
      color: green;
    }
    .error {
      color: red;
    }
  </style>
</head>
<body>
  <h1>Chrome Console MCP 服务器</h1>
  
  <div class="card">
    <h2>服务器状态</h2>
    <p id="status">正在检查服务器状态...</p>
  </div>
  
  <div class="card">
    <h2>MCP端点</h2>
    <p>SSE端点: <code>http://localhost:8000/mcp</code></p>
    <p>在Claude Desktop中添加此MCP服务器时，请使用上述URL。</p>
  </div>
  
  <div class="card">
    <h2>控制台日志</h2>
    <pre id="logs">暂无日志</pre>
    <button id="refresh">刷新日志</button>
  </div>
  
  <div class="card">
    <h2>执行JavaScript</h2>
    <textarea id="code" rows="5" style="width: 100%">document.title</textarea>
    <button id="execute">执行</button>
    <pre id="result"></pre>
  </div>
  
  <script>
    // 检查服务器状态
    fetch('/mcp')
      .then(response => {
        if (response.ok) {
          document.getElementById('status').innerHTML = '<span class="success">服务器运行中</span>';
        } else {
          throw new Error('服务器未响应');
        }
      })
      .catch(error => {
        document.getElementById('status').innerHTML = '<span class="error">服务器未响应: ' + error.message + '</span>';
      });
    
    // 刷新日志
    document.getElementById('refresh').addEventListener('click', () => {
      fetch('/mcp/tool/getConsoleLogs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      })
      .then(response => response.json())
      .then(data => {
        if (data.content && data.content[0] && data.content[0].text) {
          document.getElementById('logs').textContent = data.content[0].text;
        } else {
          document.getElementById('logs').textContent = '没有日志';
        }
      })
      .catch(error => {
        document.getElementById('logs').textContent = '获取日志失败: ' + error.message;
      });
    });
    
    // 执行JavaScript
    document.getElementById('execute').addEventListener('click', () => {
      const code = document.getElementById('code').value;
      fetch('/mcp/tool/executeJavaScript', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ script: code })
      })
      .then(response => response.json())
      .then(data => {
        if (data.content && data.content[0] && data.content[0].text) {
          document.getElementById('result').textContent = data.content[0].text;
        } else {
          document.getElementById('result').textContent = '无结果';
        }
      })
      .catch(error => {
        document.getElementById('result').textContent = '执行失败: ' + error.message;
      });
    });
  </script>
</body>
</html>
  `;
  
  fs.writeFileSync(path.join(staticDir, 'index.html'), htmlContent);
  console.log(`静态HTML页面已创建: ${path.join(staticDir, 'index.html')}`);
}

/**
 * 创建SSE版本的启动脚本
 */
function createSseServerStartScript() {
  console.log('正在创建SSE版本的MCP服务器启动脚本...');
  
  const scriptContent = process.platform === 'win32'
    ? '@echo off\nnode build/index-sse.js'
    : '#!/bin/bash\n\nnode build/index-sse.js';
  
  const scriptFileName = process.platform === 'win32' ? 'start-server-sse.bat' : 'start-server-sse.sh';
  const scriptPath = path.join(process.cwd(), scriptFileName);
  
  fs.writeFileSync(scriptPath, scriptContent);
  
  if (process.platform !== 'win32') {
    fs.chmodSync(scriptPath, '755'); // 使脚本可执行
  }
  
  console.log(`SSE版本的MCP服务器启动脚本已创建: ${scriptPath}`);
}

/**
 * 主函数
 */
async function main() {
  console.log('开始安装Chrome Console MCP服务器...');
  
  // 构建项目
  console.log('正在构建项目...');
  exec('npm run build', (error) => {
    if (error) {
      console.error('构建失败:', error);
      return;
    }
    
    console.log('项目构建成功');
    
    // 更新Claude配置
    updateClaudeConfig();
    
    // 创建启动脚本
    createChromeStartScript();
    createServerStartScript();
    createSseServerStartScript();
    
    // 创建静态HTML页面
    createStaticHtml();
    
    console.log('\n安装完成！');
    console.log('\n使用说明:');
    console.log('1. 运行 start-chrome 脚本启动Chrome浏览器');
    console.log('2a. 运行 start-server 脚本启动标准MCP服务器');
    console.log('2b. 或运行 start-server-sse 脚本启动SSE版本的MCP服务器');
    console.log('3. 如果使用SSE版本，可以访问 http://localhost:8000/static/index.html 查看控制台');
    console.log('4. 重启Claude Desktop应用');
    console.log('5. 在Claude中使用Chrome控制台功能');
  });
}

main().catch(console.error); 