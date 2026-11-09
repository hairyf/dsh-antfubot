import type { ConfigForm, ConfigFormSnapshot } from '@deepseek-ai/dsh-client-ui-settings/client'
import { useEffect, useState } from 'react'

/** Config section this plugin owns, matching the Host's exported Config. */
export interface AccountConfig {
  readonly githubAccount: string
}

/** Props the Plugins page hands a bundle configuration entry. */
export interface AccountCardProps {
  readonly view: 'summary' | 'page'
  readonly form?: ConfigForm<AccountConfig> | undefined
}

/**
 * Bundle settings card on the Plugins page.
 *
 * The harness owns validation and persistence through `form.set`/`form.unset`;
 * this card only decides what to draw. `summary` is the one-liner on the
 * bundle row; `page` renders the account picker.
 */
export function AccountCard({ view, form }: AccountCardProps): React.ReactElement | null {
  const snapshot = useSnapshot(form)
  const accounts = useAccounts()

  if (view === 'summary') {
    const value = snapshot?.value?.githubAccount
    return <>{value && value.length > 0 ? `acting as ${value}` : 'using the active gh account'}</>
  }

  if (!form)
    return null

  const value = snapshot?.value?.githubAccount ?? ''
  const ready = snapshot?.status === 'ready'

  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-center justify-between gap-4">
        <span className="text-sm font-medium">GitHub account</span>
        <select
          className="min-w-40 rounded-md border border-border bg-background px-2 py-1 text-sm disabled:opacity-60"
          value={value}
          disabled={!ready}
          onChange={(event) => {
            const next = event.target.value
            if (next.length === 0)
              void form.unset('githubAccount')
            else
              void form.set('githubAccount', next)
          }}
        >
          <option value="">Use the active gh account</option>
          {accounts.map(login => <option key={login} value={login}>{login}</option>)}
        </select>
      </label>
      <span className="text-xs text-text-secondary">
        Used by /triage, /task, /pr and /status. Only this plugin is affected; your global gh login stays as it is.
      </span>
    </div>
  )
}

/** Subscribe to a config form, tolerating an absent one. */
function useSnapshot(form: ConfigForm<AccountConfig> | undefined): ConfigFormSnapshot<AccountConfig> | undefined {
  const [snapshot, setSnapshot] = useState<ConfigFormSnapshot<AccountConfig> | undefined>(() => form?.getSnapshot())
  useEffect(() => {
    if (!form)
      return
    setSnapshot(form.getSnapshot())
    return form.subscribe(() => setSnapshot(form.getSnapshot()))
  }, [form])
  return snapshot
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
