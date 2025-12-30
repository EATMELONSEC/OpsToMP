import { ItemView, Notice } from 'obsidian';
import { themes } from './utils.js';

export class PublisherSidebarView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.coverImage = '';
    this.coverFile = null;
    this.drafts = [];
    this.currentView = 'main';
    this.digest = '';
    this.currentTheme = 'default';
    this.draftPage = {
      currentPage: 0,
      pageSize: 5,
      totalItems: 0,
      totalPages: 0
    };
    this.publishedPage = {
      currentPage: 0,
      pageSize: 5,
      totalItems: 0,
      totalPages: 0
    };
    this.publishedArticles = [];
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
    this.renderMainView();
  }

  renderMainView() {
    this.currentView = 'main';
    this.currentTheme = this.plugin.settings.defaultTheme || 'default';
    const container = this.contentEl;
    container.empty();

    const titleEl = container.createEl('h2', { text: '微信公众号发布面板' });
    titleEl.style.marginBottom = '20px';

    const previewButton = container.createEl('button', { text: '预览当前文档' });
    previewButton.className = 'mod-cta';
    previewButton.style.width = '100%';
    previewButton.style.marginBottom = '10px';
    previewButton.style.padding = '8px';
    previewButton.addEventListener('click', () => {
      if (this.coverFile) {
        const reader = new FileReader();
        reader.onload = (event) => {
          this.plugin.previewCurrentDocument(event.target.result, this.currentTheme);
        };
        reader.readAsDataURL(this.coverFile);
      } else {
        this.plugin.previewCurrentDocument('', this.currentTheme);
      }
    });

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
    
    coverInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.coverFile = file;
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

    const digestSection = container.createEl('div');
    digestSection.style.marginBottom = '15px';
    
    const digestLabel = digestSection.createEl('h3', { text: '文章摘要' });
    digestLabel.style.fontSize = '14px';
    digestLabel.style.marginBottom = '8px';
    
    const digestInput = digestSection.createEl('textarea', {
      placeholder: '请输入文章摘要（选填，120字以内）',
      rows: 3
    });
    digestInput.style.width = '100%';
    digestInput.style.padding = '8px';
    digestInput.style.marginBottom = '8px';
    digestInput.style.border = '1px solid var(--background-modifier-border)';
    digestInput.style.borderRadius = '4px';
    digestInput.style.resize = 'vertical';
    digestInput.style.fontFamily = 'inherit';
    digestInput.style.fontSize = '14px';
    
    digestInput.addEventListener('input', (e) => {
      this.digest = e.target.value;
      if (this.digest.length > 120) {
        this.digest = this.digest.substring(0, 120);
        digestInput.value = this.digest;
      }
    });

    const themeSection = container.createEl('div');
    themeSection.style.marginBottom = '15px';
    
    const themeLabel = themeSection.createEl('h3', { text: '预览主题' });
    themeLabel.style.fontSize = '14px';
    themeLabel.style.marginBottom = '8px';
    
    const themeSelector = themeSection.createEl('div');
    themeSelector.style.display = 'flex';
    themeSelector.style.flexWrap = 'wrap';
    themeSelector.style.gap = '6px';
    
    Object.keys(themes).forEach(themeKey => {
      const theme = themes[themeKey];
      const themeButton = themeSelector.createEl('button', { text: theme.name });
      themeButton.style.flex = '1';
      themeButton.style.minWidth = '60px';
      themeButton.style.padding = '6px 12px';
      themeButton.style.fontSize = '12px';
      themeButton.style.border = '1px solid var(--background-modifier-border)';
      themeButton.style.borderRadius = '4px';
      themeButton.style.cursor = 'pointer';
      themeButton.style.transition = 'all 0.2s';
      
      themeButton.addEventListener('click', () => {
        this.currentTheme = themeKey;
        this.updateThemeButtons(themeSelector);
        new Notice(`已切换到${theme.name}主题`, 2000);
      });
    });
    
    this.updateThemeButtons(themeSelector);

    const uploadButton = container.createEl('button', { text: '上传至草稿箱' });
    uploadButton.className = 'mod-cta';
    uploadButton.style.width = '100%';
    uploadButton.style.marginBottom = '10px';
    uploadButton.style.padding = '8px';
    uploadButton.addEventListener('click', async () => {
      await this.plugin.uploadToDraftBox(this.coverFile, this.digest);
    });

    const divider = container.createEl('hr');
    divider.style.margin = '15px 0';
    divider.style.border = 'none';
    divider.style.borderTop = '1px solid var(--background-modifier-border)';

    const draftListButton = container.createEl('button', { text: '查看草稿列表' });
    draftListButton.style.width = '100%';
    draftListButton.style.marginBottom = '10px';
    draftListButton.style.padding = '8px';
    draftListButton.addEventListener('click', async () => {
      this.draftPage.currentPage = 0;
      await this.loadDraftList();
    });

    const contentManageButton = container.createEl('button', { text: '内容管理' });
    contentManageButton.style.width = '100%';
    contentManageButton.style.marginBottom = '10px';
    contentManageButton.style.padding = '8px';
    contentManageButton.addEventListener('click', async () => {
      this.publishedPage.currentPage = 0;
      await this.loadPublishedArticles();
    });

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
    
    networkTestInput.addEventListener('change', async (e) => {
      this.plugin.settings.networkTestUrl = e.target.value;
      await this.plugin.saveSettings();
    });
    
    const networkTestNote = networkTestSection.createEl('p');
    networkTestNote.style.fontSize = '12px';
    networkTestNote.style.color = 'var(--text-muted)';
    networkTestNote.textContent = '提示：可以测试任何HTTP/HTTPS地址，包括微信公众号API地址';

    const apiTestButton = container.createEl('button', { text: 'API测试' });
    apiTestButton.style.width = '100%';
    apiTestButton.style.marginBottom = '10px';
    apiTestButton.style.padding = '8px';
    apiTestButton.addEventListener('click', async () => {
      await this.plugin.testAPIKeys();
    });

    const noteEl = container.createEl('p');
    noteEl.style.fontSize = '12px';
    noteEl.style.color = 'var(--text-muted)';
    noteEl.textContent = '提示：上传前请确保已在设置中配置微信公众号信息';
  }

  async loadDraftList() {
    this.currentView = 'drafts';
    const container = this.contentEl;
    container.empty();
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.height = '100%';

    const header = container.createEl('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = '15px';
    header.style.flexShrink = '0';

    const titleEl = header.createEl('h2', { text: '草稿列表' });
    titleEl.style.margin = '0';

    const backButton = header.createEl('button', { text: '← 返回' });
    backButton.style.padding = '4px 8px';
    backButton.addEventListener('click', () => {
      this.renderMainView();
    });

    const loadingEl = container.createEl('div', { text: '正在加载草稿列表...' });
    loadingEl.style.textAlign = 'center';
    loadingEl.style.padding = '20px';
    loadingEl.style.color = 'var(--text-muted)';

    try {
      const accessToken = await this.plugin.api.getAccessToken();
      const offset = this.draftPage.currentPage * this.draftPage.pageSize;
      const result = await this.plugin.api.getDraftList(accessToken, offset, this.draftPage.pageSize, 1);
      
      this.drafts = result.item || [];
      this.draftPage.totalItems = result.total_count || 0;
      this.draftPage.totalPages = Math.ceil(this.draftPage.totalItems / this.draftPage.pageSize);
      
      loadingEl.remove();

      if (this.drafts.length === 0) {
        const emptyEl = container.createEl('div', { text: '暂无草稿' });
        emptyEl.style.textAlign = 'center';
        emptyEl.style.padding = '20px';
        emptyEl.style.color = 'var(--text-muted)';
        
        if (this.draftPage.currentPage > 0) {
          const backToFirstButton = container.createEl('button', { text: '返回第一页' });
          backToFirstButton.style.display = 'block';
          backToFirstButton.style.margin = '10px auto';
          backToFirstButton.addEventListener('click', () => {
            this.draftPage.currentPage = 0;
            this.loadDraftList();
          });
        }
        return;
      }

      const listContainer = container.createEl('div');
      listContainer.style.flex = '1';
      listContainer.style.overflowY = 'auto';
      listContainer.style.minHeight = '0';

      this.drafts.forEach((draft, index) => {
        const article = draft.content.news_item[0];
        
        const draftItem = listContainer.createEl('div');
        draftItem.style.border = '1px solid var(--background-modifier-border)';
        draftItem.style.borderRadius = '4px';
        draftItem.style.padding = '10px';
        draftItem.style.marginBottom = '8px';
        draftItem.style.backgroundColor = 'var(--background-secondary)';

        const draftTitle = draftItem.createEl('h4', { text: article.title });
        draftTitle.style.margin = '0 0 6px 0';
        draftTitle.style.fontSize = '13px';
        draftTitle.style.fontWeight = '600';
        draftTitle.style.lineHeight = '1.4';

        const draftMeta = draftItem.createEl('div');
        draftMeta.style.fontSize = '11px';
        draftMeta.style.color = 'var(--text-muted)';
        draftMeta.style.marginBottom = '6px';
        draftMeta.textContent = `ID: ${article.thumb_media_id || draft.media_id}`;

        const actions = draftItem.createEl('div');
        actions.style.display = 'flex';
        actions.style.gap = '6px';

        const publishButton = actions.createEl('button', { text: '发布' });
        publishButton.style.flex = '1';
        publishButton.style.padding = '3px 6px';
        publishButton.style.fontSize = '11px';
        publishButton.addEventListener('click', async () => {
          if (confirm(`确定要发布草稿"${article.title}"吗？`)) {
            try {
              const publishResult = await this.plugin.api.publishDraft(accessToken, draft.media_id);
              new Notice(`发布成功！文章ID: ${publishResult.publish_id}`, 5000);
              this.draftPage.currentPage = 0;
              await this.loadDraftList();
            } catch (error) {
              new Notice(`发布失败: ${error.message}`, 5000);
            }
          }
        });

        const deleteButton = actions.createEl('button', { text: '删除' });
        deleteButton.style.flex = '1';
        deleteButton.style.padding = '3px 6px';
        deleteButton.style.fontSize = '11px';
        deleteButton.style.backgroundColor = 'var(--interactive-danger)';
        deleteButton.style.color = 'var(--text-on-accent)';
        deleteButton.addEventListener('click', async () => {
          if (confirm(`确定要删除草稿"${article.title}"吗？此操作不可恢复！`)) {
            try {
              await this.plugin.api.deleteDraft(accessToken, draft.media_id);
              new Notice('删除成功', 3000);
              this.draftPage.currentPage = 0;
              await this.loadDraftList();
            } catch (error) {
              new Notice(`删除失败: ${error.message}`, 5000);
            }
          }
        });
      });

      const paginationContainer = container.createEl('div');
      paginationContainer.style.marginTop = '10px';
      paginationContainer.style.paddingTop = '10px';
      paginationContainer.style.borderTop = '1px solid var(--background-modifier-border)';
      paginationContainer.style.flexShrink = '0';
      
      const pageInfo = paginationContainer.createEl('div');
      pageInfo.style.textAlign = 'center';
      pageInfo.style.fontSize = '12px';
      pageInfo.style.color = 'var(--text-muted)';
      pageInfo.style.marginBottom = '8px';
      pageInfo.textContent = `第 ${this.draftPage.currentPage + 1} / ${this.draftPage.totalPages} 页，共 ${this.draftPage.totalItems} 个草稿`;
      
      const paginationButtons = paginationContainer.createEl('div');
      paginationButtons.style.display = 'flex';
      paginationButtons.style.justifyContent = 'center';
      paginationButtons.style.gap = '8px';
      
      const prevButton = paginationButtons.createEl('button', { text: '上一页' });
      prevButton.style.flex = '1';
      prevButton.style.padding = '5px 10px';
      prevButton.style.fontSize = '12px';
      prevButton.disabled = this.draftPage.currentPage === 0;
      prevButton.style.opacity = this.draftPage.currentPage === 0 ? '0.5' : '1';
      prevButton.addEventListener('click', () => {
        if (this.draftPage.currentPage > 0) {
          this.draftPage.currentPage--;
          this.loadDraftList();
        }
      });
      
      const nextButton = paginationButtons.createEl('button', { text: '下一页' });
      nextButton.style.flex = '1';
      nextButton.style.padding = '5px 10px';
      nextButton.style.fontSize = '12px';
      nextButton.disabled = this.draftPage.currentPage >= this.draftPage.totalPages - 1;
      nextButton.style.opacity = this.draftPage.currentPage >= this.draftPage.totalPages - 1 ? '0.5' : '1';
      nextButton.addEventListener('click', () => {
        if (this.draftPage.currentPage < this.draftPage.totalPages - 1) {
          this.draftPage.currentPage++;
          this.loadDraftList();
        }
      });

    } catch (error) {
      loadingEl.remove();
      const errorEl = container.createEl('div', { text: `加载失败: ${error.message}` });
      errorEl.style.textAlign = 'center';
      errorEl.style.padding = '20px';
      errorEl.style.color = 'var(--text-error)';
      
      const retryButton = container.createEl('button', { text: '重试' });
      retryButton.style.display = 'block';
      retryButton.style.margin = '10px auto';
      retryButton.addEventListener('click', () => {
        this.loadDraftList();
      });
    }
  }

  async loadPublishedArticles() {
    this.currentView = 'published';
    const container = this.contentEl;
    container.empty();
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.height = '100%';

    const header = container.createEl('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = '15px';
    header.style.flexShrink = '0';

    const titleEl = header.createEl('h2', { text: '已发布文章' });
    titleEl.style.margin = '0';

    const backButton = header.createEl('button', { text: '← 返回' });
    backButton.style.padding = '4px 8px';
    backButton.addEventListener('click', () => {
      this.renderMainView();
    });

    const loadingEl = container.createEl('div', { text: '正在加载已发布文章...' });
    loadingEl.style.textAlign = 'center';
    loadingEl.style.padding = '20px';
    loadingEl.style.color = 'var(--text-muted)';

    try {
      const accessToken = await this.plugin.api.getAccessToken();
      const offset = this.publishedPage.currentPage * this.publishedPage.pageSize;
      const result = await this.plugin.api.getPublishedArticles(accessToken, offset, this.publishedPage.pageSize);
      
      this.publishedArticles = result.item || [];
      this.publishedPage.totalItems = result.total_count || 0;
      this.publishedPage.totalPages = Math.ceil(this.publishedPage.totalItems / this.publishedPage.pageSize);
      
      loadingEl.remove();

      if (this.publishedArticles.length === 0) {
        const emptyEl = container.createEl('div', { text: '暂无已发布文章' });
        emptyEl.style.textAlign = 'center';
        emptyEl.style.padding = '20px';
        emptyEl.style.color = 'var(--text-muted)';
        
        if (this.publishedPage.currentPage > 0) {
          const backToFirstButton = container.createEl('button', { text: '返回第一页' });
          backToFirstButton.style.display = 'block';
          backToFirstButton.style.margin = '10px auto';
          backToFirstButton.addEventListener('click', () => {
            this.publishedPage.currentPage = 0;
            this.loadPublishedArticles();
          });
        }
        return;
      }

      const listContainer = container.createEl('div');
      listContainer.style.flex = '1';
      listContainer.style.overflowY = 'auto';
      listContainer.style.minHeight = '0';

      this.publishedArticles.forEach((articleGroup) => {
        const article = articleGroup.content.news_item[0];
        const articleId = articleGroup.article_id;
        
        const articleItem = listContainer.createEl('div');
        articleItem.style.border = '1px solid var(--background-modifier-border)';
        articleItem.style.borderRadius = '4px';
        articleItem.style.padding = '10px';
        articleItem.style.marginBottom = '8px';
        articleItem.style.backgroundColor = 'var(--background-secondary)';

        const articleTitle = articleItem.createEl('h4', { text: article.title });
        articleTitle.style.margin = '0 0 6px 0';
        articleTitle.style.fontSize = '13px';
        articleTitle.style.fontWeight = '600';
        articleTitle.style.lineHeight = '1.4';

        const articleMeta = articleItem.createEl('div');
        articleMeta.style.fontSize = '11px';
        articleMeta.style.color = 'var(--text-muted)';
        articleMeta.style.marginBottom = '6px';
        articleMeta.textContent = `ID: ${articleId}`;

        const actions = articleItem.createEl('div');
        actions.style.display = 'flex';
        actions.style.gap = '6px';

        const deleteButton = actions.createEl('button', { text: '删除' });
        deleteButton.style.flex = '1';
        deleteButton.style.padding = '3px 6px';
        deleteButton.style.fontSize = '11px';
        deleteButton.style.backgroundColor = 'var(--interactive-danger)';
        deleteButton.style.color = 'var(--text-on-accent)';
        deleteButton.addEventListener('click', async () => {
          if (confirm(`确定要删除已发布文章"${article.title}"吗？此操作不可恢复！`)) {
            try {
              await this.plugin.api.deletePublishedArticle(accessToken, articleId);
              new Notice('删除成功', 3000);
              this.publishedPage.currentPage = 0;
              await this.loadPublishedArticles();
            } catch (error) {
              new Notice(`删除失败: ${error.message}`, 5000);
            }
          }
        });
      });

      const paginationContainer = container.createEl('div');
      paginationContainer.style.marginTop = '10px';
      paginationContainer.style.paddingTop = '10px';
      paginationContainer.style.borderTop = '1px solid var(--background-modifier-border)';
      paginationContainer.style.flexShrink = '0';
      
      const pageInfo = paginationContainer.createEl('div');
      pageInfo.style.textAlign = 'center';
      pageInfo.style.fontSize = '12px';
      pageInfo.style.color = 'var(--text-muted)';
      pageInfo.style.marginBottom = '8px';
      pageInfo.textContent = `第 ${this.publishedPage.currentPage + 1} / ${this.publishedPage.totalPages} 页，共 ${this.publishedPage.totalItems} 篇文章`;
      
      const paginationButtons = paginationContainer.createEl('div');
      paginationButtons.style.display = 'flex';
      paginationButtons.style.justifyContent = 'center';
      paginationButtons.style.gap = '8px';
      
      const prevButton = paginationButtons.createEl('button', { text: '上一页' });
      prevButton.style.flex = '1';
      prevButton.style.padding = '5px 10px';
      prevButton.style.fontSize = '12px';
      prevButton.disabled = this.publishedPage.currentPage === 0;
      prevButton.style.opacity = this.publishedPage.currentPage === 0 ? '0.5' : '1';
      prevButton.addEventListener('click', () => {
        if (this.publishedPage.currentPage > 0) {
          this.publishedPage.currentPage--;
          this.loadPublishedArticles();
        }
      });
      
      const nextButton = paginationButtons.createEl('button', { text: '下一页' });
      nextButton.style.flex = '1';
      nextButton.style.padding = '5px 10px';
      nextButton.style.fontSize = '12px';
      nextButton.disabled = this.publishedPage.currentPage >= this.publishedPage.totalPages - 1;
      nextButton.style.opacity = this.publishedPage.currentPage >= this.publishedPage.totalPages - 1 ? '0.5' : '1';
      nextButton.addEventListener('click', () => {
        if (this.publishedPage.currentPage < this.publishedPage.totalPages - 1) {
          this.publishedPage.currentPage++;
          this.loadPublishedArticles();
        }
      });

    } catch (error) {
      loadingEl.remove();
      const errorEl = container.createEl('div', { text: `加载失败: ${error.message}` });
      errorEl.style.textAlign = 'center';
      errorEl.style.padding = '20px';
      errorEl.style.color = 'var(--text-error)';
      
      const retryButton = container.createEl('button', { text: '重试' });
      retryButton.style.display = 'block';
      retryButton.style.margin = '10px auto';
      retryButton.addEventListener('click', () => {
        this.loadPublishedArticles();
      });
    }
  }

  updateThemeButtons(themeSelector) {
    const buttons = themeSelector.querySelectorAll('button');
    buttons.forEach(btn => {
      const themeName = Object.keys(themes).find(key => themes[key].name === btn.textContent);
      const isSelected = themeName === this.currentTheme;
      btn.style.backgroundColor = isSelected ? 'var(--interactive-accent)' : 'var(--background-secondary)';
      btn.style.color = isSelected ? 'var(--text-on-accent)' : 'var(--text-normal)';
    });
  }

  async onClose() {
    this.contentEl.empty();
  }
}
