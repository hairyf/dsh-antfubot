import type { Context } from '@deepseek-ai/cordis'
import type { AntfubotConfig } from './config'
import { registerCommands } from './commands/register'
import { normalizeConfig } from './config-forms'
import { registerServer } from './server'
import { registerSkills } from './skills/provider'

export { Config } from './config'
export type { AntfubotConfig } from './config'

export const name = 'antfubot'

export const inject = ['skills', 'commands', 'webServer']

/** Value of the last composed config, read by the routes this plugin serves. */
let current = normalizeConfig(undefined)

/** The config the running commands and routes act on. */
export function currentConfig(): AntfubotConfig {
  return current
}

/**
 * Mount the antfubot workflow plugin.
 *
 * Three independent contributions: the four antfu skills reach every session
 * catalog, the slash commands compose prompts that name those skills, and the
 * HTTP routes back the account picker. Each fails loudly on its own instead of
 * leaving a half-working surface.
 */
export function apply(ctx: Context, config?: Partial<AntfubotConfig>): void {
  current = normalizeConfig(config)
  registerSkills(ctx)
  registerCommands(ctx)
  registerServer(ctx)
}
