# MdToMp - Obsidian笔记转微信公众号工具集 / Obsidian to WeChat Official Account Tool Suite

一个完整的Obsidian笔记到微信公众号的转换和发布工具集，包含Obsidian插件和Python工具两种使用方式。

A complete toolkit for converting and publishing Obsidian Markdown notes to WeChat Official Accounts, including both an Obsidian plugin and Python tools.

---

## 项目简介 / Project Introduction

MdToMp提供了一套完整的解决方案，帮助用户将Obsidian中的Markdown笔记转换并发布到微信公众号。项目包含两个独立但功能互补的工具：

MdToMp provides a complete solution to help users convert and publish Markdown notes from Obsidian to WeChat Official Accounts. The project includes two independent but complementary tools:

- **Obsidian插件**：集成在Obsidian中的插件，提供图形化界面和实时预览
- **Python工具**：命令行工具，适合批量处理和自动化脚本

- **Obsidian Plugin**: Integrated plugin in Obsidian with graphical interface and real-time preview
- **Python Tools**: Command-line tools suitable for batch processing and automation scripts

---

## 功能特性 / Features

### Obsidian插件功能 / Obsidian Plugin Features

- 📝 **Markdown转HTML**：将Markdown格式转换为微信公众号支持的HTML格式
- 👁️ **实时预览**：在Obsidian中预览微信公众号格式的渲染效果
- 📤 **上传草稿箱**：一键上传到微信公众号草稿箱
- 🚀 **直接发布**：支持直接发布到微信公众号
- 🖼️ **图片支持**：自动上传本地图片到微信服务器
- 🎨 **样式美化**：自动应用微信公众号风格的样式
- 🔒 **安全防护**：内置XSS防护，过滤危险标签和属性
- 🌐 **网络测试**：测试网络连接和API密钥有效性
- ✨ **一键排版**：支持多种排版选项，包括段落间距、标题格式、图片优化、引用样式、代码块美化、列表格式优化、取消多余换行
- 📋 **内容管理**：查看和管理草稿箱、已发布文章列表
- 🗑️ **删除功能**：删除草稿或已发布文章

- 📝 **Markdown to HTML**: Convert Markdown format to WeChat Official Account compatible HTML
- 👁️ **Real-time Preview**: Preview WeChat Official Account rendering effects in Obsidian
- 📤 **Upload to Drafts**: One-click upload to WeChat Official Account drafts
- 🚀 **Direct Publishing**: Support direct publishing to WeChat Official Account
- 🖼️ **Image Support**: Automatically upload local images to WeChat server
- 🎨 **Style Beautification**: Automatically apply WeChat Official Account style
- 🔒 **Security Protection**: Built-in XSS protection, filtering dangerous tags and attributes
- 🌐 **Network Testing**: Test network connection and API key validity
- ✨ **One-Click Formatting**: Support multiple formatting options including paragraph spacing, heading unification, image optimization, quote styling, code block beautification, list formatting, and removing extra line breaks
- 📋 **Content Management**: View and manage drafts and published articles lists
- 🗑️ **Delete Function**: Delete drafts or published articles

### Python工具功能 / Python Tools Features

- 🔄 **批量转换**：支持批量处理多个Markdown文件
- 📋 **命令行操作**：适合脚本和自动化场景
- 🖼️ **图片上传**：自动处理本地图片上传
- 🧪 **测试工具**：提供Token测试和功能验证工具

- 🔄 **Batch Conversion**: Support batch processing of multiple Markdown files
- 📋 **Command-line Operation**: Suitable for scripting and automation scenarios
- 🖼️ **Image Upload**: Automatically handle local image uploads
- 🧪 **Testing Tools**: Provide Token testing and functionality verification tools

---

## 项目结构 / Project Structure

