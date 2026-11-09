/** Package identity; also the bundle plugin id and CLI-facing label. */
export const PACKAGE_NAME = 'dsh-antfubot'

/** Skill names this plugin injects into every session catalog. */
export const SKILL_NAMES = [
  'antfu-issue-triage',
  'antfu-create-pr',
  'antfu-simplify',
  'antfu-query',
] as const

export type SkillName = (typeof SKILL_NAMES)[number]

/** Registry provider label used for the injected skills. */
export const SKILL_PROVIDER = 'antfubot'

/** Bundled skill rank: after local roots so a workspace copy can override. */
export const SKILL_RANK = 600

/** Slash commands registered by this plugin. */
export const COMMANDS = {
  triage: 'triage',
  task: 'task',
  digest: 'digest',
  status: 'status',
  pr: 'pr',
  simplify: 'simplify',
  grill: 'grill',
} as const

export type CommandName = (typeof COMMANDS)[keyof typeof COMMANDS]

/** Sub-actions accepted as the first word of a command's raw input. */
export const SUBCOMMANDS = {
  update: 'update',
  focus: 'focus',
  apply: 'apply',
  respond: 'respond',
  review: 'review',
} as const
