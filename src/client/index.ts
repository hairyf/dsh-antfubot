import type { Context } from '@deepseek-ai/cordis'
// Type-only: bring the configForms service and the Plugins-page slot contract
// into scope without importing either package at runtime.
import type {} from '@deepseek-ai/dsh-client-ui-plugin-manager/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import { AccountCard } from './components/account-card'
import { PLUGIN_PACKAGE, SETTINGS_SLOT } from './constants'

/**
 * Services this client half waits for before it activates.
 *
 * The loader holds the entry until each named service exists, and a service
 * that never arrives leaves the entry inactive — which the web boot audit
 * reports as "1 entry did not activate".
 */
export const inject = ['slots', 'configForms']

/**
 * Contribute this bundle's settings card to its Plugins detail page.
 *
 * Keying the registration by package name is what places the card on this
 * bundle's own page; `configForms.get` returns the harness-owned form the card
 * reads and writes, so persistence stays with the harness.
 */
export function apply(ctx: Context): void {
  ctx.slots.inject(SETTINGS_SLOT, () => ctx.slots.register({
    name: SETTINGS_SLOT,
    key: PLUGIN_PACKAGE,
    inject: () => ({
      form: ctx.configForms.get<{ githubAccount: string }>(PLUGIN_PACKAGE),
    }),
  }, AccountCard))
}
