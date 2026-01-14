# Scrunch AXP MVP - Bilibili 演示指南

本文档旨在引导您如何启动、测试并理解这个已适配为**Bilibili视频页场景**的MVP。

## 1. 项目目标

此MVP的核心目标是模拟并验证：**服务器可以从同一个URL (`/video/BV1xx411c7mZ`)，根据访问者的身份，返回两种完全不同但数据同源的内容。**

-   **人类访问者**: 获得一个模仿B站风格的、动态渲染的HTML网页。
-   **AI Agent访问者**: 获得一个包含该视频完整信息的、结构化的JSON数据。

## 2. 如何启动服务

**启动命令:**

```bash
node server.js
```

成功启动后，您会看到如下提示，指导您进行测试：

```
Scrunch AXP (Bilibili Demo) server running at http://localhost:3000
Try accessing /video/BV1xx411c7mZ with a browser.
Then try with curl: curl -H "User-Agent: ScrunchAXP-Agent/1.0" http://localhost:3000/video/BV1xx411c7mZ
```

## 3. 如何进行演示与测试

### a. 模拟人类用户访问

**执行命令:**

在您的**浏览器**中打开 `http://localhost:3000/video/BV1xx411c7mZ`。

**预期效果:**

您将看到一个**模仿B站视频页的网页**，其中包含了标题、UP主、播放量等信息。这些信息都是从`video-data.json`动态渲染出来的。

### b. 模拟AI Agent访问

**执行命令:**

```bash
curl -H "User-Agent: ScrunchAXP-Agent/1.0" http://localhost:3000/video/BV1xx411c7mZ
```

**预期效果:**

终端将返回`video-data.json`文件中的**完整JSON内容**。同时，在运行服务器的终端上，您会看到一条将`visitorType`正确判断为`"AI Agent"`的日志。

### c. 验证动态渲染

这是体验“单一数据源”威力的关键步骤：

1.  **修改数据**: 打开 `video-data.json` 文件。将 `"play_count"` 的值从 `356000` 修改为一个新数字，例如 `500000`。
2.  **重启服务**: 在服务器终端，按 `Ctrl+C` 停止服务，然后再次运行 `node server.js`。
3.  **验证变化**: 在浏览器中刷新 `http://localhost:3000/video/BV1xx411c7mZ` 页面。您会看到页面上显示的播放量已经自动更新为您修改后的数字。

## 4. 总结

这个经过改造的MVP成功地将您为B站设计的适配方案，以一个可运行、可感知的实例呈现了出来。它具体地展示了如何从一个复杂UGC页面中提取核心数据，并为AI和人类提供同源但不同形态的、一致的内容体验。
