import type { Context } from '@deepseek-ai/cordis'
// Type-only: bring the configForms service and the Plugins-page slot contract
// into scope without importing either package at runtime.
import type {} from '@deepseek-ai/dsh-client-ui-plugin-manager/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import { AccountCard, createAccountForm } from './components/account-card'
import { PLUGIN_PACKAGE, SETTINGS_SLOT } from './constants'

/**
 * Services this client half waits for before it activates.
 *
 * The loader holds the entry until each named service exists, and a service
 * that never arrives leaves the entry inactive — which the web boot audit
 * reports as "1 entry did not activate".
 *
 * `remote` is what the settings mirror reads the Host describe through; without
 * it the form resolves against an empty document and shows as unavailable.
 */
export const inject = ['slots', 'configForms', 'remote']

/**
 * Contribute this bundle's settings card to its Plugins detail page.
 *
 * `whileServed` is the entry point for a page that draws its own card: it keeps
 * the registration alive only while the Host actually serves this namespace, and
 * drops it when the composition stops offering one. Registering unconditionally
 * would leave a card bound to a form that never resolves.
 */
export function apply(ctx: Context): void {
  ctx.effect(function* () {
    const slots = ctx.slots

    yield () => {}

    yield ctx.configForms.whileServed([PLUGIN_PACKAGE], () => {
      const form = createAccountForm(ctx.configForms.get(PLUGIN_PACKAGE))

      return slots.inject(SETTINGS_SLOT, () => slots.register({
        name: SETTINGS_SLOT,
        key: PLUGIN_PACKAGE,
        inject: () => ({ hooks: { settingsCard: form.store }, ...form.model.actions() }),
      }, AccountCard))
    })
  }, 'antfubot: plugins page card')
}
