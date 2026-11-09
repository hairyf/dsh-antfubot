import type { AccountOption } from '../settings-client'
import { useEffect, useState } from 'react'
import { fetchAccounts, saveAccount } from '../settings-client'

/** Row exposed in Settings → General: choose which gh account the plugin acts as. */
export interface AccountRowProps {
  /** Translate a locale key. */
  readonly t: (key: string, params?: Record<string, unknown>) => string
}

/**
 * Account selector backed by the host routes.
 *
 * Selection is plugin-scoped: the plugin exports GH_TOKEN for its own gh calls
 * and never runs `gh auth switch`, so the global CLI login is untouched. That
 * promise is stated in the row's help text, not only in the README.
 */
export function AccountRow({ t }: AccountRowProps): React.ReactElement {
  const [accounts, setAccounts] = useState<readonly AccountOption[]>([])
  const [selected, setSelected] = useState('')
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let live = true
    fetchAccounts()
      .then((reply) => {
        if (!live)
          return
        setAccounts(reply.accounts)
        setSelected(reply.settings.githubAccount)
        setState('ready')
      })
      .catch(() => {
        if (live)
          setState('error')
      })
    return () => {
      live = false
    }
  }, [])

  const onChange = async (login: string): Promise<void> => {
    const previous = selected
    setSelected(login)
    setSaving(true)
    try {
      await saveAccount(login)
    }
    catch {
      setSelected(previous)
      setState('error')
    }
    finally {
      setSaving(false)
    }
  }

  if (state === 'loading')
    return <div className="text-sm text-text-secondary">{t('loading')}</div>

  if (state === 'error') {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">{t('title')}</span>
        <span className="text-sm text-text-secondary">{t('unavailable')}</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="flex items-center justify-between gap-4">
        <span className="text-sm font-medium">{t('title')}</span>
        <select
          className="min-w-40 rounded-md border border-border bg-background px-2 py-1 text-sm disabled:opacity-60"
          value={selected}
          disabled={saving}
          onChange={(event) => { void onChange(event.target.value) }}
        >
          <option value="">{t('default')}</option>
          {accounts.map(account => (
            <option key={account.login} value={account.login}>
              {account.active ? `${account.login} ${t('activeSuffix')}` : account.login}
            </option>
          ))}
        </select>
      </label>
      <span className="text-xs text-text-secondary">{t('hint')}</span>
    </div>
  )
}