```
OpsToMP/
├── plugin-build/              # Obsidian插件构建目录 / Obsidian plugin build directory
│   ├── src/                   # 源代码 / Source code
│   │   ├── main.js           # 插件主文件 / Plugin main file
│   │   └── styles.css        # 样式文件 / Styles file
│   └── build/                # 构建输出 / Build output (用于发布 / For release)
│       ├── main.js           # 编译后的插件 / Compiled plugin
│       ├── manifest.json     # 插件清单 / Plugin manifest
│       └── styles.css        # 样式文件 / Styles file
├── README.md                 # 项目说明文档 / Project documentation
├── LICENSE                  # 许可证文件 / License file
└── .gitignore               # Git忽略文件 / Git ignore file
```

---

## 快速开始 / Quick Start

### Obsidian插件安装 / Obsidian Plugin Installation

#### 方法1：手动安装 / Method 1: Manual Installation

1. 下载最新版本的插件文件 / Download the latest plugin files
2. 将文件复制到Obsidian的插件目录 / Copy files to Obsidian plugins directory:
   - Windows: `%APPDATA%\Obsidian\plugins\obsidin-to-mp\`
   - macOS: `~/Library/Application Support/Obsidian/Plugins/obsidin-to-mp/`
   - Linux: `~/.config/obsidian/plugins/obsidin-to-mp/`
3. 在Obsidian中启用插件：设置 → 社区插件 → OpsToMP → 启用 / Enable plugin in Obsidian: Settings → Community Plugins → OpsToMP → Enable

#### 方法2：从源码构建 / Method 2: Build from Source

```bash
# 进入插件构建目录 / Enter plugin build directory
cd plugin-build

# 安装依赖 / Install dependencies
npm install

# 构建插件 / Build plugin
npm run build

# 将build目录下的文件复制到Obsidian插件目录 / Copy files from build directory to Obsidian plugins directory
```

### Python工具安装 / Python Tools Installation

```bash
# 安装Python依赖 / Install Python dependencies
pip install requests markdown beautifulsoup4

# 进入Python工具目录 / Enter Python tools directory
cd py工具

# 测试Token / Test Token
python test_token.py

