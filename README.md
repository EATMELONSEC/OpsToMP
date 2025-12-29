# OpsToMP - Obsidian微信公众号发布插件

将Obsidian笔记转换并发布到微信公众号草稿箱的插件。

## 功能特性

- 📝 **Markdown转HTML**：将Markdown格式转换为微信公众号支持的HTML格式
- 👁️ **实时预览**：在Obsidian中预览微信公众号格式的渲染效果
- 📤 **上传草稿箱**：一键上传到微信公众号草稿箱
- 🚀 **直接发布**：支持直接发布到微信公众号
- 🖼️ **图片支持**：自动上传本地图片到微信服务器
- 🎨 **样式美化**：自动应用微信公众号风格的样式
- 🔒 **安全防护**：内置XSS防护，过滤危险标签和属性

## 安装

### 方法：手动安装

1. 下载最新版本的插件文件
2. 将文件复制到Obsidian的插件目录：
   - Windows: `%APPDATA%\Obsidian\plugins\obsidin-to-mp\`
   - macOS: `~/Library/Application Support/Obsidian/Plugins/obsidin-to-mp/`
   - Linux: `~/.config/obsidian/plugins/obsidin-to-mp/`
3. 在Obsidian中启用插件：设置 → 社区插件 → OpsToMP → 启用

## 配置

在使用插件之前，需要配置微信公众号的API凭证：

1. 打开插件设置：设置 → 社区插件 → OpsToMP → 选项
2. 填写以下信息：
   - **AppID**：微信公众号的AppID
   - **AppSecret**：微信公众号的AppSecret

### 获取AppID和AppSecret

1. 登录[微信公众平台](https://mp.weixin.qq.com/)
2. 进入"开发" → "基本配置"
3. 获取AppID和AppSecret

## 使用方法

### 预览文档

1. 在Obsidian中打开要预览的笔记
2. 点击左侧插件面板中的"预览当前文档"按钮
3. 查看微信公众号格式的预览效果

### 上传到草稿箱

1. 在Obsidian中打开要上传的笔记
2. 点击左侧插件面板中的"上传到草稿箱"按钮
3. 等待上传完成
4. 在微信公众号后台查看草稿

### 发布到公众号

1. 在Obsidian中打开要发布的笔记
2. 点击左侧插件面板中的"发布到公众号"按钮
3. 等待发布完成
4. 在微信公众号后台查看已发布的文章

### 设置封面图片

在上传或发布时，可以选择设置封面图片：
- 支持本地图片文件
- 支持网络图片URL

## Markdown支持

插件支持以下Markdown语法：

- 标题（`#`、`##`、`###`等）
- 代码块（``` ```）
- 加粗（`**text**`）
- 斜体（`*text*`）
- 链接（`[text](url)`）
- 图片（`![alt](url)`）
- Obsidian内部链接（`![[图片名.png]]`）

## 技术实现

### Markdown渲染

插件使用两种方式渲染Markdown：

1. **优先使用Obsidian内置渲染器**：`app.renderMarkdown()`
   - 支持完整的Markdown语法
   - 支持Obsidian特有功能

2. **降级方案**：自定义正则表达式替换
   - 当Obsidian渲染器不可用时使用
   - 支持基础Markdown语法

### XSS防护

插件内置多层XSS防护机制：

1. **HTML净化**：`sanitizeHtml()`函数
   - 过滤危险标签（`<script>`、`<iframe>`等）
   - 移除危险属性（`onclick`、`onerror`等）
   - 验证URL安全性（仅允许`http:`、`https:`、`app:`、`file:`协议）

2. **HTML实体解码**：自动解码HTML实体
   - 检测并解码已转义的HTML（如`&lt;br&gt;`）
   - 确保HTML标签正确渲染

3. **文本转义**：对动态内容进行转义
   - 降级方案中所有文本内容都经过`escapeHtml()`转义
   - 防止注入攻击

### 图片处理

插件支持多种图片格式：

1. **网络图片**：直接使用URL
2. **本地图片**：自动上传到微信服务器
3. **Obsidian内部链接**：自动转换为可访问的URL

### 样式美化

插件自动应用微信公众号风格的样式：

- 字体：`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`
- 行高：`1.75`
- 字号：`16px`
- 标题样式：不同级别差异化
- 表格样式：边框、内边距、背景色

## 安全性

插件在以下方面确保安全性：

1. **XSS防护**：
   - 过滤危险标签和属性
   - 验证URL安全性
   - 转义动态内容

2. **API安全**：
   - 使用HTTPS通信
   - 不存储敏感信息（AppSecret仅在内存中使用）

3. **数据隐私**：
   - 所有数据仅在本地处理
   - 不上传到第三方服务器

## 常见问题

### Q: 插件无法连接到微信API？

A: 请检查：
1. AppID和AppSecret是否正确
2. 网络连接是否正常
3. 微信公众号是否已开通相关权限

### Q: 图片无法上传？

A: 请检查：
1. 图片格式是否支持（jpg、png、gif等）
2. 图片大小是否超过限制（微信限制为5MB）
3. 网络连接是否正常

### Q: 预览效果与实际发布不一致？

A: 这可能是因为：
1. 微信公众号编辑器有额外的样式限制
2. 建议在微信公众号后台进行最终调整

### Q: Markdown渲染异常？

A: 请检查：
1. Markdown语法是否正确
2. 是否使用了不支持的语法
3. 查看控制台日志获取详细错误信息

## 更新日志

### v0.1.0 (2025-12-30)

- ✨ 初始版本发布
- ✨ 支持Markdown转HTML
- ✨ 支持预览功能
- ✨ 支持上传到草稿箱
- ✨ 支持直接发布
- ✨ 支持图片上传
- ✨ 支持封面图片
- 🔒 内置XSS防护
- 🎨 自动样式美化

## 贡献

欢迎提交Issue和Pull Request！

## 许可证

```
MIT License

Copyright (c) 2025 Qysec

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```



## 作者

Qysec

- https://mp.weixin.qq.com/)

## 致谢

感谢Obsidian社区和所有贡献者！
