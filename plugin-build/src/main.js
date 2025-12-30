import { Plugin, addIcon, Notice } from 'obsidian';
import https from 'https';
import http from 'http';
import { WeChatMPAPI } from './api.js';
import { PublisherSidebarView } from './sidebar.js';
import { NetworkTestSettingsTab } from './settings.js';
import { escapeHtml, sanitizeHtml, processInternalLinks, processContentImages, processImagePaths, beautifyContentForWechat } from './utils.js';

class WeChatMPPublisher extends Plugin {
  settings = {
    timeout: 30000,
    networkTestUrl: 'http://baidu.com',
    appId: '',
    appSecret: '',
    accessToken: '',
    accessTokenExpire: 0
  };

  api;

  async onload() {
    console.log('微信公众号发布插件已加载');

    window.plugin = this;

    this.api = new WeChatMPAPI(this.settings);

    this.registerView(
      'wechat-mp-publisher-sidebar',
      (leaf) => new PublisherSidebarView(leaf, this)
    );

    await this.loadSettings();

    this.addRibbonIcon('paper-plane', '微信公众号发布面板', async () => {
      try {
        await this.openPublisherSidebar();
      } catch (error) {
        console.error('打开发布面板失败:', error);
        new Notice('打开发布面板失败，请查看控制台日志', 5000);
      }
    });

    this.addCommand({
      id: 'open-wechat-mp-publisher',
      name: '打开微信公众号发布面板',
      callback: async () => {
        try {
          await this.openPublisherSidebar();
        } catch (error) {
          console.error('打开发布面板失败:', error);
          new Notice('打开发布面板失败，请查看控制台日志', 5000);
        }
      }
    });

    this.addCommand({
      id: 'publish-to-wechat-mp',
      name: '直接发布到微信公众号',
      callback: async () => {
        try {
          await this.publishToWeChatMP();
        } catch (error) {
          console.error('发布到微信公众号失败:', error);
        }
      }
    });

    this.addSettingTab(new NetworkTestSettingsTab(this.app, this));
  }

  async openPublisherSidebar() {
    const existingLeaves = this.app.workspace.getLeavesOfType('wechat-mp-publisher-sidebar');
    if (existingLeaves.length > 0) {
      const publisherLeaf = existingLeaves[0];
      
      const isActive = this.app.workspace.getActiveViewOfType(PublisherSidebarView) !== null;
      
      if (isActive) {
        publisherLeaf.detach();
        return;
      } else {
        this.app.workspace.revealLeaf(publisherLeaf);
        return;
      }
    }
    
    const leaf = this.app.workspace.getRightLeaf(false);
    await leaf.setViewState({
      type: 'wechat-mp-publisher-sidebar'
    });
  }

  async onunload() {
    this.app.workspace.getLeavesOfType('wechat-mp-publisher-sidebar').forEach(leaf => leaf.detach());
    console.log('微信公众号发布插件已卸载，自定义视图已清理');
  }

  async loadSettings() {
    this.settings = Object.assign({}, {
      timeout: 5000,
      networkTestUrl: 'http://baidu.com',
      appId: '',
      appSecret: '',
      accessToken: '',
      accessTokenExpire: 0
    }, await this.loadData());
    this.api.updateSettings(this.settings);
  }

  async saveSettings() {
    await this.saveData(this.settings);
    this.api.updateSettings(this.settings);
  }

  async testNetworkConnection(testUrl = 'http://baidu.com') {
    const notice = new Notice('正在测试网络连接...', 0);
    try {
      notice.setMessage(`正在访问${testUrl}...`);
      
      const protocol = testUrl.startsWith('https') ? https : http;
      
      const response = await new Promise((resolve, reject) => {
        const req = protocol.get(testUrl, { 
          timeout: this.settings.timeout
        }, (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            resolve({ 
              status: res.statusCode, 
              data: data 
            });
          });
        });
        
        req.on('error', (err) => {
          reject(err);
        });
        
        req.on('timeout', () => {
          req.destroy();
          reject(new Error('请求超时'));
        });
      });
      
      const successMsg = `网络连接测试成功: 成功访问${testUrl}，HTTP状态码: ${response.status}`;
      notice.hide();
      new Notice(successMsg, 10000);
      console.log(successMsg);
      
      const responseText = response.data.substring(0, 100) + '...';
      console.log(`${testUrl}响应内容:`, responseText);
      
