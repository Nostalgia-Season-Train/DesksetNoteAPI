// 代码参考：https://github.com/dragonwocky/obsidian-tray

export default class Window {
    private _electron_win: any

    constructor() {
        const { getCurrentWindow } = require('electron').remote

        this._electron_win = getCurrentWindow()
    }

    // Obsidian 需要处于最小化窗口状态，才会跳转到前台
    async fullscreen() {
        await this._electron_win.minimize()
        await this._electron_win.maximize()
    }
}
