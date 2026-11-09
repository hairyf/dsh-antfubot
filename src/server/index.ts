import type { Context } from '@deepseek-ai/cordis'
import { defineWebServer } from 'dsh-h3'
import readAccounts from './routes/accounts.get'
import getSettings from './routes/settings.get'
import putSettings from './routes/settings.put'

/** Routes this plugin owns. All of them live under one static prefix. */
export const server = defineWebServer((app) => {
  app.get('/api/antfuflow/settings', getSettings)
  app.put('/api/antfuflow/settings', putSettings)
  app.get('/api/antfuflow/accounts', readAccounts)
})

/** Register the routes on the host web server for this activation. */
export function registerServer(ctx: Context): void {
  ctx.effect(() => server(ctx), 'antfuflow: routes')
}
