import type SchemaType from '@deepseek-ai/schemastery'
import Schema from '@deepseek-ai/schemastery'

/**
 * User-editable settings, rendered as this bundle's card on the Plugins page.
 *
 * A Schema-backed config is what the harness exposes through `configForms`; a
 * value changed there reaches `apply(ctx, config)` on the next composition, so
 * the commands read it without their own storage.
 */
export interface AntfubotConfig {
  /**
   * GitHub account (gh CLI login) this plugin acts as.
   *
   * Empty means "use the account gh already has active". The scope is this
   * plugin only: every gh call runs with GH_TOKEN for this login and nothing is
   * written to gh's stored credentials.
   */
  githubAccount: string
}

export const Config: SchemaType<AntfubotConfig> = Schema.object({
  githubAccount: Schema.string().default(''),
})
