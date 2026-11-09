import Schema from "@deepseek-ai/schemastery";
import { Context } from "@deepseek-ai/cordis";
//#region src/config.d.ts
/**
 * User-editable settings, rendered as this bundle's card on the Plugins page.
 *
 * A Schema-backed config is what the harness exposes through `configForms`; a
 * value changed there reaches `apply(ctx, config)` on the next composition, so
 * the commands read it without their own storage.
 */
interface AntfubotConfig {
  /**
   * GitHub account (gh CLI login) this plugin acts as.
   *
   * Empty means "use the account gh already has active". The scope is this
   * plugin only: every gh call runs with GH_TOKEN for this login and nothing is
   * written to gh's stored credentials.
   */
  githubAccount: string;
}
declare const Config: Schema<AntfubotConfig>;
//#endregion
//#region src/index.d.ts
declare const name = "antfubot";
declare const inject: string[];
/** The config the running commands and routes act on. */
declare function currentConfig(): AntfubotConfig;
/**
 * Mount the antfubot workflow plugin.
 *
 * Three independent contributions: the four antfu skills reach every session
 * catalog, the slash commands compose prompts that name those skills, and the
 * HTTP routes back the account picker. Each fails loudly on its own instead of
 * leaving a half-working surface.
 */
declare function apply(ctx: Context, config?: Partial<AntfubotConfig>): void;
//#endregion
export { type AntfubotConfig, Config, apply, currentConfig, inject, name };