import type { Context } from '@deepseek-ai/cordis'
import type { SkillCandidate, SkillDefinition, SkillProvider } from '@deepseek-ai/dsh-skill'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { SKILL_PROVIDER, SKILL_RANK } from '../constants'
import { BUNDLED_SKILLS } from './catalog'

/**
 * Directory holding the skill bodies. Resolved from the built entry
 * (`dist/index.js`), so it points at `<package>/skills`.
 */
const ASSETS_DIR = fileURLToPath(new URL('../assets/skills/', import.meta.url))

const RESOURCE_BASE = { kind: 'directory', path: ASSETS_DIR } as const

function candidate(skill: (typeof BUNDLED_SKILLS)[number]): SkillCandidate {
  return {
    name: skill.name,
    description: skill.description,
    whenToUse: skill.whenToUse,
    invocation: { modelInvocable: true, userInvocable: true },
    provider: SKILL_PROVIDER,
    source: 'bundled',
    resourceBase: RESOURCE_BASE,
    rank: SKILL_RANK,
    locator: skill.bodyFile,
  }
}

const provider: SkillProvider = {
  name: SKILL_PROVIDER,
  list: () => Promise.resolve(BUNDLED_SKILLS.map(candidate)),
  async get(candidateSkill): Promise<SkillDefinition | undefined> {
    const entry = BUNDLED_SKILLS.find(skill => skill.name === candidateSkill.name)
    if (!entry)
      return undefined
    const body = await readFile(new URL(entry.bodyFile, `file://${ASSETS_DIR}/`), 'utf8').catch(() => undefined)
    if (body === undefined)
      return undefined
    return {
      name: entry.name,
      description: entry.description,
      whenToUse: entry.whenToUse,
      invocation: { modelInvocable: true, userInvocable: true },
      provider: SKILL_PROVIDER,
      source: 'bundled',
      resourceBase: RESOURCE_BASE,
      content: body,
    }
  },
}

/**
 * Register the antfubot skill provider on `ctx.skills`.
 *
 * The provider is stable, so a rejected registration is a hard failure: the
 * plugin should not pretend to inject skills it cannot deliver.
 */
export function registerSkills(ctx: Context): void {
  ctx.skills.registerProvider(() => provider)
}
