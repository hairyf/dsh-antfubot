import { defineEventHandler } from 'h3'
import { listAccounts } from '../../gh'
import { readSettings } from '../../settings'

/**
 * List gh CLI accounts for the settings dropdown.
 *
 * The stored settings travel with the list so the panel can render the current
 * selection even when the selected account is no longer logged in.
 */
export default defineEventHandler(async () => {
  const [accounts, settings] = await Promise.all([listAccounts(), readSettings()])
  return { accounts, settings }
})
