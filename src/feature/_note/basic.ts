import { app } from 'src/core/global'
import { FileNotExistError, FileAlreadyExistError } from 'src/core/error'


/* ==== 列出仓库子目录下所有文件路径 ==== */
export const listNotepaths = async (directory: string): Promise<string[]> => {
  const abstractFiles = app.vault.getFiles()
  const filePaths: string[] = []

  for (const file of abstractFiles) {
    if (file.path.startsWith(directory)) {
      filePaths.push(file.path)
    }
  }

  return filePaths
}


/* ==== 创建笔记 ==== */
export const createNote = async (path: string, content: string = '') => {
  if (app.vault.getFileByPath(path) !== null)
    throw new FileAlreadyExistError(path)

  await app.vault.create(path, content)
  return true
}


/* ==== 读取笔记 ==== */
export const readNote = async (path: string): Promise<string> => {
  const tfile = app.vault.getFileByPath(path)
  if (tfile === null)
    throw new FileNotExistError(path)

  return await app.vault.read(tfile)
}


/* ==== 插入笔记 ==== */
export const insertNote = async (path: string, line: number | null, insertData: string) => {
  const tfile = app.vault.getFileByPath(path)
  if (tfile === null)
    throw new FileNotExistError(path)

  const fileContent = await app.vault.read(tfile)
  const fileLines = fileContent.split('\n')

  if (line !== null) {
    fileLines.splice(line, 0, insertData)
  } else {
    if (fileLines[fileLines.length - 1] === '') {
      fileLines[fileLines.length - 1] = insertData
      fileLines.push('')
    } else {
      fileLines.push(insertData)
    }
  }

  await app.vault.modify(tfile, fileLines.join('\n'))
  return true
}
