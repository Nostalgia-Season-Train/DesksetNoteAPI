import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

import { DesksetPluginSetting as DesksetPluginSettings } from './core/setting'
import { randomString } from './core/random'
import DesksetNoteAPI from './api';

const DEFAULT_SETTINGS: DesksetPluginSettings = {
	host: '127.0.0.1',
	port: 6528,
	username: 'noteapi-user' + randomString(5, 10),
	password: 'noteapi-pswd' + randomString(10, 20)
}

export default class DesksetPlugin extends Plugin {
	settings: DesksetPluginSettings

	api: DesksetNoteAPI

	async onload() {
		await this.loadSettings()
		this.addSettingTab(new DesksetPluginSettingTab(this.app, this))

		this.api = new DesksetNoteAPI(this.app, this.settings, this)
		this.app.workspace.on('quit', async () => await this.api.close())

		try { await this.api.open() } catch (err) { new Notice(`无法连接数字桌搭\n${err}`) }
		this.registerInterval(window.setInterval(async () => {
			try { await this.api.open() } catch {}
		}, 10 * 1000))
	}

	async onunload() {
		await this.saveSettings()

		await this.api.close()
	}

	/* --- 设置读写 --- */
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}
	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class DesksetPluginSettingTab extends PluginSettingTab {
	plugin: DesksetPlugin;

	constructor(app: App, plugin: DesksetPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('端口')
			.addText(text => text
				.setValue(String(this.plugin.settings.port))
				.onChange(async (value) => {
					this.plugin.settings.port = Number(value)
					await this.plugin.saveSettings()
				}));

		new Setting(containerEl)
			.setName('用户名')
			.addText(text => text
				.setValue(String(this.plugin.settings.username))
				.onChange(async (value) => {
					this.plugin.settings.username = String(value)
					await this.plugin.saveSettings()
				}));

		new Setting(containerEl)
			.setName('密码')
			.addText(text => text
				.setValue(String(this.plugin.settings.password))
				.onChange(async (value) => {
					this.plugin.settings.password = String(value)
					await this.plugin.saveSettings()
				}));
	}
}
