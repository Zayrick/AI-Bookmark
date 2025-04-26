# AI-Bookmark (AI书签助手)

基于 AI API 实现的智能自动分类书签 Chrome 浏览器扩展，能够自动将网站收藏到最适合的书签文件夹。

## ✨ 核心功能

- 🤖 智能分类：利用 AI API 分析网页标题和内容，自动匹配最合适的书签目录
- 🌐 右键收藏：一键自动收藏当前网页到最合适的目录位置
- 📝 智能标题：自动生成格式为"品牌 - 功能"的简洁书签标题
- 🔄 书签整理：利用 AI 自动查找重复、整理和优化现有书签
- ⚙️ 灵活配置：可自定义 API 接口地址、API KEY 和模型选择
- 📢 多种通知：支持系统通知和浏览器内通知两种方式
- 🔍 模型查询：支持查询 API 可用的 AI 模型列表

## 🔧 技术实现

- 使用 AI 函数调用能力，实现书签路径和标题的智能匹配
- 通过 Chrome 扩展 API 实现书签操作和上下文菜单功能
- 模块化设计，各个组件职责明确，易于维护和扩展
- 支持多种 OpenAI 兼容模型：包括 GPT-3.5、GPT-4 和 GPT-4o 等

## 📋 使用前提

- **科学上网**：需要能够访问 OpenAI API 或兼容 API
- **API KEY**：需要有效的 OpenAI 或其他兼容服务的 API 密钥
- **Chrome 浏览器**：建议使用最新版本的 Chrome 浏览器

## 🚀 安装步骤

1. 将本仓库克隆到本地：
   ```
   git clone https://github.com/Zayrick/AI-Bookmark.git
   ```

2. 进入项目目录：
   ```
   cd AI-Bookmark
   ```

3. 安装依赖并构建项目：
   ```
   npm install
   npm run build
   ```

4. 在 Chrome 浏览器地址栏输入 `chrome://extensions` 打开扩展管理页面

5. 开启右上角的"开发者模式"

6. 点击"加载已解压的扩展程序"按钮，选择克隆到本地的文件夹

7. 安装完成后，Chrome 浏览器右上角会出现扩展图标

## 🔍 使用方法

### 1. 配置扩展

点击浏览器右上角的扩展图标，配置以下信息：
- **API 地址**：AI API 地址（默认为 `https://api.openai.com/v1/chat/completions`）
- **API 密钥**：您的 API 密钥
- **AI 模型**：选择合适的模型（支持 gpt-3.5-turbo、gpt-4、gpt-4o 等）
- **通知方式**：选择系统通知或浏览器内通知
- **高级设置**：提供更多定制选项

![配置界面](/img/config.png)

### 2. 使用自动收藏功能

在任意网页上点击鼠标右键，选择"自动收藏"选项，扩展会自动分析网页标题和内容并将其保存到最合适的书签文件夹中。

![右键收藏使用演示](/img/use1.gif)

### 3. 从插件页面收藏

也可以通过插件弹出页面执行收藏操作。

![插件页面收藏使用演示](/img/use2.gif)

### 4. 查询可用模型

配置好API地址和API密钥后，可以搜索API支持的所有可用模型。

![可用模型搜索使用演示](/img/use3.gif)

### 5. 书签整理功能

通过插件弹出页面右上角的整理按钮，可以打开书签整理页面。

左侧显示书签树，支持搜索和选择
右侧是 AI 聊天界面，可以向 AI 助手提出各种书签整理需求
AI 可以帮助查找重复书签、移动书签到适合的文件夹、重命名书签、删除无用书签等

使用示例：
- "帮我查找所有重复的书签"
- "将所有编程类的书签整理到一个文件夹中"
- "帮我删除失效的网址"
- "将所有标题过长的书签重命名为更简洁的形式"

## 🛠️ 工作原理

1. 通过 Chrome API 获取用户现有的书签文件夹结构
2. 调用 AI API 分析网页标题和内容与现有书签文件夹的语义关系
3. 智能匹配最合适的书签目录并生成简洁的标题，自动完成收藏操作
4. 根据用户的设置显示收藏结果通知

## 🔄 开发说明

### 项目结构
```
├── public/                 # 公共资源目录
│   ├── assets/             # 图标等静态资源
│   ├── popup.html          # 扩展弹出页面
│   ├── manage.html         # 书签整理页面
│   └── settings.html       # 扩展设置页面
├── src/                    # 源代码目录
│   ├── background/         # 背景脚本
│   │   └── index.js        # 扩展的后台主脚本
│   ├── content/            # 内容脚本
│   │   ├── index.js        # 内容脚本入口
│   │   ├── dialog.js       # 对话框组件
│   │   └── notification.js # 通知组件
│   ├── manage/             # 书签整理页脚本
│   │   └── index.js        # 书签整理页入口
│   ├── popup/              # 弹出窗口脚本
│   │   └── index.js        # 设置界面脚本
│   ├── services/           # 服务层
│   │   ├── aiService.js    # AI API 调用服务
│   │   ├── dialogService.js# 对话框服务
│   │   └── notificationService.js # 通知服务
│   └── utils/              # 工具函数
│       ├── bookmarks.js    # 书签操作工具
│       ├── bookmarkTools.js# 书签整理工具函数
│       ├── constants.js    # 常量定义
│       ├── messaging.js    # 消息通信工具
│       ├── storage.js      # 存储操作工具
│       └── validation.js   # 数据验证工具
├── img/                    # 文档图片目录
├── dist/                   # 构建输出目录
├── manifest.json           # 扩展清单文件
├── package.json            # 项目配置文件
└── rollup.config.js        # 打包配置文件
```

### 构建项目
1. 安装项目依赖：
   ```
   npm install
   ```

2. 构建项目：
   ```
   npm run build
   ```

3. 开发模式（带热重载）：
   ```
   npm run dev
   ```

### 二次开发
如需进行二次开发，可参考：
- [Chrome 扩展开发文档](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world?hl=zh-cn)
- 调整 `src/utils/constants.js` 中的提示词可以优化分类效果和标题生成
- 新增功能可以在对应模块中进行扩展：
  - 修改 UI：编辑 `public/popup.html` 和 `public/settings.html`
  - 添加新服务：在 `src/services` 中创建服务模块
  - 自定义通知：修改 `src/services/notificationService.js`

## 📝 注意事项

- API 调用会消耗 API 点数，请合理使用
- 首次使用时请确保已正确配置 API 信息
- 如遇到收藏失败，请检查网络连接和 API KEY 是否有效
- 项目使用 ES Module 格式，确保浏览器支持该特性

## 📜 许可证

[MIT 许可证](LICENSE)
