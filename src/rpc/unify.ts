import { App } from 'obsidian'
import { DataviewApi, getAPI } from 'obsidian-dataview'

import { openObsidian, openObsidianFile } from '../feature/window'
import { getOneDiary, getAllDiarysInOneMonth } from 'src/feature/diary'
import Suggest from '../feature/suggest'
import { statsFile } from 'src/feature/_vault/filter'
import { getVaultInfo } from 'src/feature/_vault/info'
import { getHeats } from 'src/feature/_vault/heatmap'


export default class Unify {
  private _app: App
  private _dataviewApi: DataviewApi

  private _suggest: Suggest

  constructor(app: App) {
    this._app = app
    this._dataviewApi = getAPI(this._app)

    if (this._dataviewApi == undefined) {
      throw Error('Dataview not enable')
    }

    this._suggest = new Suggest(this._app)
  }

  // 获取仓库状态
  get_vault_status = getVaultInfo
  get_heatmap = getHeats

  // 获取活跃文件（当前聚焦的标签页）
  get_active_file = async (): Promise<string> => {
    return this._app.workspace.getActiveFile()?.path ?? ''
  }

  // 返回查询建议，数据来源：核心插件/快速切换
  suggest_by_switcher = async (query: string) => {
    return (await this._suggest.getSuggestions(query)).map(item => {
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

  /* --- 日记 --- */
  read_diary = getOneDiary
  list_diarys_in_a_month = getAllDiarysInOneMonth

  /* --- Obsidian 窗口 --- */
  open_vault = openObsidian
  open_in_obsidian = openObsidianFile

  /* --- 数据分析 --- */
  filter_frontmatter = statsFile
}
