import { app, dataview } from './global'
import { FileNotExistError, FileAlreadyExistError } from './error'


/* ==== 读取 TFile ==== */
export const readTFile = async (path: string) => {
  const tfile = app.vault.getFileByPath(path)
  if (tfile === null)
    throw new FileNotExistError(path)
  return tfile
}


/* ==== 读取 Dataview Page ==== */
export const readDataviewPage = async (path: string) => {
  const page = dataview.page(path)
  if (page === undefined)
    throw new FileNotExistError(path)
  // dataview 可以不带 .md 后缀，但 getFileByPath 需要
  // 此步明确要求路径带上后缀
  if (page.file.path !== path)
    throw new FileNotExistError(path)
  return page
}


/* ==== 确保文件存在 ==== */
export const checkFileExist = async (path: string) => {
  if (app.vault.getFileByPath(path) === null)
    throw new FileNotExistError(path)
}


/* ==== 确保文件不存在 ==== */
export const checkFileNotExist = async (path: string) => {
  if (app.vault.getFileByPath(path) !== null)
    throw new FileAlreadyExistError(path)
}
