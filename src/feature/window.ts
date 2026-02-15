// 代码参考：https://github.com/dragonwocky/obsidian-tray
import { app } from 'src/core/global'
const { getCurrentWindow } = require('electron').remote
const _electron_win = getCurrentWindow()


/* ==== 打开 Obsidian 窗口 ==== */
export const openObsidian = async () => {
  // Obsidian 需要处于最小化窗口状态，才会跳转到前台
  await _electron_win.minimize()
  await _electron_win.maximize()
}


/* ==== 打开 Obsidian 某个文件 ==== */
export const openObsidianFile = async (path: string) => {
  const tfile = app.vault.getFileByPath(path)
  if (tfile != null) {
    await app.workspace.getLeaf(true).openFile(tfile)
    await openObsidian()
  }
  // true 打开成功；false 打开失败
  return tfile != null ? true : false
}
