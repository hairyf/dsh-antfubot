import { defineEventHandler } from 'h3'
import { readSettings } from '../../settings'

/** Return the plugin settings for the settings panel. */
export default defineEventHandler(async () => {
  const settings = await readSettings()
  return { settings }
})
