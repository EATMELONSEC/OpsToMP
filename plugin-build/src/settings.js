import { PluginSettingTab, Setting, Notice } from 'obsidian';

export class NetworkTestSettingsTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: '微信公众号发布设置' });

    containerEl.createEl('h3', { text: '微信公众号配置' });
    
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

    containerEl.createEl('h3', { text: '网络配置' });

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
