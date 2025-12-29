import { Plugin, addIcon, Notice, Setting, PluginSettingTab, ItemView, TFile } from 'obsidian';
import axios from 'axios';
import https from 'https';
import http from 'http';

// 主插件类
class WeChatMPPublisher extends Plugin {
  settings = {
    // 网络配置
    timeout: 30000, // 网络请求超时时间，增加到30秒以支持大文件上传
    networkTestUrl: 'http://baidu.com', // 网络测试URL
    // 微信公众号配置
    appId: '', // 微信公众号AppID
    appSecret: '', // 微信公众号AppSecret
    accessToken: '', // 缓存的access_token
    accessTokenExpire: 0 // access_token过期时间
  };

  async onload() {
    console.log('微信公众号发布插件已加载');

    // 将插件实例存储到window对象（供Sidebar使用）
    window.plugin = this;

    // 注册Sidebar视图类型
    this.registerView(
      'wechat-mp-publisher-sidebar',
      (leaf) => new PublisherSidebarView(leaf, this)
    );

    // 加载设置
    await this.loadSettings();

    // 添加微信公众号发布按钮（现在点击打开控制面板）
    this.addRibbonIcon('paper-plane', '微信公众号发布面板', async () => {
      try {
        await this.openPublisherSidebar();
      } catch (error) {
        console.error('打开发布面板失败:', error);
        new Notice('打开发布面板失败，请查看控制台日志', 5000);
      }
    });

    // 添加打开控制面板命令
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

    // 添加发布到微信公众号命令（保留原有功能）
    this.addCommand({
      id: 'publish-to-wechat-mp',
      name: '直接发布到微信公众号',
      callback: async () => {
        try {
          await this.publishToWeChatMP();
        } catch (error) {
          console.error('发布到微信公众号失败:', error);
          // 错误提示已经在publishToWeChatMP方法内部处理
        }
      }
    });

    // 添加设置面板
    this.addSettingTab(new NetworkTestSettingsTab(this.app, this));
  }

  /**
   * 打开发布控制面板侧边栏（切换显示/隐藏）
   */
  async openPublisherSidebar() {
    // 先查询是否已存在该视图
    const existingLeaves = this.app.workspace.getLeavesOfType('wechat-mp-publisher-sidebar');
    if (existingLeaves.length > 0) {
      const publisherLeaf = existingLeaves[0];
      
      // 检查当前是否已激活
      const isActive = this.app.workspace.getActiveViewOfType(PublisherSidebarView) !== null;
      
      if (isActive) {
        // 如果已激活，则关闭它
        publisherLeaf.detach();
        return;
      } else {
        // 如果未激活，则激活它
        this.app.workspace.revealLeaf(publisherLeaf);
        return;
      }
    }
    // 不存在则创建新视图
    // 使用兼容的API：先获取右侧叶子节点，然后设置视图状态
    const leaf = this.app.workspace.getRightLeaf(false);
    await leaf.setViewState({
      type: 'wechat-mp-publisher-sidebar'
    });
  }

  async onunload() {
    // 关闭所有自定义视图
    this.app.workspace.getLeavesOfType('wechat-mp-publisher-sidebar').forEach(leaf => leaf.detach());
    console.log('微信公众号发布插件已卸载，自定义视图已清理');
  }

