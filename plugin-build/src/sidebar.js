import { ItemView } from 'obsidian';

export class PublisherSidebarView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.coverImage = '';
    this.coverFile = null;
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
          this.plugin.previewCurrentDocument(event.target.result);
        };
        reader.readAsDataURL(this.coverFile);
      } else {
        this.plugin.previewCurrentDocument();
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

    const uploadButton = container.createEl('button', { text: '上传至草稿箱' });
    uploadButton.className = 'mod-cta';
    uploadButton.style.width = '100%';
    uploadButton.style.marginBottom = '10px';
    uploadButton.style.padding = '8px';
    uploadButton.addEventListener('click', async () => {
      await this.plugin.uploadToDraftBox(this.coverFile);
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

  async onClose() {
    this.contentEl.empty();
  }
}
