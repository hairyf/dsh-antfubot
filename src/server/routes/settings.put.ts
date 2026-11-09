import { defineEventHandler, readBody } from 'h3'

/**
 * The account is edited through the harness config form, not over HTTP.
 *
 * This route exists only to reject writes clearly rather than silently
 * accepting a value no composition would ever read.
 */
export default defineEventHandler(async (event) => {
  await readBody(event).catch(() => undefined)
  return { error: 'Edit the GitHub account in this plugin\'s settings card.' }
})