# 转换Markdown文件 / Convert Markdown file
python obsidian_to_mp.py test_note.md
```

---

## 配置说明 / Configuration

### 获取微信公众号凭证 / Get WeChat Official Account Credentials

1. 登录[微信公众平台](https://mp.weixin.qq.com/) / Login to [WeChat Official Account Platform](https://mp.weixin.qq.com/)
2. 进入"开发" → "基本配置" / Go to "Development" → "Basic Configuration"
3. 获取AppID和AppSecret / Get AppID and AppSecret

### Obsidian插件配置 / Obsidian Plugin Configuration

1. 打开Obsidian设置 / Open Obsidian Settings
2. 找到"OpsToMP"插件设置 / Find "OpsToMP" plugin settings
3. 填写以下信息 / Fill in the following information:
   - **AppID**：微信公众号的AppID / WeChat Official Account AppID
   - **AppSecret**：微信公众号的AppSecret / WeChat Official Account AppSecret
   - **网络测试URL**：默认为百度，可自定义 / Network test URL, default is Baidu, customizable
   - **超时时间**：网络请求超时时间（毫秒）/ Network request timeout (milliseconds)

### Python工具配置 / Python Tools Configuration

编辑`obsidian_to_mp.py`或直接在命令行中指定参数 / Edit `obsidian_to_mp.py` or specify parameters directly in command line:

```bash
python obsidian_to_mp.py --appid YOUR_APPID --secret YOUR_SECRET your_note.md
```

---

## 使用方法 / Usage

### Obsidian插件使用 / Obsidian Plugin Usage

#### 打开发布面板 / Open Publishing Panel

- 点击左侧工具栏的微信图标 / Click the WeChat icon in the left toolbar
- 或使用命令面板：`打开微信公众号发布面板` / Or use command palette: `Open WeChat Official Account Publishing Panel`

#### 预览文档 / Preview Document

1. 在Obsidian中打开要预览的笔记 / Open the note you want to preview in Obsidian
2. 点击侧边栏中的"预览当前文档"按钮 / Click "Preview Current Document" button in the sidebar
3. 查看微信公众号格式的预览效果 / View the preview in WeChat Official Account format

#### 上传到草稿箱 / Upload to Drafts

1. 在Obsidian中打开要上传的笔记 / Open the note you want to upload in Obsidian
2. 点击侧边栏中的"上传到草稿箱"按钮 / Click "Upload to Drafts" button in the sidebar
3. 等待上传完成 / Wait for upload to complete
4. 在微信公众号后台查看草稿 / View drafts in WeChat Official Account backend

#### 发布到公众号 / Publish to Official Account

1. 在Obsidian中打开要发布的笔记 / Open the note you want to publish in Obsidian
2. 点击侧边栏中的"发布到公众号"按钮 / Click "Publish to Official Account" button in the sidebar
3. 等待发布完成 / Wait for publishing to complete
4. 在微信公众号后台查看已发布的文章 / View published articles in WeChat Official Account backend

#### 设置封面图片 / Set Cover Image

在上传或发布时，可以选择设置封面图片 / When uploading or publishing, you can set a cover image:
- 支持本地图片文件 / Support local image files
- 支持网络图片URL / Support network image URLs

#### 网络测试 / Network Testing

- 点击"测试网络连接"按钮测试网络连通性 / Click "Test Network Connection" button to test network connectivity
- 点击"测试API密钥"按钮验证微信公众号凭证 / Click "Test API Keys" button to verify WeChat Official Account credentials

#### 一键排版 / One-Click Formatting

1. 勾选"启用一键排版"复选框 / Check "Enable One-Click Formatting" checkbox
2. 根据需要选择排版选项 / Select formatting options as needed:
   - **自动添加段落间距**：统一段落间距 / Auto paragraph spacing: Unify paragraph spacing
   - **统一标题格式**：标准化各级标题样式 / Unify headings: Standardize heading styles
   - **优化图片显示**：图片居中、圆角、阴影 / Optimize images: Center images, add rounded corners and shadows
   - **添加引用样式**：美化引用块 / Quote styling: Beautify quote blocks
   - **代码块美化**：美化代码块和行内代码 / Code block beautification: Beautify code blocks and inline code
   - **列表格式优化**：统一列表缩进和间距 / List formatting: Unify list indentation and spacing
   - **取消多余换行**：移除多余的空行，段落间最多空一行 / Remove extra breaks: Remove extra blank lines, max one blank line between paragraphs
3. 点击"预览当前文档"或"上传至草稿箱"查看效果 / Click "Preview Current Document" or "Upload to Drafts" to see the effect

#### 内容管理 / Content Management

##### 查看草稿列表 / View Draft List

1. 点击侧边栏中的"查看草稿列表"按钮 / Click "View Draft List" button in the sidebar
2. 查看所有草稿及其状态 / View all drafts and their status
3. 点击草稿卡片查看详情 / Click draft card to view details
4. 点击"删除"按钮删除草稿 / Click "Delete" button to delete draft

##### 查看已发布文章 / View Published Articles

1. 点击侧边栏中的"查看已发布文章"按钮 / Click "View Published Articles" button in the sidebar
2. 查看所有已发布文章及其状态 / View all published articles and their status
3. 点击文章卡片查看详情 / Click article card to view details
4. 点击"删除"按钮删除已发布文章 / Click "Delete" button to delete published article

**注意**：内容管理功能需要公众号完成个人认证。如果出现权限错误，请前往微信公众平台完成认证。/ **Note**: Content management features require WeChat Official Account personal authentication. If permission errors occur, please complete authentication on the WeChat Official Account Platform.

### Python工具使用 / Python Tools Usage

#### 测试Token / Test Token

```bash
python test_token.py
```

按照提示输入AppID和AppSecret，工具会自动测试Token的有效性 / Follow the prompts to enter AppID and AppSecret, the tool will automatically test Token validity.

#### 转换Markdown文件 / Convert Markdown File

```bash
python obsidian_to_mp.py your_note.md
```

工具会自动 / The tool will automatically:
1. 读取Markdown文件 / Read Markdown file
2. 转换为HTML格式 / Convert to HTML format
3. 上传本地图片到微信服务器 / Upload local images to WeChat server
4. 发布到微信公众号草稿箱 / Publish to WeChat Official Account drafts

#### 批量处理 / Batch Processing

```bash
# 处理多个文件 / Process multiple files
for file in *.md; do
    python obsidian_to_mp.py "$file"