  async loadSettings() {
    this.settings = Object.assign({}, {
      // 网络配置
      timeout: 5000,
      networkTestUrl: 'http://baidu.com',
      // 微信公众号配置
      appId: '',
      appSecret: '',
      accessToken: '',
      accessTokenExpire: 0
    }, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  /**
   * 测试网络连通性
   * @param {string} [testUrl] - 测试地址，默认使用百度
   * @returns {Promise<{success: boolean, message: string}>} 网络测试结果
   */
  async testNetworkConnection(testUrl = 'http://baidu.com') {
    const notice = new Notice('正在测试网络连接...', 0);
    try {
      // 测试访问指定地址
      notice.setMessage(`正在访问${testUrl}...`);
      
      // 使用Node.js内置的http或https模块发送请求
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
      
      // 显示响应内容的前100个字符
      const responseText = response.data.substring(0, 100) + '...';
      console.log(`${testUrl}响应内容:`, responseText);
      
      return { success: true, message: successMsg };
    } catch (error) {
      // 详细错误信息
      let errorMsg = '网络连接测试失败';
      if (error.code) {
        errorMsg += `: 错误码 ${error.code}`;
      }
      if (error.message) {
        errorMsg += `: ${error.message}`;
      }
      // 增加更多调试信息
      errorMsg += `\n请求URL: ${testUrl}`;
      errorMsg += `\n超时时间: ${this.settings.timeout}ms`;
      // 增加可能的解决方案提示
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

  /**
   * 测试微信公众号API密钥有效性
   * @returns {Promise<{success: boolean, message: string}>} 测试结果
   */
  async testAPIKeys() {
    const notice = new Notice('正在测试微信公众号API密钥...', 0);
    try {
      // 检查配置
      if (!this.settings.appId || !this.settings.appSecret) {
        throw new Error('请先在设置中配置微信公众号AppID和AppSecret');
      }

      // 尝试获取access_token来验证密钥
      notice.setMessage('正在验证API密钥...');
      const accessToken = await this.getAccessToken();

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

  /**
   * 获取微信公众号AccessToken
   * @returns {Promise<string>} access_token
   */
  async getAccessToken() {
    // 检查access_token是否有效
    const now = Date.now();
    if (this.settings.accessToken && this.settings.accessTokenExpire > now) {
      return this.settings.accessToken;
    }

    // 获取新的access_token
    try {
      const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${this.settings.appId}&secret=${this.settings.appSecret}`;
      
      const response = await new Promise((resolve, reject) => {
        const req = https.get(url, { timeout: this.settings.timeout }, (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            try {
              const result = JSON.parse(data);
              resolve(result);
            } catch (err) {
              reject(new Error('解析响应失败'));
            }
          });
        });
        
        req.on('error', (err) => reject(err));
        req.on('timeout', () => {
          req.destroy();
          reject(new Error('请求超时'));
        });
      });

      if (response.access_token) {
        // 缓存access_token和过期时间
        this.settings.accessToken = response.access_token;
        this.settings.accessTokenExpire = now + (response.expires_in - 300) * 1000; // 提前5分钟过期
        await this.saveSettings();
        return response.access_token;
      } else {
        throw new Error(`获取access_token失败: ${response.errmsg || '未知错误'}`);
      }
    } catch (error) {
      console.error('获取access_token错误:', error);
      throw error;
    }
  }

  /**
   * 上传封面图片到微信公众号获取media_id
   * @param {string} accessToken - access_token
   * @param {File} coverFile - 封面图片文件
   * @returns {Promise<string>} media_id
   */
  async uploadCoverImage(accessToken, coverFile) {
    // 在函数顶部保存this引用，确保在所有嵌套函数中都可用
    const self = this;
    
    return new Promise((resolve, reject) => {
      try {
        // 验证coverFile
        if (!coverFile || !(coverFile instanceof File)) {
          reject(new Error('无效的封面图片文件'));
          return;
        }
        
        console.log('准备上传封面图片:', coverFile.name, coverFile.size, coverFile.type);
        
        // 读取文件内容
        const reader = new FileReader();
        
        reader.onload = (event) => {
          try {
            // 将ArrayBuffer转换为Buffer
            const arrayBuffer = event.target.result;
            const fileBuffer = Buffer.from(arrayBuffer);
            
            console.log('文件读取成功，大小:', fileBuffer.length);
            
            // 构建multipart/form-data
            const boundary = '----WebKitFormBoundary' + Date.now().toString(16);
            
            // 构建请求体
            let body = '--' + boundary + '\r\n';
            body += 'Content-Disposition: form-data; name="type"\r\n';
            body += 'Content-Type: text/plain\r\n';
            body += '\r\n';
            body += 'image\r\n';
            body += '--' + boundary + '\r\n';
            body += 'Content-Disposition: form-data; name="media"; filename="' + coverFile.name + '"\r\n';
            body += 'Content-Type: ' + (coverFile.type || 'image/jpeg') + '\r\n';
            body += '\r\n';
            
            const bodyBuffer = Buffer.from(body);
            const footerBuffer = Buffer.from('\r\n--' + boundary + '--\r\n');
            
            // 计算总长度
            const totalLength = bodyBuffer.length + fileBuffer.length + footerBuffer.length;
            
            console.log('请求体总长度:', totalLength);
            
            // 构建请求选项 - 使用永久素材上传接口
            const options = {
              method: 'POST',
              hostname: 'api.weixin.qq.com',
              path: '/cgi-bin/material/add_material?access_token=' + accessToken + '&type=image',
              headers: {
                'Content-Type': 'multipart/form-data; boundary=' + boundary,
                'Content-Length': totalLength
              },
              timeout: self.settings.timeout
            };
            
            console.log('准备发送请求到:', options.path);
            
            // 发送请求
            const req = https.request(options, function(res) {
              let responseData = '';
              
              console.log('请求已发送，响应状态码:', res.statusCode);
              
              res.on('data', function(chunk) {
                responseData += chunk;
              });
              
              res.on('end', function() {
                console.log('响应内容:', responseData);
                
                try {
                  const result = JSON.parse(responseData);
                  console.log('解析后的响应:', result);
                  
                  if (result.media_id) {
                    console.log('获取到永久素材media_id:', result.media_id);
                    resolve(result.media_id);
                  } else if (result.errcode) {
                    reject(new Error('上传封面图片失败: ' + result.errmsg + ' (错误码: ' + result.errcode + ')，完整响应: ' + responseData));
                  } else {
                    reject(new Error('上传封面图片失败: 未知错误，完整响应: ' + responseData));
                  }
                } catch (err) {
                  console.error('解析响应失败:', err);
                  reject(new Error('解析响应失败: ' + err.message + '，响应内容: ' + responseData));
                }
              });
            });
            
            req.on('error', function(err) {
              console.error('发送请求错误:', err);
              reject(new Error('发送请求失败: ' + err.message));
            });
            
            req.on('timeout', function() {
              console.error('请求超时');
              req.destroy();
              reject(new Error('请求超时'));
            });
            
            // 分块写入请求体
            req.write(bodyBuffer);
            req.write(fileBuffer);
            req.write(footerBuffer);
            req.end();
            
          } catch (error) {
            console.error('处理文件内容错误:', error);
            reject(new Error('处理文件内容失败: ' + error.message));
          }
        };
        
        reader.onerror = (error) => {
          console.error('读取文件错误:', error);
          reject(new Error('读取文件失败: ' + error.message));
        };
        
        // 读取文件为ArrayBuffer
        reader.readAsArrayBuffer(coverFile);
        
      } catch (error) {
        console.error('上传封面图片错误:', error);
        reject(new Error('上传封面图片失败: ' + error.message));
      }
    });
  }

  /**
   * 上传单张图片到微信临时素材库
   * @param {string} accessToken - access_token
   * @param {Buffer} imageBuffer - 图片文件Buffer
   * @param {string} fileName - 图片文件名
   * @param {string} mimeType - 图片MIME类型
   * @returns {Promise<string>} 图片的URL
   */
  async uploadSingleImage(accessToken, imageBuffer, fileName, mimeType) {
    return new Promise((resolve, reject) => {
      try {
        // 构建multipart/form-data
        const boundary = '----WebKitFormBoundary' + Date.now().toString(16);
        
        // 构建请求体
        let body = '--' + boundary + '\r\n';
        body += 'Content-Disposition: form-data; name="type"\r\n';
        body += 'Content-Type: text/plain\r\n';
        body += '\r\n';
        body += 'image\r\n';
        body += '--' + boundary + '\r\n';
        body += 'Content-Disposition: form-data; name="media"; filename="' + fileName + '"\r\n';
        body += 'Content-Type: ' + (mimeType || 'image/jpeg') + '\r\n';
        body += '\r\n';
        
        const bodyBuffer = Buffer.from(body);
        const footerBuffer = Buffer.from('\r\n--' + boundary + '--\r\n');
        
        // 计算总长度
        const totalLength = bodyBuffer.length + imageBuffer.length + footerBuffer.length;
        
        // 构建请求选项 - 使用永久素材上传接口
        const options = {
          method: 'POST',
          hostname: 'api.weixin.qq.com',
          path: '/cgi-bin/material/add_material?access_token=' + accessToken + '&type=image',
          headers: {
            'Content-Type': 'multipart/form-data; boundary=' + boundary,
            'Content-Length': totalLength
          },
          timeout: this.settings.timeout
        };
        
        // 发送请求
        const req = https.request(options, function(res) {
          let responseData = '';
          
          res.on('data', function(chunk) {
            responseData += chunk;
          });
          
          res.on('end', function() {
            try {
              const result = JSON.parse(responseData);
              console.log('永久素材上传响应:', result);
              
              if (result.url) {
                // 永久素材上传成功，返回图片URL
                console.log('图片上传成功，获取到URL:', result.url);
                resolve(result.url);
              } else if (result.errcode) {
                reject(new Error('上传图片失败: ' + result.errmsg + ' (错误码: ' + result.errcode + ')'));
              } else {
                console.error('素材上传响应异常:', responseData);
                reject(new Error('上传图片失败: 未知错误，响应数据: ' + responseData));
              }
            } catch (err) {
              reject(new Error('解析响应失败: ' + err.message + '，响应数据: ' + responseData));
            }
          });
        });
        
        req.on('error', function(err) {
          reject(new Error('发送请求失败: ' + err.message));
        });
        
        req.on('timeout', function() {
          req.destroy();
          reject(new Error('请求超时'));
        });
        
        // 分块写入请求体
        req.write(bodyBuffer);
        req.write(imageBuffer);
        req.write(footerBuffer);
        req.end();
        
      } catch (error) {
        reject(new Error('上传图片错误: ' + error.message));
      }
    });
  }
  
  /**
   * HTML转义函数，转义特殊字符防止XSS攻击
   * @param {string} text - 需要转义的文本
   * @returns {string} 转义后的文本
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  /**
   * HTML净化函数，过滤危险标签和属性防止XSS攻击
   * @param {string} html - 需要净化的HTML内容
   * @returns {string} 净化后的HTML内容
   */
  sanitizeHtml(html) {
    console.log('sanitizeHtml 被调用，输入内容（前200字符）:', html.substring(0, 200));
    if (!html) return '';
    
    // 创建临时DOM元素来操作HTML
    const tempDiv = document.createElement('div');
    
    // 尝试解码HTML实体
    // 如果HTML已经被转义（如 &lt;br&gt;），需要先解码
    const decoderDiv = document.createElement('div');
    decoderDiv.textContent = html;
    const decodedHtml = decoderDiv.innerHTML;
    
    console.log('解码后的内容（前200字符）:', decodedHtml.substring(0, 200));
    
    // 如果解码后的内容与原内容不同，说明原内容确实被转义了
    if (decodedHtml !== html) {
      console.log('检测到HTML实体编码，使用解码后的内容');
      html = decodedHtml;
    } else {
      console.log('未检测到HTML实体编码，使用原内容');
    }
    
    // 设置innerHTML来解析HTML结构
    tempDiv.innerHTML = html;
    
    // 定义允许的标签列表
    const allowedTags = new Set([
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'hr',
      'strong', 'em', 'u', 's', 'b', 'i',
      'ul', 'ol', 'li',
      'pre', 'code', 'kbd',
      'a', 'img',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'blockquote', 'span', 'div',
      'input', 'label', 'sup', 'sub'
    ]);
    
    // 定义允许的属性列表
    const allowedAttributes = new Set([
      'src', 'alt', 'title', 'width', 'height',
      'href', 'target', 'rel',
      'class', 'id', 'style',
      'colspan', 'rowspan',
      'type', 'checked', 'disabled', 'name', 'value',
      'for', 'data-line', 'data-source'
    ]);
    
    // 定义允许的style属性列表
    const allowedStyles = new Set([
      'color', 'background-color', 'font-size', 'font-weight',
      'text-align', 'margin', 'padding', 'line-height',
      'width', 'height', 'border', 'border-radius',
      'display', 'text-indent',
      'font-family', 'font-style', 'text-decoration',
      'white-space', 'overflow', 'overflow-x', 'overflow-y',
      'position', 'top', 'right', 'bottom', 'left',
      'float', 'clear', 'vertical-align',
      'background', 'background-image', 'background-repeat',
      'background-position', 'background-size',
      'box-shadow', 'text-shadow', 'opacity',
      'transform', 'transition', 'animation'
    ]);
    
    // URL安全验证函数
    const isSafeUrl = (url) => {
      if (!url || typeof url !== 'string') return false;
      try {
        const parsedUrl = new URL(url, 'http://example.com');
        // 允许的协议：http、https、app（Obsidian本地资源）、file（本地文件）
        return ['http:', 'https:', 'app:', 'file:'].includes(parsedUrl.protocol);
      } catch (e) {
        // 如果URL解析失败，认为不安全
        return false;
      }
    };
    
    // 递归处理所有元素
    const processElement = (element) => {
      // 如果不是允许的标签，替换为文本
      if (!allowedTags.has(element.tagName.toLowerCase())) {
        const textNode = document.createTextNode(element.textContent);
        element.parentNode.replaceChild(textNode, element);
        return;
      }
      
      // 移除所有不允许的属性
      Array.from(element.attributes).forEach(attr => {
        const attrName = attr.name.toLowerCase();
        const attrValue = attr.value;
        
        // data-*属性是安全的，保留
        if (attrName.startsWith('data-')) {
          return;
        }
        
        if (!allowedAttributes.has(attrName)) {
          element.removeAttribute(attr.name);
        } else if (attrName === 'href' || attrName === 'src') {
          // 验证链接和图片URL的安全性
          if (!isSafeUrl(attrValue)) {
            // 对于不安全的URL，将其设置为#或空
            element.setAttribute(attr.name, attrName === 'href' ? '#' : '');
          } else if (attrName === 'href') {
            // 为链接添加安全属性
            element.setAttribute('target', '_blank');
            element.setAttribute('rel', 'noopener noreferrer');
          }
        } else if (attrName === 'style') {
          // 清理style属性，只保留允许的样式
          const styleDeclarations = attrValue.split(';');
          const safeStyles = [];
          
          styleDeclarations.forEach(declaration => {
            const parts = declaration.split(':').map(part => part.trim());
            if (parts.length === 2) {
              const [property, value] = parts;
              if (allowedStyles.has(property.toLowerCase())) {
                // 样式值不需要转义，因为style属性值是安全的
                safeStyles.push(`${property}: ${value}`);
              }
            }
          });
          
          if (safeStyles.length > 0) {
            element.setAttribute('style', safeStyles.join('; '));
          } else {
            element.removeAttribute('style');
          }
        } else if (attrName === 'class') {
          // class属性是安全的，不需要转义
          element.setAttribute(attr.name, attrValue);
        } else if (attrName === 'id') {
          // id属性是安全的，不需要转义
          element.setAttribute(attr.name, attrValue);
        } else {
          // 转义其他属性值
          element.setAttribute(attr.name, this.escapeHtml(attrValue));
        }
      });
      
      // 处理子元素（不需要处理文本节点，因为textContent是安全的）
      Array.from(element.childNodes).forEach(child => {
        if (child.nodeType === 1) { // 元素节点
          processElement(child);
        }
      });
    };
    
    // 开始处理所有根节点（不需要处理文本节点）
    Array.from(tempDiv.childNodes).forEach(child => {
      if (child.nodeType === 1) { // 元素节点
        processElement(child);
      }
    });
    
    return tempDiv.innerHTML;
  }
  
  /**
   * 处理文档中的Obsidian内部链接格式图片，转换为标准<img>标签
   * @param {string} htmlContent - 转换后的HTML内容
   * @returns {string} 处理后的HTML内容
   */
  processInternalLinks(htmlContent) {
    // 使用正则表达式匹配Obsidian内部链接格式图片：![[图片名.png]]
    const internalImageRegex = /!\[\[(.*?)\]\]/g;
    
    // 替换为标准的<img>标签
    return htmlContent.replace(internalImageRegex, (match, imagePath) => {
      // 移除可能的参数（如尺寸调整）
      const cleanPath = imagePath.split('|')[0].trim();
      // 返回标准的<img>标签（不需要转义，路径会在后续处理中验证）
      return `<img src="${cleanPath}" alt="${cleanPath}">`;
    });
  }
  
  /**
   * 处理文档中的图片，上传本地图片到微信服务器
   * @param {string} htmlContent - 转换后的HTML内容
   * @param {string} accessToken - access_token
   * @param {TFile} activeFile - 当前活动文件
   * @returns {Promise<string>} 处理后的HTML内容
   */
  async processContentImages(htmlContent, accessToken, activeFile) {
    // 创建临时DOM元素来操作HTML
    const tempDiv = document.createElement('div');
    // 直接设置innerHTML，HTML内容已经在调用前经过sanitizeHtml净化
    tempDiv.innerHTML = htmlContent;
    
    // 获取所有图片元素
    const images = tempDiv.querySelectorAll('img');
    
    // 处理每个图片
    for (const img of images) {
      let src = img.getAttribute('src');
      if (!src) continue;
      
      // 如果是本地文件路径（不是http/https开头）
      if (!src.startsWith('http://') && !src.startsWith('https://')) {
        try {
          // 获取图片文件
          let file;
          
          // 处理不同的路径格式
          if (src.startsWith('app://local/')) {
            // 转换为相对路径
            const localPath = decodeURIComponent(src.replace('app://local/', ''));
            file = this.app.vault.getAbstractFileByPath(localPath);
          } else if (src.startsWith('file:///')) {
            // 本地文件路径，转换为相对路径
            const localPath = decodeURIComponent(src.replace('file:///', ''));
            // 尝试查找文件
            const files = this.app.vault.getAllFiles();
            file = files.find(f => f.path === localPath || f.path.endsWith(localPath));
          } else {
            // 相对路径，直接查找
            file = this.app.metadataCache.getFirstLinkpathDest(src, activeFile.path);
          }
          
          if (file && file instanceof TFile) {
            // 读取文件内容
            const fileContent = await this.app.vault.readBinary(file);
            const fileBuffer = Buffer.from(fileContent);
            
            // 上传到微信服务器
            const imageUrl = await this.uploadSingleImage(
              accessToken, 
              fileBuffer, 
              file.name, 
              'image/' + file.extension
            );
            
            // 更新图片的src属性
            img.setAttribute('src', imageUrl);
            
            console.log('成功上传图片:', file.name, '->', imageUrl);
          }
        } catch (error) {
          console.error('处理图片失败:', error);
          // 如果处理失败，保持原src不变
        }
      }
      // 网络图片保持不变
    }
    
    // 返回处理后的HTML
    return tempDiv.innerHTML;
  }
  
  /**
   * 为微信公众号内容添加内联样式
   * @param {string} htmlContent - 转换后的HTML内容
   * @returns {string} 处理后的HTML内容
   */
  beautifyContentForWechat(htmlContent) {
    // 创建临时DOM元素来操作HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    // 设置容器基础样式
    tempDiv.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
    tempDiv.style.lineHeight = '1.75';
    tempDiv.style.color = '#333';
    tempDiv.style.fontSize = '16px';
    
    // 设置段落样式
    const paragraphs = tempDiv.querySelectorAll('p');
    paragraphs.forEach(p => {
      p.style.margin = '0 0 18px 0';
      p.style.textIndent = '0';
      p.style.lineHeight = '1.8';
    });
    
    // 设置标题样式（不同级别差异化）
    const h1s = tempDiv.querySelectorAll('h1');
    h1s.forEach(h1 => {
      h1.style.margin = '30px 0 15px';
      h1.style.fontSize = '24px';
      h1.style.fontWeight = '700';
      h1.style.color = '#333';
      h1.style.textAlign = 'center';
      h1.style.lineHeight = '1.4';
    });
    
    const h2s = tempDiv.querySelectorAll('h2');
    h2s.forEach(h2 => {
      h2.style.margin = '28px 0 12px';
      h2.style.fontSize = '20px';
      h2.style.fontWeight = '700';
      h2.style.color = '#333';
      h2.style.borderBottom = '1px solid #eee';
      h2.style.paddingBottom = '8px';
    });
    
    const h3s = tempDiv.querySelectorAll('h3');
    h3s.forEach(h3 => {
      h3.style.margin = '25px 0 10px';
      h3.style.fontSize = '18px';
      h3.style.fontWeight = '600';
      h3.style.color = '#333';
    });
    
    const h4s = tempDiv.querySelectorAll('h4');
    h4s.forEach(h4 => {
      h4.style.margin = '20px 0 8px';
      h4.style.fontSize = '16px';
      h4.style.fontWeight = '600';
      h4.style.color = '#333';
    });
    
    // 设置图片样式
    const images = tempDiv.querySelectorAll('img');
    images.forEach(img => {
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
      img.style.margin = '15px auto';
      img.style.display = 'block';
      img.style.borderRadius = '4px';
      img.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
      img.style.background = '#fff';
      img.style.padding = '4px';
      img.style.border = '1px solid #eee';
      
      // 为图片添加居中样式
      const parent = img.parentElement;
      if (parent.tagName !== 'P') {
        parent.style.textAlign = 'center';
      }
    });
    
    // 设置链接样式
    const links = tempDiv.querySelectorAll('a');
    links.forEach(a => {
      a.style.color = '#1AAD19';
      a.style.textDecoration = 'none';
      a.style.borderBottom = '1px solid rgba(26, 173, 25, 0.3)';
      a.target = '_blank';
    });
    
    // 设置列表样式
    const uls = tempDiv.querySelectorAll('ul');
    uls.forEach(ul => {
      ul.style.margin = '18px 0';
      ul.style.paddingLeft = '28px';
      ul.style.listStyleType = 'disc';
    });
    
    const ols = tempDiv.querySelectorAll('ol');
    ols.forEach(ol => {
      ol.style.margin = '18px 0';
      ol.style.paddingLeft = '28px';
      ol.style.listStyleType = 'decimal';
    });
    
    // 设置列表项样式
    const listItems = tempDiv.querySelectorAll('li');
    listItems.forEach(li => {
      li.style.marginBottom = '8px';
      li.style.lineHeight = '1.8';
    });
    
    // 设置代码块样式
    const preBlocks = tempDiv.querySelectorAll('pre');
    preBlocks.forEach(pre => {
      pre.style.margin = '18px 0';
      pre.style.padding = '15px';
      pre.style.background = '#f8f8f8';
      pre.style.borderRadius = '6px';
      pre.style.overflowX = 'auto';
      pre.style.fontFamily = '"Consolas", "Monaco", "Courier New", monospace';
      pre.style.fontSize = '14px';
      pre.style.lineHeight = '1.6';
      pre.style.border = '1px solid #eee';
    });
    
    // 设置行内代码样式
    const codes = tempDiv.querySelectorAll('code:not(pre code)');
    codes.forEach(code => {
      code.style.background = '#f5f5f5';
      code.style.padding = '3px 6px';
      code.style.borderRadius = '3px';
      code.style.fontFamily = '"Consolas", "Monaco", monospace';
      code.style.fontSize = '0.9em';
    });
    
    // 设置引用样式
    const blockquotes = tempDiv.querySelectorAll('blockquote');
    blockquotes.forEach(quote => {
      quote.style.margin = '18px 0';
      quote.style.padding = '15px 20px';
      quote.style.borderLeft = '4px solid #07C160';
      quote.style.background = '#f9f9f9';
      quote.style.color = '#666';
      quote.style.fontSize = '15px';
      quote.style.borderRadius = '0 4px 4px 0';
    });
    
    // 设置表格样式
    const tables = tempDiv.querySelectorAll('table');
    tables.forEach(table => {
      table.style.margin = '18px 0';
      table.style.width = '100%';
      table.style.borderCollapse = 'collapse';
      table.style.fontSize = '14px';
    });
    
    // 设置表格单元格样式
    const tableCells = tempDiv.querySelectorAll('td, th');
    tableCells.forEach(cell => {
      cell.style.padding = '10px 12px';
      cell.style.border = '1px solid #ddd';
      cell.style.textAlign = 'left';
    });
    
    // 设置表头样式
    const tableHeaders = tempDiv.querySelectorAll('th');
    tableHeaders.forEach(header => {
      header.style.backgroundColor = '#f5f5f5';
      header.style.fontWeight = '600';
      header.style.color = '#333';
    });
    
    // 设置分隔线样式
    const hr = tempDiv.querySelectorAll('hr');
    hr.forEach(line => {
      line.style.margin = '25px 0';
      line.style.border = 'none';
      line.style.borderTop = '1px solid #eee';
    });
    
    // 返回处理后的HTML
    return tempDiv.innerHTML;
  }
  
  /**
   * 创建微信公众号草稿
   * @param {string} accessToken - access_token
   * @param {string} title - 文章标题
   * @param {string} content - 文章内容
   * @param {string} coverMediaId - 封面图片media_id
   * @returns {Promise<Object>} 创建结果
   */
  async createDraft(accessToken, title, content, coverMediaId = '') {
    try {
      const url = `https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${accessToken}`;
      
      // 构建文章内容
      const article = {
        title: title,
        content: content,
        content_source_url: '', // 原文链接
        author: '', // 作者
        digest: content.substring(0, 100) + '...', // 摘要
        need_open_comment: 0, // 是否开启评论
        only_fans_can_comment: 0 // 是否仅粉丝可评论
      };
      
      // 如果有封面图片media_id，添加到文章中
      if (coverMediaId) {
        article.thumb_media_id = coverMediaId;
        article.show_cover_pic = 1; // 显示封面图
      } else {
        article.show_cover_pic = 0; // 不显示封面图
      }
      
      const data = JSON.stringify({
        articles: [article]
      });
      
      console.log('创建草稿请求数据:', data);
      
      const response = await new Promise((resolve, reject) => {
        const options = {
          method: 'POST',
          hostname: 'api.weixin.qq.com',
          path: `/cgi-bin/draft/add?access_token=${accessToken}`,
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data)
          },
          timeout: this.settings.timeout
        };
        
        const req = https.request(options, (res) => {
          let responseData = '';
          res.on('data', (chunk) => { responseData += chunk; });
          res.on('end', () => {
            try {
              const result = JSON.parse(responseData);
              resolve(result);
            } catch (err) {
              reject(new Error('解析响应失败'));
            }
          });
        });
        
        req.on('error', (err) => reject(err));
        req.on('timeout', () => {
          req.destroy();
          reject(new Error('请求超时'));
        });
        
        req.write(data);
        req.end();
      });
      
      if (response.errcode) {
        throw new Error(`创建草稿失败: ${response.errmsg}`);
      }
      
      return response;
      
    } catch (error) {
      console.error('创建草稿错误:', error);
      throw error;
    }
  }

  /**
   * 发布微信公众号草稿
   * @param {string} accessToken - access_token
   * @param {string} mediaId - 草稿media_id
   * @returns {Promise<Object>} 发布结果
   */
  async publishDraft(accessToken, mediaId) {
    try {
      const url = `https://api.weixin.qq.com/cgi-bin/freepublish/submit?access_token=${accessToken}`;
      
      const data = JSON.stringify({
        media_id: mediaId
      });
      
      const response = await new Promise((resolve, reject) => {
        const options = {
          method: 'POST',
          hostname: 'api.weixin.qq.com',
          path: `/cgi-bin/freepublish/submit?access_token=${accessToken}`,
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data)
          },
          timeout: this.settings.timeout
        };
        
        const req = https.request(options, (res) => {
          let responseData = '';
          res.on('data', (chunk) => { responseData += chunk; });
          res.on('end', () => {
            try {
              const result = JSON.parse(responseData);
              resolve(result);
            } catch (err) {
              reject(new Error('解析响应失败'));
            }
          });
        });
        
        req.on('error', (err) => reject(err));
        req.on('timeout', () => {
          req.destroy();
          reject(new Error('请求超时'));
        });
        
        req.write(data);
        req.end();
      });
      
      if (response.errcode) {
        throw new Error(`发布失败: ${response.errmsg}`);
      }
      
      return response;
      
    } catch (error) {
      console.error('发布草稿错误:', error);
      throw error;
    }
  }

  /**
   * 处理图片路径，确保在预览中能正确显示
   * @param {string} htmlContent - 转换后的HTML内容
   * @param {TFile} activeFile - 当前活动文件
   * @returns {string} 处理后的HTML内容
   */
  async processImagePaths(htmlContent, activeFile) {
    // 创建临时DOM元素来操作HTML
    const tempDiv = document.createElement('div');
    // 直接设置innerHTML，HTML内容已经在previewCurrentDocument中经过sanitizeHtml净化
    tempDiv.innerHTML = htmlContent;
    
    // 获取所有图片元素
    const images = tempDiv.querySelectorAll('img');
    
    // 处理每个图片
    for (const img of images) {
      let src = img.getAttribute('src');
      if (!src) continue;
      
      // 如果是本地文件路径（不是http/https开头）
      if (!src.startsWith('http://') && !src.startsWith('https://')) {
        try {
          let file;
          
          // 检查是否是Obsidian的内部链接格式
          if (src.startsWith('app://local/')) {
            // 转换为相对路径
            const localPath = decodeURIComponent(src.replace('app://local/', ''));
            file = this.app.vault.getAbstractFileByPath(localPath);
          } else if (src.startsWith('file:///')) {
            // 本地文件路径，转换为相对路径
            const localPath = decodeURIComponent(src.replace('file:///', ''));
            // 尝试查找文件
            const files = this.app.vault.getAllFiles();
            file = files.find(f => f.path === localPath || f.path.endsWith(localPath));
          } else {
            // 相对路径，直接查找
            file = this.app.metadataCache.getFirstLinkpathDest(src, activeFile.path);
          }
          
          if (file && file instanceof TFile) {
            // 使用app.vault.getResourcePath获取可访问的URL
            src = this.app.vault.getResourcePath(file);
            
            // 更新图片的src属性（不需要转义，URL应该保持原样）
            img.setAttribute('src', src);
          }
        } catch (error) {
          console.error('处理图片路径失败:', error);
        }
      }
    }
    
    // 返回处理后的HTML
    return tempDiv.innerHTML;
  }
  
  /**
   * 预览当前文档（微信公众号格式）
   * @param {string|File} [coverImage] - 封面图片URL或文件对象
   */
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
      // 读取文档内容
      const content = await this.app.vault.read(activeFile);
      console.log('文档内容长度:', content.length);
      
      // 使用 Obsidian 内置的 Markdown 渲染器转换为 HTML
      let htmlContent;
      if (this.app.renderMarkdown) {
        console.log('使用 app.renderMarkdown 渲染...');
        htmlContent = await this.app.renderMarkdown(content, activeFile, null);
        console.log('app.renderMarkdown 返回的内容（前200字符）:', htmlContent.substring(0, 200));
        // 对渲染结果进行HTML净化，防止XSS攻击
        htmlContent = this.sanitizeHtml(htmlContent);
        console.log('sanitizeHtml 返回的内容（前200字符）:', htmlContent.substring(0, 200));
      } else {
        console.log('使用降级方案渲染...');
        // 降级方案：先处理代码块，再处理其他格式
        // 注意：处理顺序很重要，先处理代码块避免内部内容被误解析
        
        // 1. 处理代码块（``` ```）
        htmlContent = content.replace(/```([\s\S]*?)```/g, (match, code) => {
          return `<pre><code>${this.escapeHtml(code)}</code></pre>`;
        });
        
        // 2. 处理标题（#）
        htmlContent = htmlContent.replace(/(#{1,6}) (.*?)(\n|$)/g, (match, level, text) => {
          return `<h${level.length}>${this.escapeHtml(text)}</h${level.length}>`;
        });
        
        // 3. 处理加粗（**text**）
        htmlContent = htmlContent.replace(/\*\*(.*?)\*\*/g, (match, text) => {
          return `<strong>${this.escapeHtml(text)}</strong>`;
        });
        
        // 4. 处理斜体（*text*）
        htmlContent = htmlContent.replace(/\*(.*?)\*/g, (match, text) => {
          return `<em>${this.escapeHtml(text)}</em>`;
        });
        
        // 5. 处理链接（[text](url)）
        htmlContent = htmlContent.replace(/\[(.*?)\]\((.*?)\)/g, (match, text, url) => {
          return `<a href="${this.escapeHtml(url)}" target="_blank">${this.escapeHtml(text)}</a>`;
        });
        
        // 6. 处理换行（\n）
        // 注意：必须在最后处理，避免破坏已生成的HTML标签
        htmlContent = htmlContent.replace(/\n/g, '<br>');
      }
      
      console.log('开始处理内部链接...');
      // 处理Obsidian内部链接格式的图片
      htmlContent = this.processInternalLinks(htmlContent);
      
      console.log('开始处理图片路径...');
      // 处理图片路径，确保预览时能正确显示
      htmlContent = await this.processImagePaths(htmlContent, activeFile);
      
      console.log('开始创建预览模态框...');
      // 创建预览模态框，并传递封面图片
      this.createPreviewModal(activeFile.basename, htmlContent, coverImage);
      
      new Notice('已生成微信公众号格式预览', 3000);
      console.log('预览完成');

    } catch (error) {
      console.error('预览文档错误:', error);
      new Notice('预览文档失败，请查看控制台日志', 5000);
    }
  }
  
  /**
   * 创建微信公众号格式预览模态框
   * @param {string} title - 文章标题
   * @param {string} htmlContent - 文章HTML内容
   * @param {string} [coverImage] - 封面图片URL
   */
  createPreviewModal(title, htmlContent, coverImage = '') {
    // 创建模态框元素
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
    
    // 创建预览容器
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
    
    // 创建微信公众号风格的预览内容
    const wechatContent = document.createElement('div');
    wechatContent.style.cssText = `
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.7;
      color: #333;
    `;
    
    // 标题
    const titleEl = document.createElement('h1');
    titleEl.textContent = title;
    titleEl.style.cssText = `
      margin-bottom: 20px;
      font-size: 24px;
      font-weight: 600;
      text-align: center;
      color: #333;
    `;
    
    // 封面图片（如果有）
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
    
    // 正文内容
    const contentEl = document.createElement('div');
    // 直接设置innerHTML，内容已经在previewCurrentDocument中经过sanitizeHtml净化
    contentEl.innerHTML = htmlContent;
    
    // 应用微信公众号风格的样式
    this.applyWechatStyle(contentEl);
    
    // 关闭按钮
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
    
    // 组装模态框
    wechatContent.appendChild(titleEl);
    if (coverImageEl) {
      wechatContent.appendChild(coverImageEl);
    }
    wechatContent.appendChild(contentEl);
    wechatContent.appendChild(closeButton);
    previewContainer.appendChild(wechatContent);
    modal.appendChild(previewContainer);
    
    // 添加到页面
    document.body.appendChild(modal);
    
    // 点击模态框背景关闭
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }
  
  /**
   * 应用微信公众号风格的样式
   * @param {HTMLElement} container - 容器元素
   */
  applyWechatStyle(container) {
    // 设置容器基础样式
    container.style.cssText += `
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.75;
      color: #333;
      font-size: 16px;
    `;
    
    // 设置段落样式
    const paragraphs = container.querySelectorAll('p');
    paragraphs.forEach(p => {
      p.style.cssText += `
        margin: 0 0 18px 0;
        text-indent: 0;
        line-height: 1.8;
      `;
    });
    
    // 设置标题样式（不同级别差异化）
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
    
    // 设置图片样式
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
      
      // 为图片添加居中样式
      const parent = img.parentElement;
      if (parent.tagName !== 'P') {
        parent.style.textAlign = 'center';
      }
    });
    
    // 设置链接样式
    const links = container.querySelectorAll('a');
    links.forEach(a => {
      a.style.cssText += `
        color: #1AAD19;
        text-decoration: none;
        border-bottom: 1px solid rgba(26, 173, 25, 0.3);
      `;
      a.target = '_blank';
      
      // 添加悬停效果
      a.addEventListener('mouseover', () => {
        a.style.backgroundColor = 'rgba(26, 173, 25, 0.1)';
      });
      a.addEventListener('mouseout', () => {
        a.style.backgroundColor = 'transparent';
      });
    });
    
    // 设置列表样式
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
    
    // 设置列表项样式
    const listItems = container.querySelectorAll('li');
    listItems.forEach(li => {
      li.style.cssText += `
        margin-bottom: 8px;
        line-height: 1.8;
      `;
    });
    
    // 设置代码块样式
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
    
    // 设置行内代码样式
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
    
    // 设置引用样式
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
    
    // 设置表格样式
    const tables = container.querySelectorAll('table');
    tables.forEach(table => {
      table.style.cssText += `
        margin: 18px 0;
        width: 100%;
        border-collapse: collapse;
        font-size: 14px;
      `;
    });
    
    // 设置表格单元格样式
    const tableCells = container.querySelectorAll('td, th');
    tableCells.forEach(cell => {
      cell.style.cssText += `
        padding: 10px 12px;
        border: 1px solid #ddd;
        text-align: left;
      `;
    });
    
    // 设置表头样式
    const tableHeaders = container.querySelectorAll('th');
    tableHeaders.forEach(header => {
      header.style.cssText += `
        background-color: #f5f5f5;
        font-weight: 600;
        color: #333;
      `;
    });
    
    // 设置分隔线样式
    const hr = container.querySelectorAll('hr');
    hr.forEach(line => {
      line.style.cssText += `
        margin: 25px 0;
        border: none;
        border-top: 1px solid #eee;
      `;
    });
  }