      return { success: true, message: successMsg };
    } catch (error) {
      let errorMsg = '网络连接测试失败';
      if (error.code) {
        errorMsg += `: 错误码 ${error.code}`;
      }
      if (error.message) {
        errorMsg += `: ${error.message}`;
      }
      errorMsg += `\n请求URL: ${testUrl}`;
      errorMsg += `\n超时时间: ${this.settings.timeout}ms`;
      errorMsg += '\n\n可能的解决方案：\n';
      errorMsg += '1. 检查目标服务器是否在运行\n';
      errorMsg += '2. 检查URL是否正确\n';
      errorMsg += '3. 检查本地网络是否正常\n';
      errorMsg += '4. 尝试从浏览器直接访问该地址\n';
      errorMsg += '5. 检查是否有其他网络安全软件阻止连接\n';
      
      notice.hide();
      new Notice(errorMsg, 15000);
      console.error('网络测试详细错误:', error);
      
      return { success: false, message: errorMsg };
    }
  }

  async testAPIKeys() {
    const notice = new Notice('正在测试微信公众号API密钥...', 0);
    try {
      if (!this.settings.appId || !this.settings.appSecret) {
        throw new Error('请先在设置中配置微信公众号AppID和AppSecret');
      }

      notice.setMessage('正在验证API密钥...');
      const accessToken = await this.api.getAccessToken();

      notice.hide();
      const successMsg = `API密钥测试成功！获取到access_token: ${accessToken.substring(0, 20)}...`;
      new Notice(successMsg, 10000);
      console.log(successMsg);

      return { success: true, message: successMsg };
    } catch (error) {
      let errorMsg = 'API密钥测试失败';
      if (error.message) {
        errorMsg += `: ${error.message}`;
      }

      notice.hide();
      new Notice(errorMsg, 15000);
      console.error('API测试详细错误:', error);

      return { success: false, message: errorMsg };
    }
  }

  async previewCurrentDocument(coverImage = '') {
    console.log('previewCurrentDocument 被调用');
    const activeFile = this.app.workspace.getActiveFile();
    console.log('当前活动文件:', activeFile);
    if (!activeFile) {
      new Notice('请先打开要预览的文档', 5000);
      return;
    }

    try {
      console.log('开始读取文档内容...');
      const content = await this.app.vault.read(activeFile);
      console.log('文档内容长度:', content.length);
      
      let htmlContent;
      if (this.app.renderMarkdown) {
        console.log('使用 app.renderMarkdown 渲染...');
        htmlContent = await this.app.renderMarkdown(content, activeFile, null);
        console.log('app.renderMarkdown 返回的内容（前200字符）:', htmlContent.substring(0, 200));
        htmlContent = sanitizeHtml(htmlContent);
        console.log('sanitizeHtml 返回的内容（前200字符）:', htmlContent.substring(0, 200));
      } else {
        console.log('使用降级方案渲染...');
        
        htmlContent = content.replace(/```([\s\S]*?)```/g, (match, code) => {
          return `<pre><code>${escapeHtml(code)}</code></pre>`;
        });
        
        htmlContent = htmlContent.replace(/(#{1,6}) (.*?)(\n|$)/g, (match, level, text) => {
          return `<h${level.length}>${escapeHtml(text)}</h${level.length}>`;
        });
        
        htmlContent = htmlContent.replace(/\*\*(.*?)\*\*/g, (match, text) => {
          return `<strong>${escapeHtml(text)}</strong>`;
        });
        
        htmlContent = htmlContent.replace(/\*(.*?)\*/g, (match, text) => {
          return `<em>${escapeHtml(text)}</em>`;
        });
        
        htmlContent = htmlContent.replace(/\[(.*?)\]\((.*?)\)/g, (match, text, url) => {
          return `<a href="${escapeHtml(url)}" target="_blank">${escapeHtml(text)}</a>`;
        });
        
        htmlContent = htmlContent.replace(/\n/g, '<br>');
      }
      
      console.log('开始处理内部链接...');
      htmlContent = processInternalLinks(htmlContent);
      
      console.log('开始处理图片路径...');
      htmlContent = await processImagePaths(htmlContent, activeFile, this.app);
      
      console.log('开始创建预览模态框...');
      this.createPreviewModal(activeFile.basename, htmlContent, coverImage);
      
      new Notice('已生成微信公众号格式预览', 3000);
      console.log('预览完成');

    } catch (error) {
      console.error('预览文档错误:', error);
      new Notice('预览文档失败，请查看控制台日志', 5000);
    }
  }

  createPreviewModal(title, htmlContent, coverImage = '') {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      z-index: 10000;
      display: flex;
      justify-content: center;
      align-items: center;
      overflow: auto;
    `;
    
    const previewContainer = document.createElement('div');
    previewContainer.style.cssText = `
      background: white;
      width: 90%;
      max-width: 800px;
      max-height: 90vh;
      overflow: auto;
      border-radius: 8px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    `;
    
    const wechatContent = document.createElement('div');
    wechatContent.style.cssText = `
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.7;
      color: #333;
    `;
    
    const titleEl = document.createElement('h1');
    titleEl.textContent = title;
    titleEl.style.cssText = `
      margin-bottom: 20px;
      font-size: 24px;
      font-weight: 600;
      text-align: center;
      color: #333;
    `;
    
    let coverImageEl;
    if (coverImage) {
      coverImageEl = document.createElement('div');
      coverImageEl.style.cssText = `
        margin: 0 auto 20px;
        max-width: 100%;
        text-align: center;
      `;
      
      const img = document.createElement('img');
      img.src = coverImage;
      img.alt = '封面图片';
      img.style.cssText = `
        max-width: 100%;
        height: auto;
        border-radius: 4px;
      `;
      
      coverImageEl.appendChild(img);
    }
    
    const contentEl = document.createElement('div');
    contentEl.innerHTML = htmlContent;
    
    this.applyWechatStyle(contentEl);
    
    const closeButton = document.createElement('button');
    closeButton.textContent = '关闭预览';
    closeButton.style.cssText = `
      display: block;
      margin: 30px auto 0;
      padding: 10px 20px;
      background: #07C160;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 16px;
      cursor: pointer;
      transition: background 0.3s;
    `;
    closeButton.addEventListener('mouseover', () => closeButton.style.background = '#06B158');
    closeButton.addEventListener('mouseout', () => closeButton.style.background = '#07C160');
    closeButton.addEventListener('click', () => modal.remove());
    
    wechatContent.appendChild(titleEl);
    if (coverImageEl) {
      wechatContent.appendChild(coverImageEl);
    }
    wechatContent.appendChild(contentEl);
    wechatContent.appendChild(closeButton);
    previewContainer.appendChild(wechatContent);
    modal.appendChild(previewContainer);
    
    document.body.appendChild(modal);
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  applyWechatStyle(container) {
    container.style.cssText += `
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.75;
      color: #333;
      font-size: 16px;
    `;
    
    const paragraphs = container.querySelectorAll('p');
    paragraphs.forEach(p => {
      p.style.cssText += `
        margin: 0 0 18px 0;
        text-indent: 0;
        line-height: 1.8;
      `;
    });
    
    const h1s = container.querySelectorAll('h1');
    h1s.forEach(h1 => {
      h1.style.cssText += `
        margin: 30px 0 15px;
        font-size: 24px;
        font-weight: 700;
        color: #333;
        text-align: center;
        line-height: 1.4;
      `;
    });
    
    const h2s = container.querySelectorAll('h2');
    h2s.forEach(h2 => {
      h2.style.cssText += `
        margin: 28px 0 12px;
        font-size: 20px;
        font-weight: 700;
        color: #333;
        border-bottom: 1px solid #eee;
        padding-bottom: 8px;
      `;
    });
    
    const h3s = container.querySelectorAll('h3');
    h3s.forEach(h3 => {
      h3.style.cssText += `
        margin: 25px 0 10px;
        font-size: 18px;
        font-weight: 600;
        color: #333;
      `;
    });
    
    const h4s = container.querySelectorAll('h4');
    h4s.forEach(h4 => {
      h4.style.cssText += `
        margin: 20px 0 8px;
        font-size: 16px;
        font-weight: 600;
        color: #333;
      `;
    });
    
    const images = container.querySelectorAll('img');
    images.forEach(img => {
      img.style.cssText += `
        max-width: 100%;
        height: auto;
        margin: 15px auto;
        display: block;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        background: #fff;
        padding: 4px;
        border: 1px solid #eee;
      `;
      
      const parent = img.parentElement;
      if (parent.tagName !== 'P') {
        parent.style.textAlign = 'center';
      }
    });
    
    const links = container.querySelectorAll('a');
    links.forEach(a => {
      a.style.cssText += `
        color: #1AAD19;
        text-decoration: none;
        border-bottom: 1px solid rgba(26, 173, 25, 0.3);
      `;
      a.target = '_blank';
      
      a.addEventListener('mouseover', () => {
        a.style.backgroundColor = 'rgba(26, 173, 25, 0.1)';
      });
      a.addEventListener('mouseout', () => {
        a.style.backgroundColor = 'transparent';
      });
    });
    
    const uls = container.querySelectorAll('ul');
    uls.forEach(ul => {
      ul.style.cssText += `
        margin: 18px 0;
        padding-left: 28px;
        list-style-type: disc;
      `;
    });
    
    const ols = container.querySelectorAll('ol');
    ols.forEach(ol => {
      ol.style.cssText += `
        margin: 18px 0;
        padding-left: 28px;
        list-style-type: decimal;
      `;
    });
    
    const listItems = container.querySelectorAll('li');
    listItems.forEach(li => {
      li.style.cssText += `
        margin-bottom: 8px;
        line-height: 1.8;
      `;
    });
    
    const preBlocks = container.querySelectorAll('pre');
    preBlocks.forEach(pre => {
      pre.style.cssText += `
        margin: 18px 0;
        padding: 15px;
        background: #f8f8f8;
        border-radius: 6px;
        overflow-x: auto;
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        font-size: 14px;
        line-height: 1.6;
        border: 1px solid #eee;
      `;
    });
    
    const codes = container.querySelectorAll('code:not(pre code)');
    codes.forEach(code => {
      code.style.cssText += `
        background: #f5f5f5;
        padding: 3px 6px;
        border-radius: 3px;
        font-family: 'Consolas', 'Monaco', monospace;
        font-size: 0.9em;
      `;
    });
    
    const blockquotes = container.querySelectorAll('blockquote');
    blockquotes.forEach(quote => {
      quote.style.cssText += `
        margin: 18px 0;
        padding: 15px 20px;
        border-left: 4px solid #07C160;
        background: #f9f9f9;
        color: #666;
        font-size: 15px;
        border-radius: 0 4px 4px 0;
      `;
    });
    
    const tables = container.querySelectorAll('table');
    tables.forEach(table => {
      table.style.cssText += `
        margin: 18px 0;
        width: 100%;
        border-collapse: collapse;
        font-size: 14px;
      `;
    });
    
    const tableCells = container.querySelectorAll('td, th');
    tableCells.forEach(cell => {
      cell.style.cssText += `
        padding: 10px 12px;
        border: 1px solid #ddd;
        text-align: left;
      `;
    });
    
    const tableHeaders = container.querySelectorAll('th');
    tableHeaders.forEach(header => {
      header.style.cssText += `
        background-color: #f5f5f5;
        font-weight: 600;
        color: #333;
      `;
    });
    
    const hr = container.querySelectorAll('hr');
    hr.forEach(line => {
      line.style.cssText += `
        margin: 25px 0;
        border: none;
        border-top: 1px solid #eee;
      `;
    });
  }

  async uploadToDraftBox(coverImage = null, digest = '') {
    const notice = new Notice('正在准备上传至微信公众号草稿箱...', 0);
    
    try {
      if (!this.settings.appId || !this.settings.appSecret) {
        throw new Error('请先在设置中配置微信公众号AppID和AppSecret');
      }

      const activeFile = this.app.workspace.getActiveFile();
      if (!activeFile) {
        throw new Error('请先打开要上传的笔记');
      }

      notice.setMessage('正在读取笔记内容...');
      let content = await this.app.vault.read(activeFile);
      
      notice.setMessage('正在转换文档格式...');
      if (this.app.renderMarkdown) {
        content = await this.app.renderMarkdown(content, activeFile, null);
        content = sanitizeHtml(content);
      } else {
        content = content.replace(/```([\s\S]*?)```/g, (match, code) => {
          return `<pre><code>${escapeHtml(code)}</code></pre>`;
        });
        
        content = content.replace(/(#{1,6}) (.*?)(\n|$)/g, (match, level, text) => {
          return `<h${level.length}>${escapeHtml(text)}</h${level.length}>`;
        });
        
        content = content.replace(/\*\*(.*?)\*\*/g, (match, text) => {
          return `<strong>${escapeHtml(text)}</strong>`;
        });
        
        content = content.replace(/\*(.*?)\*/g, (match, text) => {
          return `<em>${escapeHtml(text)}</em>`;
        });
        
        content = content.replace(/\[(.*?)\]\((.*?)\)/g, (match, text, url) => {
          return `<a href="${escapeHtml(url)}" target="_blank">${escapeHtml(text)}</a>`;
        });
        
        content = content.replace(/\n/g, '<br>');
      }
      
      content = processInternalLinks(content);
      
      notice.setMessage('正在获取微信公众号授权...');
      const accessToken = await this.api.getAccessToken();
      
      notice.setMessage('正在处理文档中的图片...');
      content = await processContentImages(content, accessToken, activeFile, this.api.uploadSingleImage.bind(this.api), this.app);
      
      notice.setMessage('正在美化文档内容...');
      content = beautifyContentForWechat(content);
      
      let coverMediaId = '';
      if (coverImage) {
        notice.setMessage('正在上传封面图片...');
        coverMediaId = await this.api.uploadCoverImage(accessToken, coverImage);
      }
      
      notice.setMessage('正在上传至微信公众号草稿箱...');
      const draftResult = await this.api.createDraft(accessToken, activeFile.basename, content, coverMediaId, digest);
      
      notice.hide();
      new Notice(`上传至草稿箱成功！草稿ID: ${draftResult.media_id}`, 10000);
      console.log('上传至草稿箱成功:', draftResult);
      
    } catch (error) {
      notice.hide();
      let errorMsg = '上传至草稿箱失败';
      if (error.message) {
        errorMsg += `: ${error.message}`;
      }
      new Notice(errorMsg, 15000);
      console.error('上传至草稿箱错误:', error);
    }
  }

  async publishToWeChatMP() {
    const notice = new Notice('正在准备发布到微信公众号...', 0);
    
    try {
      if (!this.settings.appId || !this.settings.appSecret) {
        throw new Error('请先在设置中配置微信公众号AppID和AppSecret');
      }

      const activeFile = this.app.workspace.getActiveFile();
      if (!activeFile) {
        throw new Error('请先打开要发布的笔记');
      }

      notice.setMessage('正在读取笔记内容...');
      let content = await this.app.vault.read(activeFile);
      
      notice.setMessage('正在转换文档格式...');
      if (this.app.renderMarkdown) {
        content = await this.app.renderMarkdown(content, activeFile, null);
        content = sanitizeHtml(content);
      } else {
        content = content.replace(/```([\s\S]*?)```/g, (match, code) => {
          return `<pre><code>${escapeHtml(code)}</code></pre>`;
        });
        
        content = content.replace(/(#{1,6}) (.*?)(\n|$)/g, (match, level, text) => {
          return `<h${level.length}>${escapeHtml(text)}</h${level.length}>`;
        });
        
        content = content.replace(/\*\*(.*?)\*\*/g, (match, text) => {
          return `<strong>${escapeHtml(text)}</strong>`;
        });
        
        content = content.replace(/\*(.*?)\*/g, (match, text) => {
          return `<em>${escapeHtml(text)}</em>`;
        });
        
        content = content.replace(/\[(.*?)\]\((.*?)\)/g, (match, text, url) => {
          return `<a href="${escapeHtml(url)}" target="_blank">${escapeHtml(text)}</a>`;
        });
        
        content = content.replace(/\n/g, '<br>');
      }
      
      content = processInternalLinks(content);
      
      notice.setMessage('正在获取微信公众号授权...');
      const accessToken = await this.api.getAccessToken();
      
      notice.setMessage('正在处理文档中的图片...');
      content = await processContentImages(content, accessToken, activeFile, this.api.uploadSingleImage.bind(this.api), this.app);
      
      notice.setMessage('正在美化文档内容...');
      content = beautifyContentForWechat(content);
      
      notice.setMessage('正在创建微信公众号草稿...');
      const draftResult = await this.api.createDraft(accessToken, activeFile.basename, content);
      
      notice.setMessage('正在发布到微信公众号...');
      const publishResult = await this.api.publishDraft(accessToken, draftResult.media_id);
      
      notice.hide();
      new Notice(`发布成功！文章ID: ${publishResult.article_id}`, 10000);
      console.log('发布成功:', publishResult);
      
    } catch (error) {
      notice.hide();
      let errorMsg = '发布失败';
      if (error.message) {
        errorMsg += `: ${error.message}`;
      }
      new Notice(errorMsg, 15000);
      console.error('发布错误:', error);
    }
  }
}

export default WeChatMPPublisher;