done
```

---

## Markdown支持 / Markdown Support

插件和Python工具都支持以下Markdown语法 / Both plugin and Python tools support the following Markdown syntax:

- 标题（`#`、`##`、`###`等）/ Headers (`#`, `##`, `###`, etc.)
- 代码块（``` ```）/ Code blocks (``` ```)
- 加粗（`**text**`）/ Bold (`**text**`)
- 斜体（`*text*`）/ Italic (`*text*`)
- 链接（`[text](url)`）/ Links (`[text](url)`)
- 图片（`![alt](url)`）/ Images (`![alt](url)`)
- Obsidian内部链接（`![[图片名.png]]`）/ Obsidian internal links (`![[image.png]]`)
- 引用（`> text`）/ Blockquotes (`> text`)
- 列表（有序和无序）/ Lists (ordered and unordered)

---

## 技术实现 / Technical Implementation

### Obsidian插件技术栈 / Obsidian Plugin Tech Stack

- **框架**：Obsidian Plugin API / **Framework**: Obsidian Plugin API
- **打包工具**：esbuild / **Build Tool**: esbuild
- **HTTP客户端**：axios / **HTTP Client**: axios
- **表单处理**：form-data / **Form Processing**: form-data
- **Node.js版本**：>= 16 / **Node.js Version**: >= 16

### Python工具技术栈 / Python Tools Tech Stack

- **HTTP库**：requests / **HTTP Library**: requests
- **Markdown解析**：markdown / **Markdown Parser**: markdown
- **HTML解析**：BeautifulSoup4 / **HTML Parser**: BeautifulSoup4
- **Python版本**：>= 3.6 / **Python Version**: >= 3.6

### 安全特性 / Security Features

#### XSS防护 / XSS Protection

- 过滤危险标签（`<script>`、`<iframe>`等）/ Filter dangerous tags (`<script>`, `<iframe>`, etc.)
- 移除危险属性（`onclick`、`onerror`等）/ Remove dangerous attributes (`onclick`, `onerror`, etc.)
- 验证URL安全性（仅允许`http:`、`https:`、`app:`、`file:`协议）/ Validate URL security (only allow `http:`, `https:`, `app:`, `file:` protocols)
- HTML实体解码和转义 / HTML entity decoding and escaping

#### API安全 / API Security

- 使用HTTPS通信 / Use HTTPS communication
- 不存储敏感信息（AppSecret仅在内存中使用）/ Do not store sensitive information (AppSecret only used in memory)
- Token自动缓存和过期管理 / Automatic token caching and expiration management

### 图片处理 / Image Processing

- 支持本地图片自动上传 / Support automatic upload of local images
- 支持网络图片直接使用 / Support direct use of network images
- 支持Obsidian内部链接转换 / Support Obsidian internal link conversion
- 自动处理图片格式和大小限制 / Automatically handle image format and size limits

---

## 开发指南 / Development Guide

### Obsidian插件开发 / Obsidian Plugin Development

#### 环境要求 / Environment Requirements

- Node.js >= 16
- npm >= 8

#### 开发命令 / Development Commands

```bash
cd plugin-build

# 安装依赖 / Install dependencies
npm install

# 开发模式（自动监听文件变化）/ Development mode (watch file changes)
npm run dev

# 生产构建 / Production build
npm run build

# 版本号管理 / Version management
npm run version
```

#### 项目结构说明 / Project Structure

