import { App } from 'obsidian'
import { DataviewApi, getAPI } from 'obsidian-dataview'

import {
  getDiarySetting, listDiarypropsInMonth,
  readDiary, createDiary, writeDiary, deleteDiary,
  editDiary, insertDiary
} from 'src/feature/diary'
import { listNotepaths, readNote, insertNote } from 'src/feature/_note/basic'
import { listTasks, toggleTask, creatTask, editTask, deletTask } from 'src/feature/_note/task'
import { getSuggestions } from 'src/feature/suggest'
import { statsFile } from 'src/feature/_vault/filter'
import { getVaultMetainfo, getVaultInfo, getActiveFile } from 'src/feature/_vault/info'
import { getHeats } from 'src/feature/_vault/heatmap'
import { getAllCommands, executeCommand } from 'src/feature/command'
import { openOnObsidian, openFileOnObsidian } from 'src/feature/winpage'


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
  get_vault_metainfo = getVaultMetainfo
  get_vault_status = getVaultInfo
  get_heatmap = getHeats
  get_active_file = getActiveFile

  /* --- 查询建议 --- */
  suggest_by_switcher = getSuggestions

  /* --- 数据分析 --- */
  filter_frontmatter = statsFile

  /* --- 笔记 --- */
  list_notepaths = listNotepaths
  read_note = readNote
  insert_note = insertNote

  /* --- 日记 --- */
  get_diary_setting = getDiarySetting
  list_diaryprops_in_month = listDiarypropsInMonth
  read_diary = readDiary
  create_diary = createDiary
  write_diary = writeDiary
  edit_diary = editDiary
  insert_diary = insertDiary
  delete_diary = deleteDiary

  /* --- 任务 Task --- */
  list_tasks = listTasks
  create_task = creatTask
  edit_task = editTask
  toggle_task = toggleTask
  delete_task = deletTask

  /* --- 命令 Command --- */
  list_commands = getAllCommands
  execute_command = executeCommand

  /* --- 窗口页面 Winpage --- */
  open_on_obsidian = openOnObsidian
  open_file_on_obsidian = openFileOnObsidian
}
