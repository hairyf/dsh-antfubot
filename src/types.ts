/** One bundled skill: catalog metadata plus the instruction body. */
export interface BundledSkill {
  readonly name: string
  readonly description: string
  readonly whenToUse: string
  /** Repository-relative path of the markdown body. */
  readonly bodyFile: string
}

/** Parsed command line: the sub-action keyword and the rest of the input. */
export interface ParsedInput {
  readonly action: string | undefined
  readonly rest: string
  readonly words: readonly string[]
}

/** Settings persisted in the DSH profile for this plugin. */
export interface AntfuFlowSettings {
  /**
   * GitHub account (gh CLI login) this plugin acts as. Empty means "use the
   * account gh already has active". Scoped to this plugin only: the global gh
   * login is never modified.
   */
  readonly githubAccount: string
}

export const DEFAULT_SETTINGS: AntfuFlowSettings = {
  githubAccount: '',
}
