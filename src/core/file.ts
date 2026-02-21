import { app } from './global'
import { FileNotExistError, FileAlreadyExistError } from './error'


/* ==== 读取 TFile ==== */
export const readTFile = async (path: string) => {
  const tfile = app.vault.getFileByPath(path)
  if (tfile === null)
    throw new FileNotExistError(path)
  return tfile
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
