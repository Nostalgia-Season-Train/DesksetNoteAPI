import { App } from 'obsidian'
import { DataviewApi, getAPI } from 'obsidian-dataview'

import { getDiarySetting, getOneDiary, getAllDiarysInOneMonth } from 'src/feature/diary'
import { getAllTasks, toggleTask, creatTask, editTask, deletTask } from 'src/feature/_note/task'
import { getSuggestions } from 'src/feature/suggest'
import { statsFile } from 'src/feature/_vault/filter'
import { getVaultInfo, getActiveFile } from 'src/feature/_vault/info'
import { getHeats } from 'src/feature/_vault/heatmap'
import { getAllCommands, executeCommand } from 'src/feature/command'
import { openObsidian, openObsidianFile } from 'src/feature/winpage'


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
  get_diary_setting = getDiarySetting
  read_diary = getOneDiary
  list_diarys_in_a_month = getAllDiarysInOneMonth

  /* --- 任务 --- */
  get_all_tasks = getAllTasks
  toggle_task = toggleTask
  create_task = creatTask
  edit_task = editTask
  delete_task = deletTask

  /* --- 数据分析 --- */
  filter_frontmatter = statsFile

  /* --- 命令 Command --- */
  list_commands = getAllCommands
  execute_command = executeCommand

  /* --- 窗口页面 Winpage --- */
  open_vault_on_obsidian = openObsidian
  open_file_on_obsidian = openObsidianFile
}
