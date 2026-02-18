export class DesksetError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DesksetError'
    Error.captureStackTrace(this, DesksetError)
  }
}
