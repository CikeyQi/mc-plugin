import { Setting, Status, Update } from './Admin.js'
import { help } from './Help.js'
import { Main } from './Main.js'
import { ActionBar, Broadcast, Command, Private, Subtitle, Title } from './Send.js'

let apps = {
  actionbar: ActionBar,
  broadcast: Broadcast,
  command: Command,
  help,
  main: Main,
  private: Private,
  setting: Setting,
  status: Status,
  subtitle: Subtitle,
  title: Title,
  update: Update
}

export { apps }
