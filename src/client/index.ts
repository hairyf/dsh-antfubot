import type { Context } from '@deepseek-ai/cordis'
// Type-only: bring the `slots` service and the settings/General slot contract
// into scope without importing either package at runtime.
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import { AccountRow } from './components/account-row'
import { SETTINGS_ROW_ID, SETTINGS_ROW_ORDER, SETTINGS_SLOT } from './constants'
import { en, zh } from './locale'

/**
 * Contribute one row to Settings → General.
 *
 * The General item slot hands the registrar no props, so the row owns its own
 * copy and receives a translate function through `inject`. The function reads
 * the locale registry at call time, which keeps the row correct after a
 * language switch without re-registering the slot.
 *
 * `slots.inject` waits for the settings surface, so a client without it never
 * registers and never throws; the registration disposer removes this row on
 * unload.
 */
export function apply(ctx: Context): void {
  ctx.slots.inject(SETTINGS_SLOT, () => ctx.slots.register({
    name: SETTINGS_SLOT,
    id: SETTINGS_ROW_ID,
    order: SETTINGS_ROW_ORDER,
    inject: () => ({
      t: (key: string): string => {
        const active = ctx.locale.getSnapshot().active
        const dict = active === 'zh' ? zh : en
        return (dict as Record<string, string>)[key] ?? (en as Record<string, string>)[key] ?? key
      },
    }),
  }, AccountRow))
}
