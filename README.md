# Scrunch AXP 通用数据生成引擎

一个配置驱动的通用内容提取和结构化数据生成系统，能够将各种网站的内容转换为标准化的AXP（AI eXtended Protocol）格式，为AI代理提供高质量的结构化数据。

## 项目简介

Scrunch AXP 是一个创新的内容提取和数据转换引擎，旨在解决AI代理访问和理解传统网页内容的挑战。通过双轨内容分发机制，系统能够同时服务于人类用户和AI代理，提供最适合各自需求的内容格式。

### 核心理念
- **内容结构化**：将非结构化网页内容转换为标准化数据模型
- **双轨分发**：为人类用户提供HTML界面，为AI代理提供JSON数据
- **配置驱动**：通过配置文件支持多种网站，无需修改代码
- **可扩展性**：模块化设计，易于添加新的网站支持

## 架构概览

```
scrapers/
├── configurations/
│   └── bilibili.json      # B站抓取配置
├── generic-scraper.js     # 通用抓取器
├── ...
server.js                 # 主服务入口
├── /axp                  # 通用AXP端点
├── /video/:videoId       # 兼容端点
└── ...
```

## 核心功能

### 1. 通用AXP端点
- **路径**: `/axp?url=<target-url>`
- **功能**: 根据URL自动识别网站类型并提取结构化数据
- **响应**: AI代理获取JSON数据，人类用户获取HTML页面

### 2. 配置驱动抓取
- **站点识别**: 自动识别URL所属网站
- **配置加载**: 动态加载对应站点的抓取配置
- **规则执行**: 根据配置执行特定的抓取和解析规则

### 3. 双轨内容分发
- **AI代理识别**: 通过User-Agent检测AI代理请求
- **差异化响应**: 
  - AI代理 → 结构化JSON数据
  - 人类用户 → 渲染的HTML页面

### 4. 数据标准化
- **统一格式**: 将各网站数据转换为标准的VideoObject格式
- **字段映射**: 通过配置文件定义数据映射规则
- **质量保证**: 确保输出数据的一致性和准确性

## 技术特性

### 通用抓取器
- **DOM解析**: 使用Cheerio进行高效的DOM操作
- **JavaScript变量提取**: 从页面JavaScript变量中获取数据
- **API集成**: 支持调用网站API获取结构化数据
- **错误处理**: 完善的异常处理和错误恢复机制

### 配置管理系统
- **模块化配置**: 每个网站独立的配置文件
- **选择器规则**: 支持CSS选择器和复合选择器
- **数据映射**: 灵活的字段映射和转换规则
- **输出模板**: 标准化的数据输出格式定义

## 技术栈选择说明

### 选择 Node.js + Express 的原因

1. **生态系统成熟**: Node.js 拥有丰富的包管理和庞大的社区支持，对于网络抓取、DOM解析等任务有成熟的解决方案（如 axios、cheerio）。

2. **异步处理能力强**: Node.js 的事件驱动和非阻塞 I/O 模型非常适合处理大量的网络请求，这对于抓取任务至关重要。

3. **JavaScript 同构优势**: 由于抓取的目标网站也是 JavaScript，使用 Node.js 可以更容易处理 JavaScript 变量和动态内容。

4. **快速原型开发**: Node.js + Express 使得快速搭建和迭代成为可能，非常适合 MVP 阶段的项目。

5. **前后端一致性**: 如果将来需要开发配套的前端界面，团队只需要掌握 JavaScript 生态，降低了学习成本。

### 生产环境适用性分析

#### 适合生产的原因：
- **轻量级**: Express 框架轻量且高效，资源消耗相对较低
- **可扩展**: 模块化架构便于水平扩展和维护
- **社区支持**: 大量开源组件和解决方案，遇到问题容易找到解决方案
- **容器友好**: 易于 Docker 化部署，适合现代云原生架构

#### 不适合生产的原因：
- **单线程限制**: Node.js 的单线程事件循环在处理 CPU 密集型任务时可能存在瓶颈，对于复杂的视频内容分析可能不够高效
- **内存管理**: 长时间运行的抓取任务可能导致内存泄漏，需要仔细管理
- **并发限制**: 虽然异步 I/O 强大，但在高并发场景下可能不如 Go 或 Rust 等语言表现优异
- **JavaScript 精度问题**: 对于需要高精度计算的场景，JavaScript 的数值处理可能不够精确

### 替代技术栈考虑

如果项目进入大规模生产阶段，可以考虑以下替代方案：

- **Go**: 高并发、高性能，内存占用小，适合大规模抓取任务
- **Python + Scrapy/FastAPI**: 强大的数据处理能力，丰富的科学计算库，适合复杂内容分析
- **Java/Spring Boot**: 企业级稳定性，强大的错误处理和监控能力，适合关键业务场景
- **Bun/Deno**: 更现代的 JavaScript 运行时，可能提供更好的性能和开发体验

