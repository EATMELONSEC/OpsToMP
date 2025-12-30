import https from 'https';

export class WeChatMPAPI {
  constructor(settings) {
    this.settings = settings;
  }

  updateSettings(settings) {
    this.settings = settings;
  }

  async getAccessToken() {
    const now = Date.now();
    if (this.settings.accessToken && this.settings.accessTokenExpire > now) {
      return this.settings.accessToken;
    }

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
        this.settings.accessToken = response.access_token;
        this.settings.accessTokenExpire = now + (response.expires_in - 300) * 1000;
        return response.access_token;
      } else {
        throw new Error(`获取access_token失败: ${response.errmsg || '未知错误'}`);
      }
    } catch (error) {
      console.error('获取access_token错误:', error);
      throw error;
    }
  }

  async uploadCoverImage(accessToken, coverFile) {
    const self = this;
    
    return new Promise((resolve, reject) => {
      try {
        if (!coverFile || !(coverFile instanceof File)) {
          reject(new Error('无效的封面图片文件'));
          return;
        }
        
        console.log('准备上传封面图片:', coverFile.name, coverFile.size, coverFile.type);
        
        const reader = new FileReader();
        
        reader.onload = (event) => {
          try {
            const arrayBuffer = event.target.result;
            const fileBuffer = Buffer.from(arrayBuffer);
            
            console.log('文件读取成功，大小:', fileBuffer.length);
            
            const boundary = '----WebKitFormBoundary' + Date.now().toString(16);
            
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
            
            const totalLength = bodyBuffer.length + fileBuffer.length + footerBuffer.length;
            
            console.log('请求体总长度:', totalLength);
            
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
        
        reader.readAsArrayBuffer(coverFile);
        
      } catch (error) {
        console.error('上传封面图片错误:', error);
        reject(new Error('上传封面图片失败: ' + error.message));
      }
    });
  }

  async uploadSingleImage(accessToken, imageBuffer, fileName, mimeType) {
    return new Promise((resolve, reject) => {
      try {
        const boundary = '----WebKitFormBoundary' + Date.now().toString(16);
        
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
        
        const totalLength = bodyBuffer.length + imageBuffer.length + footerBuffer.length;
        
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
        
        req.write(bodyBuffer);
        req.write(imageBuffer);
        req.write(footerBuffer);
        req.end();
        
      } catch (error) {
        reject(new Error('上传图片错误: ' + error.message));
      }
    });
  }

  async createDraft(accessToken, title, content, coverMediaId = '', digest = '') {
    try {
      const url = `https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${accessToken}`;
      
      const article = {
        title: title,
        content: content,
        content_source_url: '',
        author: '',
        digest: digest || content.substring(0, 100) + '...',
        need_open_comment: 0,
        only_fans_can_comment: 0
      };
      
      if (coverMediaId) {
        article.thumb_media_id = coverMediaId;
        article.show_cover_pic = 1;
      } else {
        article.show_cover_pic = 0;
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
            console.log('获取已发布文章原始响应:', responseData);
            try {
              const result = JSON.parse(responseData);
              resolve(result);
            } catch (err) {
              console.error('解析JSON失败，原始数据:', responseData);
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
            console.log('获取已发布文章原始响应:', responseData);
            try {
              const result = JSON.parse(responseData);
              resolve(result);
            } catch (err) {
              console.error('解析JSON失败，原始数据:', responseData);
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

  async getDraftList(accessToken, offset = 0, count = 20, noContent = 0) {
    try {
      const url = `https://api.weixin.qq.com/cgi-bin/draft/batchget?access_token=${accessToken}`;
      
      const data = JSON.stringify({
        offset: offset,
        count: count,
        no_content: noContent
      });
      
      const response = await new Promise((resolve, reject) => {
        const options = {
          method: 'POST',
          hostname: 'api.weixin.qq.com',
          path: `/cgi-bin/draft/batchget?access_token=${accessToken}`,
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
            console.log('获取已发布文章原始响应:', responseData);
            try {
              const result = JSON.parse(responseData);
              resolve(result);
            } catch (err) {
              console.error('解析JSON失败，原始数据:', responseData);
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
        throw new Error(`获取草稿列表失败: ${response.errmsg}`);
      }
      
      return response;
      
    } catch (error) {
      console.error('获取草稿列表错误:', error);
      throw error;
    }
  }

  async deleteDraft(accessToken, mediaId) {
    try {
      const url = `https://api.weixin.qq.com/cgi-bin/draft/delete?access_token=${accessToken}`;
      
      const data = JSON.stringify({
        media_id: mediaId
      });
      
      const response = await new Promise((resolve, reject) => {
        const options = {
          method: 'POST',
          hostname: 'api.weixin.qq.com',
          path: `/cgi-bin/draft/delete?access_token=${accessToken}`,
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
            console.log('获取已发布文章原始响应:', responseData);
            try {
              const result = JSON.parse(responseData);
              resolve(result);
            } catch (err) {
              console.error('解析JSON失败，原始数据:', responseData);
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
        throw new Error(`删除草稿失败: ${response.errmsg}`);
      }
      
      return response;
      
    } catch (error) {
      console.error('删除草稿错误:', error);
      throw error;
    }
  }

  async getPublishedArticles(accessToken, offset = 0, count = 20) {
    try {
      const url = `https://api.weixin.qq.com/cgi-bin/freepublish/batchget?access_token=${accessToken}`;
      
      const data = JSON.stringify({
        offset: offset,
        count: count,
        no_content: 0
      });
      
      const response = await new Promise((resolve, reject) => {
        const options = {
          method: 'POST',
          hostname: 'api.weixin.qq.com',
          path: `/cgi-bin/freepublish/batchget?access_token=${accessToken}`,
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
            console.log('获取已发布文章原始响应:', responseData);
            try {
              const result = JSON.parse(responseData);
              resolve(result);
            } catch (err) {
              console.error('解析JSON失败，原始数据:', responseData);
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
        if (response.errcode === 48001) {
          throw new Error('公众号未授权使用此接口。请前往微信公众平台（公众平台官网 - 开发者中心）开启"发布能力"相关权限。');
        }
        throw new Error(`获取已发布文章失败: ${response.errmsg}`);
      }
      
      return response;
      
    } catch (error) {
      console.error('获取已发布文章错误:', error);
      throw error;
    }
  }

  async deletePublishedArticle(accessToken, articleId) {
    try {
      const url = `https://api.weixin.qq.com/cgi-bin/freepublish/delete?access_token=${accessToken}`;
      
      const data = JSON.stringify({
        article_id: articleId
      });
      
      const response = await new Promise((resolve, reject) => {
        const options = {
          method: 'POST',
          hostname: 'api.weixin.qq.com',
          path: `/cgi-bin/freepublish/delete?access_token=${accessToken}`,
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
        throw new Error(`删除已发布文章失败: ${response.errmsg}`);
      }
      
      return response;
      
    } catch (error) {
      console.error('删除已发布文章错误:', error);
      throw error;
    }
  }
}
