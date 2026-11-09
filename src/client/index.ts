import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-locale/client'
// Type-only: bring the `slots` service and the settings/General slot contract
// into scope without importing either package at runtime.
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import { AccountRow } from './components/account-row'
import { SETTINGS_ROW_ID, SETTINGS_ROW_ORDER, SETTINGS_SLOT } from './constants'
import { en, zh } from './locale'

/**
 * Contribute one row to Settings → General.
 *
 * The General item slot hands the registrar no props, so this row owns its own
 * copy: `inject` supplies a translate function resolved from the active locale
 * at call time. `slots.inject` waits for the settings surface, so a client
 * without it skips the row instead of throwing.
 */
export function apply(ctx: Context): void {
  ctx.slots.inject(SETTINGS_SLOT, () => ctx.slots.register({
    name: SETTINGS_SLOT,
    id: SETTINGS_ROW_ID,
    order: SETTINGS_ROW_ORDER,
    inject: () => ({
      t: (key: string): string => {
        const dict = ctx.locale.getSnapshot().active === 'zh' ? zh : en
        return (dict as Record<string, string>)[key] ?? (en as Record<string, string>)[key] ?? key
      },
    }),
  }, AccountRow))
}
