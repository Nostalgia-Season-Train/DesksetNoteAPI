import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

import { DesksetPluginSetting as DesksetPluginSettings } from './core/setting'
import { randomString } from './core/random'
import DesksetNoteAPI from './api';

const DEFAULT_SETTINGS: DesksetPluginSettings = {
	host: '127.0.0.1',
	port: 6528,
	username: 'noteapi-user' + randomString(5, 10),
	password: 'noteapi-pswd' + randomString(10, 20),
	profile: {
		avatar: '',
		name: '数字桌搭',
		bio: '数字桌搭，在桌面栽培灵感，让创意随时开花'
	},
	greets: [
		{ id: '20250610000000000000', start: '0600', end: '1200', open: '早上好', content: '今天也是元气满满的一天！' },
		{ id: '20250610000000000001', start: '1200', end: '1800', open: '下午好', content: '一杯绿茶如何？' },
		{ id: '20250610000000000002', start: '1800', end: '2400', open: '晚上好', content: '是时候休息了' },
		{ id: '20250610000000000003', start: '0000', end: '0600', open: '夜深了', content: '忘记工作，睡觉去吧~' }
	]
}

export default class DesksetPlugin extends Plugin {
	settings: DesksetPluginSettings

	api: DesksetNoteAPI | undefined  // 初始化失败 undefined

	async onload() {
		await this.loadSettings()
		this.addSettingTab(new DesksetPluginSettingTab(this.app, this))

		this.api = new DesksetNoteAPI(this.app, this.settings, this)
		this.api.open()
		this.app.workspace.on('quit', async () => { if (this.api != undefined) await this.api.close() })
	}

	async onunload() {
		await this.saveSettings()

		if (this.api == undefined)
			return
		await this.api.close()
		delete this.api
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
	}
}
