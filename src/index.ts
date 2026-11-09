import type { Context } from '@deepseek-ai/cordis'
import { registerCommands } from './commands/register'
import { registerServer } from './server'
import { registerSkills } from './skills/provider'

export const name = 'antfuflow'

export const inject = ['skills', 'commands', 'webServer']

/**
 * Mount the antfuflow workflow plugin.
 *
 * Three independent contributions: the four antfu skills reach every session
 * catalog, the slash commands compose prompts that name those skills, and the
 * HTTP routes back the settings panel. Each fails loudly on its own instead of
 * leaving a half-working surface.
 */
export function apply(ctx: Context): void {
  registerSkills(ctx)
  registerCommands(ctx)
  registerServer(ctx)
}
