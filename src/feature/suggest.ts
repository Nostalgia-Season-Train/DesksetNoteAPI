// 代码参考：https://github.com/darlal/obsidian-switcher-plus
import { app } from 'src/core/global'

const switcher = (app as any).internalPlugins.getPluginById('switcher').instance

const CustomSwitcher = class extends switcher.QuickSwitcherModal {
  constructor() {
    super(app, switcher.options)
  }
  getSuggestions = (query: string) => {
    return super.getSuggestions(query)
  }
}
const customSwitcher = new CustomSwitcher()


/* ==== 根据 快速切换 返回查询建议 ==== */
// 例：query = 'q'，返回所有以 q 开头的笔记
export const getSuggestions = async (query: string) => {
  return (customSwitcher.getSuggestions(query) as any[]).map(item => {
    if (item?.type != 'file')
      return null
    if (item?.file?.basename == undefined || item?.file?.extension == undefined || item?.file?.path == undefined)
      return null
    return {
      name: item.file.basename,
      type: item.file.extension,
      path: item.file.path
    }
  }).filter(item => item != null)
}
