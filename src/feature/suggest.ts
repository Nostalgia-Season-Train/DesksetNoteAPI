// 代码参考：https://github.com/darlal/obsidian-switcher-plus
import { App } from 'obsidian'

export default class Suggest {
    private _customSwitcher: any

    constructor(app: App) {
        const switcher = (app as any).internalPlugins.getPluginById('switcher').instance

        const CustomSwitcher = class extends switcher.QuickSwitcherModal {
            constructor() {
                super(app, switcher.options)
            }
            getSuggestions = (query: string) => {
                return super.getSuggestions(query)
            }
        }

        this._customSwitcher = new CustomSwitcher()
    }

    // 返回核心插件/快速切换的查询结果
    getSuggestions = async (query: string) => {
        return this._customSwitcher.getSuggestions(query) as any[]
    }
}
