import type { AntfuFlowSettings } from '../types'
import { API_BASE } from './constants'

/** One gh account option for the dropdown. */
export interface AccountOption {
  readonly login: string
  readonly active: boolean
}

/** Reply shape of the accounts route. */
interface AccountsReply {
  readonly accounts: readonly AccountOption[]
  readonly settings: AntfuFlowSettings
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'same-origin',
    ...init,
    headers: { 'content-type': 'application/json', ...init?.headers },
  })
  if (!response.ok)
    throw new Error(`${path} failed with ${response.status}`)
  return await response.json() as T
}

/** Read the logged-in gh accounts and the stored selection. */
export function fetchAccounts(): Promise<AccountsReply> {
  return request<AccountsReply>('/accounts')
}

/** Persist the selected account. An empty login clears the override. */
export function saveAccount(login: string): Promise<{ settings: AntfuFlowSettings }> {
  return request('/settings', { method: 'PUT', body: JSON.stringify({ githubAccount: login }) })
}
