import { app } from 'src/core/global'
import { DesksetError } from 'src/core/error'


/* ==== 获取所有可用命令 ==== */
export const getAllCommands = async () => {
  return Object.values((app as any).commands.commands).map((item: any) => {
    return {
      id: item.id,
      name: item.name
    }
  })
}


/* ==== 执行命令 ==== */
export const executeCommand = async (id: string) => {
  const command = (app as any).commands.commands[id]
  if (command == undefined)
    throw new DesksetError(`Command with id "${id}" does not exist.`)
  return await command.callback()
}
