import { LOCALE_NS } from './constants'

export { LOCALE_NS }

/** English strings for the settings row. */
export const en = {
  title: 'GitHub Account',
  hint: 'Used by /triage, /task, /pr and /status. Only this plugin is affected; your global gh login stays as it is.',
  default: 'Use the active gh account',
  activeSuffix: '(active)',
  loading: 'Reading gh accounts…',
  unavailable: 'Unable to read gh accounts. Check that the gh CLI is installed and logged in.',
}

/** Chinese strings for the settings row. */
export const zh = {
  title: 'GitHub 账号',
  hint: '供 /triage、/task、/pr、/status 使用。仅影响本插件，全局 gh 登录状态保持不变。',
  default: '使用 gh 当前账号',
  activeSuffix: '（当前）',
  loading: '正在读取 gh 账号…',
  unavailable: '无法读取 gh 账号，请确认已安装并登录 gh CLI。',
}
