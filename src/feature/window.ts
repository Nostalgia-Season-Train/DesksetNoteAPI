// 代码参考：https://github.com/dragonwocky/obsidian-tray
const { getCurrentWindow } = require('electron').remote
const _electron_win = getCurrentWindow()


/* ==== 打开 Obsidian 窗口 ==== */
export const openObsidianWin = async () => {
  // Obsidian 需要处于最小化窗口状态，才会跳转到前台
  await _electron_win.minimize()
  await _electron_win.maximize()
}
