import type { SettingsFieldState, SettingsFormShell } from '@deepseek-ai/dsh-client-ui-primitives'
import { SettingsForm, SettingsFormModel } from '@deepseek-ai/dsh-client-ui-primitives'
import { useEffect, useState } from 'react'

/** Config section this plugin owns, matching the Host's exported Config. */
export interface AccountConfig {
  readonly githubAccount: string
}

/** Field name inside that section. */
const FIELD = 'githubAccount'

/** State the card's registered store projects. */
interface AccountCardState extends SettingsFormShell {
  readonly githubAccount: SettingsFieldState
}

/** Props the Plugins page hands a bundle configuration entry. */
export interface AccountCardProps {
  readonly view: 'summary' | 'page'
  /** Localized copy for the form chrome. */
  readonly t?: (key: string) => string
  /**
   * Reads this card's projected state.
   *
   * The page supplies it from `hooks.settingsCard`, the store the registration
   * injected: the card never reads persistence, only what that store projects.
   */
  readonly useSettingsCard?: <T>(selector: (state: AccountCardState) => T) => T
  /** Stage draft text for one field. */
  readonly edit?: (field: string, text: string) => void
  /** Write every staged edit. */
  readonly save?: () => void
  /** Drop every staged edit. */
  readonly discard?: () => void
}

/**
 * Bundle settings card on the Plugins page.
 *
 * `view: 'summary'` renders the one-liner the bundle row can show; `page`
 * renders the account picker. Every value comes from `useSettingsCard`, the
 * hook the page binds to this registration's store.
 */
export function AccountCard(props: AccountCardProps): React.ReactElement | null {
  if (props.view === 'summary')
    return null

  const accounts = useAccounts()
  const useSettingsCard = props.useSettingsCard

  if (!useSettingsCard)
    return <span className="text-xs text-text-secondary">Settings unavailable</span>

  const state = useSettingsCard(snapshot => snapshot)

  const selected = state.githubAccount?.text ?? ''
  const disabled = !state.writable || state.saving

  return (
    <SettingsForm
      labels={{
        unavailable: 'Unavailable',
        readOnly: 'Read only',
        saveFailed: 'Save failed',
        save: 'Save',
        saving: 'Saving…',
      }}
      state={state}
      onSave={() => props.save?.()}
      onDiscard={() => props.discard?.()}
    >
      <label className="flex items-center justify-between gap-4 py-1">
        <span className="text-sm font-medium">GitHub account</span>
        <select
          className="min-w-40 rounded-md border border-border bg-background px-2 py-1 text-sm disabled:opacity-60"
          value={selected}
          disabled={disabled}
          onChange={event => props.edit?.(FIELD, event.target.value)}
        >
          <option value="">Use the active gh account</option>
          {accounts.map(login => <option key={login} value={login}>{login}</option>)}
        </select>
      </label>
      <span className="text-xs text-text-secondary">
        Used by /triage, /task, /pr and /status. Only this plugin is affected; your global gh login stays as it is.
      </span>
    </SettingsForm>
  )
}

/** Logged-in gh accounts, read from the host route this plugin serves. */
function useAccounts(): string[] {
  const [logins, setLogins] = useState<string[]>([])
  useEffect(() => {
    let live = true
    fetch('/api/antfubot/accounts', { credentials: 'same-origin' })
      .then(r => (r.ok ? r.json() : undefined))
      .then((data: { accounts?: { login: string }[] } | undefined) => {
        if (live && data?.accounts)
          setLogins(data.accounts.map(a => a.login))
      })
      .catch(() => undefined)
    return () => {
      live = false
    }
  }, [])
  return logins
}

/**
 * Build the staged form model the card renders over.
 *
 * `SettingsFormModel` reads and writes the Host entry's section, so the card
 * never touches persistence itself.
 */
export function createAccountForm(scope: unknown): { model: SettingsFormModel<AccountConfig>, store: unknown } {
  const model = new SettingsFormModel<AccountConfig>(scope as never, [{
    field: FIELD,
    format: value => (typeof value === 'string' ? value : ''),
    parse: text => (text.length === 0
      ? { kind: 'clear' }
      : { kind: 'set', value: text }),
  }])
  const store = model.bind(() => ({
    ...model.shell(),
    [FIELD]: model.field(FIELD),
  }))
  return { model, store }
}
