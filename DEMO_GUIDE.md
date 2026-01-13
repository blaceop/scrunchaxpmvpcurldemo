# Scrunch AXP MVP - 演示指南

本文档旨在引导您如何启动、测试并理解这个“智能体体验平台（Scrunch AXP）”最小可行产品（MVP）的核心功能。

## 1. 项目目标

此MVP的核心目标是验证：**服务器可以从同一个URL (`/product/1`)，根据访问者的身份（人类或AI），返回两种完全不同格式的内容。**

-   **人类访问者**: 获得一个视觉丰富的、为浏览器优化的HTML网页。
-   **AI Agent访问者**: 获得一个结构化的、机器可读的JSON数据。

## 2. 如何启动服务

项目依赖于Node.js和Express。请确保您的环境中已安装Node.js。

**启动命令:**

在项目根目录下，打开终端并运行以下命令：

```bash
node server.js
```

成功启动后，您会看到如下提示，表示服务器正在本地3000端口上运行：

```
Scrunch AXP MVP server running at http://localhost:3000
Try accessing /product/1 with a browser.
Then try with curl: curl -H "User-Agent: ScrunchAXP-Agent/1.0" http://localhost:3000/product/1
```

## 3. 如何进行演示与测试

我们将使用`curl`工具来模拟不同的访问者。

### a. 模拟人类用户访问

这个命令模拟了普通浏览器发出的请求。由于没有提供特殊的`User-Agent`，服务器会将其识别为人类用户。

**执行命令:**

```bash
curl http://localhost:3000/product/1
```

**预期效果:**

您将会在终端看到返回的**完整的HTML代码**，与`index.html`文件的内容一致。这证明了服务器为人类用户提供了视觉页面。

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    ...
</head>
<body>
    <div class="header">
        <h1 class="product-name">Intelligent Content Adapter</h1>
        ...
    </div>
    ...
</body>
</html>
```

### b. 模拟AI Agent访问

这个命令通过`-H`参数手动指定了`User-Agent`头为`"ScrunchAXP-Agent/1.0"`。服务器中的代码会捕获并识别这个特殊的标识。

**执行命令:**

```bash
curl -H "User-Agent: ScrunchAXP-Agent/1.0" http://localhost:3000/product/1
```

**预期效果:**

这一次，您将看到返回的**纯JSON数据**，与`product-data.json`文件的内容一致。这证明了服务器在识别到AI Agent后，提供了为其优化的结构化数据。

```json
{
  "productId": "SXP-001",
  "productName": "Intelligent Content Adapter",
  "description": "A powerful module that dynamically transforms website content into structured, machine-readable data for AI agents and LLMs.",
  "price": {
    "amount": 499,
    "currency": "USD"
  },
  ...
}
```

## 4. 如何理解演示效果

这个演示清晰地展示了Scrunch AXP的核心价值：

-   **内容双轨制**: 同一个产品信息，存在两种表现形态（HTML和JSON）。
-   **身份识别与动态响应**: 服务器通过检查`User-Agent`，成功地区分了请求来源，并动态地返回了最合适的内容版本。
-   **对现有体验无影响**: 人类用户的浏览体验没有受到任何影响，他们仍然访问美观的网页。
-   **为AI提供“养料”**: AI Agent获得了它最需要的高质量、结构化数据，无需解析复杂的HTML，从而可以高效、准确地理解和调用企业内容。

这个MVP成功地将“为人类设计”和“为AI设计”的内容体系解耦，验证了Scrunch AXP的核心理念。
