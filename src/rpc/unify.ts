import { App } from 'obsidian'
import { DataviewApi, getAPI } from 'obsidian-dataview'

import { openObsidian, openObsidianFile } from 'src/feature/window'
import { getOneDiary, getAllDiarysInOneMonth } from 'src/feature/diary'
import { getSuggestions } from 'src/feature/suggest'
import { statsFile } from 'src/feature/_vault/filter'
import { getVaultInfo, getActiveFile } from 'src/feature/_vault/info'
import { getHeats } from 'src/feature/_vault/heatmap'


export default class Unify {
  private _app: App
  private _dataviewApi: DataviewApi

  constructor(app: App) {
    this._app = app
    this._dataviewApi = getAPI(this._app)

    if (this._dataviewApi == undefined) {
      throw Error('Dataview not enable')
    }
  }

  /* --- 仓库 --- */
  get_vault_status = getVaultInfo
  get_heatmap = getHeats
  get_active_file = getActiveFile

  /* --- 查询建议 --- */
  suggest_by_switcher = getSuggestions

  /* --- 日记 --- */
  read_diary = getOneDiary
  list_diarys_in_a_month = getAllDiarysInOneMonth

  /* --- Obsidian 窗口 --- */
  open_vault = openObsidian
  open_in_obsidian = openObsidianFile

  /* --- 数据分析 --- */
  filter_frontmatter = statsFile
}
