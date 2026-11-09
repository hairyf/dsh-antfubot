import Schema from '@deepseek-ai/schemastery'

/**
 * User-editable settings, rendered as this bundle's card on the Plugins page.
 *
 * A `volatile` field is what the settings surface projects into a live form; a
 * static `Schema.string()` is ordinary composition configuration and never
 * appears in a form. Changes reach `apply(ctx, config)` on the next
 * composition.
 */
export const Config = Schema.object({
  /**
   * GitHub account (gh CLI login) this plugin acts as.
   *
   * Empty means "use the account gh already has active". The scope is this
   * plugin only: every gh call runs with GH_TOKEN for this login and nothing is
   * written to gh's stored credentials.
   */
  githubAccount: Schema.string().default('').volatile(),
})

/** Resolved config shape, inferred from the schema above. */
export interface AntfubotConfig {
  githubAccount: string
}