- `src/main.js`：插件主文件，包含所有核心功能 / Plugin main file, contains all core functionality
- `src/styles.css`：插件样式文件 / Plugin styles file
- `esbuild.config.mjs`：esbuild构建配置 / esbuild configuration
- `manifest.json`：插件清单文件 / Plugin manifest file

### Python工具开发 / Python Tools Development

#### 环境要求 / Environment Requirements

- Python >= 3.6
- pip

#### 安装依赖 / Install Dependencies

```bash
cd py工具
pip install -r requirements.txt
```

#### 代码结构 / Code Structure

- `app.py`：微信公众号API封装 / WeChat Official Account API wrapper
- `obsidian_to_mp.py`：主转换工具 / Main conversion tool
- `test_token.py`：Token测试工具 / Token testing tool

---

## 常见问题 / FAQ

### Obsidian插件相关 / Obsidian Plugin Related

**Q: 插件无法连接到微信API？ / Plugin cannot connect to WeChat API?**

A: 请检查 / Please check:
1. AppID和AppSecret是否正确 / Whether AppID and AppSecret are correct
2. 网络连接是否正常 / Whether network connection is normal
3. 微信公众号是否已开通相关权限 / Whether WeChat Official Account has relevant permissions
4. 使用网络测试功能验证连接 / Use network testing function to verify connection

**Q: 图片无法上传？ / Images cannot be uploaded?**

A: 请检查 / Please check:
1. 图片格式是否支持（jpg、png、gif等）/ Whether image format is supported (jpg, png, gif, etc.)
2. 图片大小是否超过限制（微信限制为5MB）/ Whether image size exceeds limit (WeChat limit is 5MB)
3. 网络连接是否正常 / Whether network connection is normal
4. 图片路径是否正确 / Whether image path is correct

**Q: 预览效果与实际发布不一致？ / Preview effect differs from actual publishing?**

A: 这可能是因为 / This may be because:
1. 微信公众号编辑器有额外的样式限制 / WeChat Official Account editor has additional style restrictions
2. 建议在微信公众号后台进行最终调整 / Suggest making final adjustments in WeChat Official Account backend

**Q: Markdown渲染异常？ / Markdown rendering abnormal?**

A: 请检查 / Please check:
1. Markdown语法是否正确 / Whether Markdown syntax is correct
2. 是否使用了不支持的语法 / Whether unsupported syntax is used
3. 查看控制台日志获取详细错误信息 / Check console logs for detailed error information

### Python工具相关 / Python Tools Related

**Q: Python工具无法运行？ / Python tools cannot run?**

A: 请检查 / Please check:
1. Python版本是否 >= 3.6 / Whether Python version is >= 3.6
2. 是否安装了所有依赖（requests、markdown、beautifulsoup4）/ Whether all dependencies are installed (requests, markdown, beautifulsoup4)
3. 使用`pip list`查看已安装的包 / Use `pip list` to view installed packages

**Q: Token获取失败？ / Token acquisition failed?**

A: 请检查 / Please check:
1. AppID和AppSecret是否正确 / Whether AppID and AppSecret are correct
2. 网络连接是否正常 / Whether network connection is normal
3. 微信公众号是否已开通相关权限 / Whether WeChat Official Account has relevant permissions

**Q: 图片上传失败？ / Image upload failed?**

A: 请检查 / Please check:
1. 图片路径是否正确 / Whether image path is correct
2. 图片格式是否支持 / Whether image format is supported
3. 图片大小是否超过限制 / Whether image size exceeds limit
4. 网络连接是否正常 / Whether network connection is normal

---

## 更新日志 / Changelog

### v1.1.0 (2025-12-30)

#### Obsidian插件 / Obsidian Plugin

- ✨ 新增一键排版功能 / Add one-click formatting feature
  - 支持自动添加段落间距 / Support auto paragraph spacing
  - 支持统一标题格式 / Support unify headings
  - 支持优化图片显示 / Support optimize images
  - 支持添加引用样式 / Support quote styling
  - 支持代码块美化 / Support code block beautification
  - 支持列表格式优化 / Support list formatting
  - 支持取消多余换行 / Support remove extra breaks