当前的技术栈在 MVP 阶段是合适的，但在未来的生产部署中，可能需要根据具体的性能要求和扩展需求进行调整。

## 支持的网站

### 当前支持
- **Bilibili**: 视频页面内容提取
  - 视频标题、UP主信息、播放统计
  - 标签、描述、发布时间等元数据

### 扩展支持
系统设计支持轻松添加新网站：
1. 创建新的配置文件
2. 定义选择器和数据映射规则
3. 系统自动识别并应用新配置

## 快速开始

### 环境要求
- Node.js 18+
- npm 或 yarn

### 安装
```bash
# 克隆项目
git clone <repository-url>
cd scrunchaxp

# 安装依赖
npm install
```

### 启动服务
```bash
npm start
# 或
node server.js
```

服务将在 `http://localhost:3000` 启动

### 使用示例

#### 1. 通用AXP端点
```bash
# 为AI代理获取结构化数据
curl -H "User-Agent: ScrunchAXP-Agent/1.0" \
     "http://localhost:3000/axp?url=https://www.bilibili.com/video/BV1xxx"

# 为人类用户获取HTML页面
curl "http://localhost:3000/axp?url=https://www.bilibili.com/video/BV1xxx"
```

#### 2. 兼容端点
```bash
# B站视频ID访问
curl "http://localhost:3000/video/BV1xxx"
```

## 配置文件详解

### 配置文件结构
```json
{
  "siteName": "bilibili",
  "domain": "www.bilibili.com",
  "selectors": {
    "title": "h1.video-title, #viewbox_report h1",
    "upMain": {
      "name": ".up-info .name, .up-name"
    }
  },
  "dataMapping": {
    "title": "title",
    "upMain.name": "owner.name || author.name"
  },
  "convertToSchema": {
    "content_type": "video",
    "title": "{{title}}",
    "up_main": {
      "name": "{{upMain.name}}"
    }
  }
}
```

### 配置项说明
- `siteName`: 网站名称标识
- `domain`: 网站域名
- `selectors`: CSS选择器规则定义
- `dataMapping`: 原始数据到输出字段的映射
- `convertToSchema`: 输出数据的标准格式

## 扩展开发

### 添加新网站支持
1. 在 `scrapers/configurations/` 目录下创建新的配置文件
2. 定义该网站的抓取规则和数据映射
3. 重启服务即可生效

### 自定义抓取规则
- `selectors`: 定义如何从DOM中提取数据
- `scriptSelectors`: 定义如何从JavaScript变量中提取数据
- `apiEndpoints`: 定义如何调用API获取数据

## API参考

### 端点列表
| 端点 | 方法 | 描述 |
|------|------|------|
| `/axp` | GET | 通用AXP端点，需提供url参数 |
| `/video/:videoId` | GET | 兼容端点，支持视频ID访问 |

### 请求参数
- `url` (GET /axp): 目标网站URL

### 响应格式
- **AI代理响应**: JSON格式的结构化数据
- **人类用户响应**: HTML格式的渲染页面

## 测试

运行内置测试套件：
```bash
node test_server.js
```

测试包括：
- 端点可用性
- 用户代理检测
- 响应格式验证
- 错误处理

## 项目结构

```
.
├── server.js              # 主服务文件
├── test_server.js         # 测试套件
├── config.json            # 配置文件
├── video-data.json        # 示例数据
├── views/
│   └── video.ejs          # 视频页面模板
├── scrapers/              # 抓取器模块
│   ├── configurations/    # 网站配置文件
│   │   └── bilibili.json
│   └── generic-scraper.js # 通用抓取器
├── docs/                  # 文档
│   ├── 重构完成报告.md
│   ├── DEMO_GUIDE.md
│   └── MVP_PLAN.md
└── package.json           # 依赖管理
```

## 贡献指南

### 开发环境设置
1. Fork 项目仓库
2. 克隆到本地
3. 安装依赖
4. 创建特性分支

### 代码规范
- 使用ESLint进行代码检查
- 遵循JavaScript标准编码规范
- 添加适当的注释和文档

## 未来规划

### 短期目标
- 支持更多主流网站（YouTube, Vimeo等）
- 实现配置热更新
- 添加缓存机制提升性能

### 长期愿景
- 建立完整的AXP生态系统
- 提供可视化配置工具
- 支持自定义数据模型
- 集成机器学习进行智能内容识别

## 许可证

本项目采用 ISC 许可证。

## 致谢

感谢所有为该项目做出贡献的开发者和测试人员。

---

**注意**: 这是一个实验性质的项目，用于演示AXP概念的可行性。在生产环境中使用前，请确保遵守相关网站的服务条款和法律法规。