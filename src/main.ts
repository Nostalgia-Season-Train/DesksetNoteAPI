import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian'

import { DesksetPluginSetting, NewTaskPosition } from './core/setting'
import { deskset } from './core/global'
import DesksetNoteAPI from './rpc/api'

export default class DesksetPlugin extends Plugin {
  settings: DesksetPluginSetting

  api: DesksetNoteAPI

  async onload() {
    await this.loadSettings()
    this.addSettingTab(new DesksetPluginSettingTab(this.app, this))

    this.api = new DesksetNoteAPI(this.app, this.settings, this)
    this.app.workspace.on('quit', async () => await this.api.close())

    try { await this.api.open() } catch (err) { new Notice(`无法连接数字桌搭\n${err}`) }
    this.registerInterval(window.setInterval(async () => {
      try { await this.api.open() } catch { }
    }, 10 * 1000))
  }

  async onunload() {
    await this.saveSettings()

    await this.api.close()
  }

  /* --- 设置读写 --- */
  async loadSettings() {
    deskset.setting = Object.assign({}, deskset.setting, await this.loadData())
    this.settings = deskset.setting
    // console.log(`this.settings 指向 deskset.setting 为 ${this.settings === deskset.setting}，C 是世界上最好的语言`)
  }
  async saveSettings() {
    await this.saveData(this.settings)
  }
}

class DesksetPluginSettingTab extends PluginSettingTab {
  plugin: DesksetPlugin

  constructor(app: App, plugin: DesksetPlugin) {
    super(app, plugin)
    this.plugin = plugin
  }

  display(): void {
    const { containerEl } = this

    containerEl.empty()

    new Setting(containerEl)
      .setName('端口')
      .addText(text => text
        .setValue(String(this.plugin.settings.port))
        .onChange(async (value) => {
          this.plugin.settings.port = Number(value)
          await this.plugin.saveSettings()
        }))

    new Setting(containerEl)
      .setName('用户名')
      .addText(text => text
        .setValue(String(this.plugin.settings.username))
        .onChange(async (value) => {
          this.plugin.settings.username = String(value)
          await this.plugin.saveSettings()
        }))

    new Setting(containerEl)
      .setName('密码')
      .addText(text => text
        .setValue(String(this.plugin.settings.password))
        .onChange(async (value) => {
          this.plugin.settings.password = String(value)
          await this.plugin.saveSettings()
        }))

    new Setting(containerEl)
      .setName('新创建任务的位置')
      .addDropdown(dropdown => {
        dropdown
          .addOption(NewTaskPosition.LatestTask, '文件最后一个任务之后')
          .addOption(NewTaskPosition.LatestLine, '文件最后一行')
          .setValue(this.plugin.settings.task.newTaskPosition)
          .onChange(async (value: NewTaskPosition) => {
            this.plugin.settings.task.newTaskPosition = value
            await this.plugin.saveSettings()
          })
      })
  }
}
