import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

import DesksetNoteAPI from './api';

interface DesksetPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: DesksetPluginSettings = {
	mySetting: 'default'
}

export default class DesksetPlugin extends Plugin {
	settings: DesksetPluginSettings;

	config: any;
	api: DesksetNoteAPI;

	async onload() {
		await this.loadSettings();

		this.firstGetConfig()
	}

	// 第一步：读取配置
	async firstGetConfig() {
		try {
			this.config = JSON.parse(await this.app.vault.adapter.read('.deskset/noteapi.json'))
			this.secondStartNoteAPI()
		} catch {
			const checkConfigInterval = window.setInterval(async () => {
				try {
					this.config = JSON.parse(await this.app.vault.adapter.read('.deskset/noteapi.json'))
					clearInterval(checkConfigInterval)
					this.secondStartNoteAPI()
				} catch {}
			}, 5000)
			this.registerInterval(checkConfigInterval)
		}
	}

	// 第二步：启动 NoteAPI
	async secondStartNoteAPI() {
		console.log('启动 Deskset NoteAPI 服务')
		// 加载 NoteAPI 服务器
		this.api = new DesksetNoteAPI(this.app);
		this.api.open(this.config['noteapi-host'], this.config['noteapi-port']);

		// NoteAPI 通知 Back 自身状态：上线/下线
		await fetch(`http://${this.config['server-host']}:${this.config['server-port']}/v0/note/obsidian-manager/noteapi/online`);
		this.app.workspace.on('quit', () => fetch(`http://${this.config['server-host']}:${this.config['server-port']}/v0/note/obsidian-manager/noteapi/offline`))
	}

	async onunload() {
		if (this.config == undefined) { return }  // 配置读取失败，没有启动 NoteAPI 服务，直接返回
		await fetch(`http://${this.config['server-host']}:${this.config['server-port']}/v0/note/obsidian-manager/noteapi/offline`);
		this.api.close();
	}

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
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
