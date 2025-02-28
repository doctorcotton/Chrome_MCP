/**
 * Chrome Console MCP Server (SSE版本)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SseServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";
import * as CDP from 'chrome-remote-interface';
import express from 'express';
import cors from 'cors';
import path from 'path';

// 创建Express应用
const app = express();
app.use(cors());

// 创建MCP服务器
const server = new McpServer({
  name: "chrome-console",
  version: "1.0.0",
  description: "访问Chrome浏览器控制台并执行JavaScript"
});

// 全局状态
let client: CDP.Client | undefined;
const consoleLogs: string[] = [];

/**
 * 确保已连接到Chrome
 * @returns {Promise<CDP.Client>} Chrome CDP客户端
 */
async function ensureClient(): Promise<CDP.Client> {
  if (!client) {
    try {
      client = await CDP();
      
      // 启用必要的域
      await client.Runtime.enable();
      await client.Console.enable();
      
      // 监听控制台消息
      client.Console.messageAdded(({ message }) => {
        const logEntry = `[${message.level}] ${message.text}`;
        consoleLogs.push(logEntry);
      });
      
      console.error("已成功连接到Chrome浏览器");
    } catch (error) {
      console.error("连接Chrome失败:", error);
      throw new Error("无法连接到Chrome浏览器。请确保Chrome已启动并开启了远程调试端口。");
    }
  }
  return client;
}

// 添加获取控制台日志工具
server.tool(
  "getConsoleLogs",
  {},
  async () => {
    try {
      await ensureClient();
      return {
        content: [{ 
          type: "text", 
          text: consoleLogs.length > 0 
            ? consoleLogs.join("\n") 
            : "没有控制台日志" 
        }]
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `错误: ${error.message}` }]
      };
    }
  }
);

// 添加执行JavaScript工具
server.tool(
  "executeJavaScript",
  { 
    script: z.string().describe("要执行的JavaScript代码") 
  },
  async ({ script }) => {
    try {
      const client = await ensureClient();
      const result = await client.Runtime.evaluate({
        expression: script,
        returnByValue: true
      });
      
      let responseText = "";
      
      if (result.exceptionDetails) {
        responseText = `执行错误: ${result.exceptionDetails.text}`;
      } else if (result.result) {
        if (result.result.type === 'undefined') {
          responseText = "执行成功，无返回值";
        } else {
          responseText = `结果 (${result.result.type}): ${result.result.value !== undefined ? JSON.stringify(result.result.value) : "null"}`;
        }
      }
      
      return {
        content: [{ type: "text", text: responseText }]
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `错误: ${error.message}` }]
      };
    }
  }
);

// 添加导航到URL工具
server.tool(
  "navigateTo",
  { 
    url: z.string().url().describe("要导航到的URL") 
  },
  async ({ url }) => {
    try {
      const client = await ensureClient();
      await client.Page.enable();
      await client.Page.navigate({ url });
      
      return {
        content: [{ type: "text", text: `已导航到 ${url}` }]
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `导航错误: ${error.message}` }]
      };
    }
  }
);

// 添加控制台日志资源
server.resource(
  "consoleLogs",
  "console://logs",
  async (uri) => ({
    contents: [{
      uri: uri.href,
      mimeType: "text/plain",
      text: consoleLogs.join("\n") || "没有控制台日志"
    }]
  })
);

// 启动服务器
async function runServer() {
  const port = process.env.PORT || 8000;  // 使用8000端口以匹配默认链接
  const transport = new SseServerTransport();
  
  // 将SSE端点添加到Express应用
  app.use('/mcp', transport.createExpressRouter());
  
  // 添加静态文件服务，以便可以访问 /static/index.html
  app.use('/static', express.static(path.join(__dirname, '../static')));
  
  // 添加重定向，从根路径到 /static/index.html
  app.get('/', (req, res) => {
    res.redirect('/static/index.html');
  });
  
  // 启动HTTP服务器
  app.listen(port, () => {
    console.error(`Chrome Console MCP服务器已启动，SSE端点: http://localhost:${port}/mcp`);
    console.error(`访问 http://localhost:${port}/static/index.html 查看控制台`);
  });
  
  await server.connect(transport);
}

runServer().catch(console.error); 