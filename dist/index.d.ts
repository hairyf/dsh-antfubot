import { Context } from "@deepseek-ai/cordis";
//#region src/index.d.ts
declare const name = "antfuflow";
declare const inject: string[];
/**
 * Mount the antfuflow workflow plugin.
 *
 * Three independent contributions: the four antfu skills reach every session
 * catalog, the slash commands compose prompts that name those skills, and the
 * HTTP routes back the settings panel. Each fails loudly on its own instead of
 * leaving a half-working surface.
 */
declare function apply(ctx: Context): void;
//#endregion
export { apply, inject, name };