  /**
   * 上传至微信公众号草稿箱
   * @param {File} coverImage - 封面图片文件对象
   */
  async uploadToDraftBox(coverImage = null) {
    const notice = new Notice('正在准备上传至微信公众号草稿箱...', 0);
    
    try {
      // 检查配置
      if (!this.settings.appId || !this.settings.appSecret) {
        throw new Error('请先在设置中配置微信公众号AppID和AppSecret');
      }

      // 获取当前活动笔记
      const activeFile = this.app.workspace.getActiveFile();
      if (!activeFile) {
        throw new Error('请先打开要上传的笔记');
      }

      // 读取笔记内容
      notice.setMessage('正在读取笔记内容...');
      let content = await this.app.vault.read(activeFile);
      
      // 将Markdown转换为HTML
      notice.setMessage('正在转换文档格式...');
      if (this.app.renderMarkdown) {
        content = await this.app.renderMarkdown(content, activeFile, null);
        // 对渲染结果进行HTML净化，防止XSS攻击
        content = this.sanitizeHtml(content);
      } else {
        // 降级方案：先处理代码块，再处理其他格式
        // 1. 处理代码块（``` ```）
        content = content.replace(/```([\s\S]*?)```/g, (match, code) => {
          return `<pre><code>${this.escapeHtml(code)}</code></pre>`;
        });
        
        // 2. 处理标题（#）
        content = content.replace(/(#{1,6}) (.*?)(\n|$)/g, (match, level, text) => {
          return `<h${level.length}>${this.escapeHtml(text)}</h${level.length}>`;
        });
        
        // 3. 处理加粗（**text**）
        content = content.replace(/\*\*(.*?)\*\*/g, (match, text) => {
          return `<strong>${this.escapeHtml(text)}</strong>`;
        });
        
        // 4. 处理斜体（*text*）
        content = content.replace(/\*(.*?)\*/g, (match, text) => {
          return `<em>${this.escapeHtml(text)}</em>`;
        });
        
        // 5. 处理链接（[text](url)）
        content = content.replace(/\[(.*?)\]\((.*?)\)/g, (match, text, url) => {
          return `<a href="${this.escapeHtml(url)}" target="_blank">${this.escapeHtml(text)}</a>`;
        });
        
        // 6. 处理换行（\n）
        // 注意：必须在最后处理，避免破坏已生成的HTML标签
        content = content.replace(/\n/g, '<br>');
      }
      
      // 处理Obsidian内部链接格式的图片
      content = this.processInternalLinks(content);
      
      // 获取access_token
      notice.setMessage('正在获取微信公众号授权...');
      const accessToken = await this.getAccessToken();
      
      // 处理文档中的图片，上传到微信服务器
      notice.setMessage('正在处理文档中的图片...');
      content = await this.processContentImages(content, accessToken, activeFile);
      
      // 美化文档内容
      notice.setMessage('正在美化文档内容...');
      content = this.beautifyContentForWechat(content);
      
      // 上传封面图片（如果有）
      let coverMediaId = '';
      if (coverImage) {
        notice.setMessage('正在上传封面图片...');
        coverMediaId = await this.uploadCoverImage(accessToken, coverImage);
      }
      
      // 创建草稿
      notice.setMessage('正在上传至微信公众号草稿箱...');
      const draftResult = await this.createDraft(accessToken, activeFile.basename, content, coverMediaId);
      
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

  /**
   * 发布到微信公众号
   */
  async publishToWeChatMP() {
    const notice = new Notice('正在准备发布到微信公众号...', 0);
    
    try {
      // 检查配置
      if (!this.settings.appId || !this.settings.appSecret) {
        throw new Error('请先在设置中配置微信公众号AppID和AppSecret');
      }

      // 获取当前活动笔记
      const activeFile = this.app.workspace.getActiveFile();
      if (!activeFile) {
        throw new Error('请先打开要发布的笔记');
      }

      // 读取笔记内容
      notice.setMessage('正在读取笔记内容...');
      let content = await this.app.vault.read(activeFile);
      
      // 将Markdown转换为HTML
      notice.setMessage('正在转换文档格式...');
      if (this.app.renderMarkdown) {
        content = await this.app.renderMarkdown(content, activeFile, null);
        // 对渲染结果进行HTML净化，防止XSS攻击
        content = this.sanitizeHtml(content);
      } else {
        // 降级方案：先处理代码块，再处理其他格式
        // 1. 处理代码块（``` ```）
        content = content.replace(/```([\s\S]*?)```/g, (match, code) => {
          return `<pre><code>${this.escapeHtml(code)}</code></pre>`;
        });
        
        // 2. 处理标题（#）
        content = content.replace(/(#{1,6}) (.*?)(\n|$)/g, (match, level, text) => {
          return `<h${level.length}>${this.escapeHtml(text)}</h${level.length}>`;
        });
        
        // 3. 处理加粗（**text**）
        content = content.replace(/\*\*(.*?)\*\*/g, (match, text) => {
          return `<strong>${this.escapeHtml(text)}</strong>`;
        });
        
        // 4. 处理斜体（*text*）
        content = content.replace(/\*(.*?)\*/g, (match, text) => {
          return `<em>${this.escapeHtml(text)}</em>`;
        });
        
        // 5. 处理链接（[text](url)）
        content = content.replace(/\[(.*?)\]\((.*?)\)/g, (match, text, url) => {
          return `<a href="${this.escapeHtml(url)}" target="_blank">${this.escapeHtml(text)}</a>`;
        });
        
        // 6. 处理换行（\n）
        // 注意：必须在最后处理，避免破坏已生成的HTML标签
        content = content.replace(/\n/g, '<br>');
      }
      
      // 处理Obsidian内部链接格式的图片
      content = this.processInternalLinks(content);
      
      // 获取access_token
      notice.setMessage('正在获取微信公众号授权...');
      const accessToken = await this.getAccessToken();
      
      // 处理文档中的图片，上传到微信服务器
      notice.setMessage('正在处理文档中的图片...');
      content = await this.processContentImages(content, accessToken, activeFile);
      
      // 美化文档内容
      notice.setMessage('正在美化文档内容...');
      content = this.beautifyContentForWechat(content);
      
      // 创建草稿
      notice.setMessage('正在创建微信公众号草稿...');
      const draftResult = await this.createDraft(accessToken, activeFile.basename, content);
      
      // 发布草稿
      notice.setMessage('正在发布到微信公众号...');
      const publishResult = await this.publishDraft(accessToken, draftResult.media_id);
      
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

// 发布控制面板侧边栏
class PublisherSidebarView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin; // 获取插件实例
    this.coverImage = ''; // 当前设置的封面图片
  }

  getViewType() {
    return 'wechat-mp-publisher-sidebar';
  }

  getDisplayText() {
    return '微信公众号发布面板';
  }

  getIcon() {
    return 'paper-plane';
  }

  async onOpen() {
    const container = this.contentEl;
    container.empty();

    // 创建控制面板标题
    const titleEl = container.createEl('h2', { text: '微信公众号发布面板' });
    titleEl.style.marginBottom = '20px';

    // 预览按钮
    const previewButton = container.createEl('button', { text: '预览当前文档' });
    previewButton.className = 'mod-cta';
    previewButton.style.width = '100%';
    previewButton.style.marginBottom = '10px';
    previewButton.style.padding = '8px';
    previewButton.addEventListener('click', () => {
      if (this.coverFile) {
        // 如果有本地文件，使用FileReader读取数据URL
        const reader = new FileReader();
        reader.onload = (event) => {
          this.plugin.previewCurrentDocument(event.target.result);
        };
        reader.readAsDataURL(this.coverFile);
      } else {
        // 否则预览没有封面
        this.plugin.previewCurrentDocument();
      }
    });

    // 封面设置
    const coverSection = container.createEl('div');
    coverSection.style.marginBottom = '15px';
    
    const coverLabel = coverSection.createEl('h3', { text: '封面设置' });
    coverLabel.style.fontSize = '14px';
    coverLabel.style.marginBottom = '8px';
    
    const coverInput = coverSection.createEl('input', {
      type: 'file',
      accept: 'image/*'
    });
    coverInput.style.width = '100%';
    coverInput.style.padding = '8px';
    coverInput.style.marginBottom = '8px';
    
    const coverPreview = coverSection.createEl('div');
    coverPreview.style.border = '1px solid var(--background-modifier-border)';
    coverPreview.style.borderRadius = '4px';
    coverPreview.style.height = '100px';
    coverPreview.style.overflow = 'hidden';
    coverPreview.style.display = 'flex';
    coverPreview.style.alignItems = 'center';
    coverPreview.style.justifyContent = 'center';
    coverPreview.textContent = '封面预览';
    
    // 本地封面图片文件
    this.coverFile = null;
    
    coverInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.coverFile = file;
        // 使用 FileReader 预览本地图片
        const reader = new FileReader();
        reader.onload = (event) => {
          coverPreview.innerHTML = `<img src="${event.target.result}" style="max-width: 100%; max-height: 100%; object-fit: contain;">`;
        };
        reader.readAsDataURL(file);
      } else {
        this.coverFile = null;
        coverPreview.innerHTML = '封面预览';
      }
    });

    // 上传至草稿箱按钮
    const uploadButton = container.createEl('button', { text: '上传至草稿箱' });
    uploadButton.className = 'mod-cta';
    uploadButton.style.width = '100%';
    uploadButton.style.marginBottom = '10px';
    uploadButton.style.padding = '8px';
    uploadButton.addEventListener('click', async () => {
      await this.plugin.uploadToDraftBox(this.coverFile);
    });

    // 网络测试部分
    const networkTestSection = container.createEl('div');
    networkTestSection.style.marginBottom = '15px';
    
    const networkTestLabel = networkTestSection.createEl('h3', { text: '网络测试' });
    networkTestLabel.style.fontSize = '14px';
    networkTestLabel.style.marginBottom = '8px';
    
    const networkTestInput = networkTestSection.createEl('input', {
      type: 'text',
      placeholder: 'http://baidu.com'
    });
    networkTestInput.style.width = '100%';
    networkTestInput.style.padding = '8px';
    networkTestInput.style.marginBottom = '8px';
    networkTestInput.style.border = '1px solid var(--background-modifier-border)';
    networkTestInput.style.borderRadius = '4px';
    networkTestInput.value = this.plugin.settings.networkTestUrl;
    
    const networkTestButton = networkTestSection.createEl('button', { text: '测试连接' });
    networkTestButton.style.width = '100%';
    networkTestButton.style.padding = '8px';
    networkTestButton.style.marginBottom = '8px';
    networkTestButton.addEventListener('click', async () => {
      const testUrl = networkTestInput.value || this.plugin.settings.networkTestUrl;
      await this.plugin.testNetworkConnection(testUrl);
    });
    
    // 保存网络测试URL
    networkTestInput.addEventListener('change', async (e) => {
      this.plugin.settings.networkTestUrl = e.target.value;
      await this.plugin.saveSettings();
    });
    
    // 网络测试说明
    const networkTestNote = networkTestSection.createEl('p');
    networkTestNote.style.fontSize = '12px';
    networkTestNote.style.color = 'var(--text-muted)';
    networkTestNote.textContent = '提示：可以测试任何HTTP/HTTPS地址，包括微信公众号API地址';

    // API测试按钮
    const apiTestButton = container.createEl('button', { text: 'API测试' });
    apiTestButton.style.width = '100%';
    apiTestButton.style.marginBottom = '10px';
    apiTestButton.style.padding = '8px';
    apiTestButton.addEventListener('click', async () => {
      await this.plugin.testAPIKeys();
    });

    // 添加说明文本
    const noteEl = container.createEl('p');
    noteEl.style.fontSize = '12px';
    noteEl.style.color = 'var(--text-muted)';
    noteEl.textContent = '提示：上传前请确保已在设置中配置微信公众号信息';
  }