- ✨ 新增内容管理功能 / Add content management features
  - 查看草稿列表 / View draft list
  - 查看已发布文章列表 / View published articles list
  - 删除草稿 / Delete drafts
  - 删除已发布文章 / Delete published articles
- 🐛 修复内容管理权限错误提示 / Fix content management permission error message
  - 添加个人认证说明 / Add personal authentication explanation

#### Python工具 / Python Tools

- 无更新 / No changes

### v1.0.0 (2025-12-30)

#### Obsidian插件 / Obsidian Plugin

- ✨ 初始版本发布 / Initial release
- ✨ 支持Markdown转HTML / Support Markdown to HTML conversion
- ✨ 支持实时预览 / Support real-time preview
- ✨ 支持上传到草稿箱 / Support upload to drafts
- ✨ 支持直接发布 / Support direct publishing
- ✨ 支持图片上传 / Support image upload
- ✨ 支持封面图片 / Support cover image
- 🔒 内置XSS防护 / Built-in XSS protection
- 🎨 自动样式美化 / Automatic style beautification
- 🌐 网络测试功能 / Network testing function
- 📊 控制面板界面 / Control panel interface

#### Python工具 / Python Tools

- ✨ 初始版本发布 / Initial release
- ✨ 支持Markdown转HTML / Support Markdown to HTML conversion
- ✨ 支持图片上传 / Support image upload
- ✨ 支持草稿箱发布 / Support draft publishing
- 🧪 Token测试工具 / Token testing tool
- 📋 命令行操作 / Command-line operation

---

## 贡献指南 / Contributing

欢迎提交Issue和Pull Request！/ Welcome to submit Issues and Pull Requests!

### 提交Issue / Submitting Issues

在提交Issue时，请提供 / When submitting an issue, please provide:
1. 详细的问题描述 / Detailed problem description
2. 复现步骤 / Steps to reproduce
3. 环境信息（操作系统、Obsidian版本、插件版本等）/ Environment information (OS, Obsidian version, plugin version, etc.)
4. 相关日志或截图 / Relevant logs or screenshots

### 提交Pull Request / Submitting Pull Requests

1. Fork本仓库 / Fork this repository
2. 创建特性分支（`git checkout -b feature/AmazingFeature`）/ Create feature branch (`git checkout -b feature/AmazingFeature`)
3. 提交更改（`git commit -m 'Add some AmazingFeature'`）/ Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支（`git push origin feature/AmazingFeature`）/ Push to branch (`git push origin feature/AmazingFeature`)
5. 开启Pull Request / Open Pull Request

---

## 许可证 / License

MIT License

---

## 作者 / Author

Qysec

---

## 致谢 / Acknowledgments

感谢以下开源项目和社区 / Thanks to the following open source projects and communities:

- [Obsidian](https://obsidian.md/) - 强大的笔记应用 / Powerful note-taking app
- [esbuild](https://esbuild.github.io/) - 快速的JavaScript打包工具 / Fast JavaScript bundler
- [axios](https://axios-http.com/) - HTTP客户端 / HTTP client
- [Python requests](https://requests.readthedocs.io/) - Python HTTP库 / Python HTTP library
- [Python markdown](https://python-markdown.github.io/) - Markdown解析库 / Markdown parser
- [BeautifulSoup](https://www.crummy.com/software/BeautifulSoup/) - HTML解析库 / HTML parser

---

## 联系方式 / Contact

如有问题或建议，欢迎通过以下方式联系 / For questions or suggestions, please contact via:

- 提交GitHub Issue / Submit GitHub Issue
- 发送邮件 / Send email

---

**注意**：使用本工具时，请遵守微信公众平台的使用规范和相关法律法规。/ **Note**: When using this tool, please comply with WeChat Official Account Platform usage guidelines and relevant laws and regulations.
