export class DesksetError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DesksetError'
    Error.captureStackTrace(this, DesksetError)
  }
}


/* ==== 文件类错误 ==== */

/* --- 文件不存在 --- */
export class FileNotExistError extends DesksetError {
  constructor(path: string) {
    super(`File ${path} not exist`)
  }
}

/* --- 文件已存在 --- */
export class FileAlreadyExistError extends DesksetError {
  constructor(path: string) {
    super(`File ${path} already exist`)
  }
}


/* ==== 其他错误 ==== */

/* --- 解析失败 --- */
export class ParseFailError extends DesksetError {
  constructor() {
    super('Parse fail')
  }
}