  async onClose() {
    // 清理资源
    this.contentEl.empty();
  }
}

// 设置面板
class NetworkTestSettingsTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: '微信公众号发布设置' });

    // 微信公众号配置
    containerEl.createEl('h3', { text: '微信公众号配置' });
    
    // AppID设置
    new Setting(containerEl)
      .setName('AppID')
      .setDesc('微信公众号AppID')
      .addText(text => text
        .setPlaceholder('请输入AppID')
        .setValue(this.plugin.settings.appId)
        .onChange(async (value) => {
          this.plugin.settings.appId = value;
          await this.plugin.saveSettings();
        }));

    // AppSecret设置
    new Setting(containerEl)
      .setName('AppSecret')
      .setDesc('微信公众号AppSecret')
      .addText(text => text
        .setPlaceholder('请输入AppSecret')
        .setValue(this.plugin.settings.appSecret)
        .onChange(async (value) => {
          this.plugin.settings.appSecret = value;
          await this.plugin.saveSettings();
        }));



    // 网络配置
    containerEl.createEl('h3', { text: '网络配置' });

    // 超时时间设置
    new Setting(containerEl)
      .setName('网络请求超时时间')
      .setDesc('网络请求的超时时间（毫秒）')
      .addText(text => text
        .setPlaceholder('5000')
        .setValue(this.plugin.settings.timeout.toString())
        .onChange(async (value) => {
          const timeout = parseInt(value);
          if (!isNaN(timeout) && timeout > 0) {
            this.plugin.settings.timeout = timeout;
            await this.plugin.saveSettings();
            new Notice('超时时间已更新', 2000);
          } else {
            new Notice('请输入有效的超时时间', 2000);
          }
        }));



  }
}

export default WeChatMPPublisher;
