import type { BundledSkill } from '../types'

/**
 * The four hand-written antfu workflow skills, injected as bundled skills.
 *
 * Bodies live in `assets/skills/<name>.md` (package-owned assets, shipped via
 * `files` list) and are read on every `get()`, so editing one takes effect on
 * the next load without a rebuild.
 */
export const BUNDLED_SKILLS: readonly BundledSkill[] = [
  {
    name: 'antfu-issue-triage',
    description: 'Triage open issues and PRs of the current GitHub repo - find already-fixed, duplicate, and spam items, suggest labels, gauge demand from reactions and comments, then present a table of proposed actions and comments for confirmation before touching anything. Use when asked to triage, organize, clean up, or groom issues and PRs.',
    whenToUse: 'The user asks to triage, groom, clean up, or audit a repository backlog.',
    bodyFile: 'antfu-issue-triage.md',
  },
  {
    name: 'antfu-create-pr',
    description: 'Create a reviewable GitHub pull request from the current branch with a Conventional Commits title, a concise evidence-based body, and before/after screenshots for UI changes. Use when asked to open, create, publish, or prepare a PR.',
    whenToUse: 'The user asks to open, prepare, or publish a pull request.',
    bodyFile: 'antfu-create-pr.md',
  },
  {
    name: 'antfu-simplify',
    description: 'Simplify the changes of the current PR or working tree with an ablation study - remove each piece of the diff and keep only what is proven needed - so the result has just-right abstraction, minimal clean code, and stays robust and universal. Use when asked to simplify, slim down, clean up, or reduce the current changes or PR.',
    whenToUse: 'The user asks to simplify, slim, or reduce the current diff.',
    bodyFile: 'antfu-simplify.md',
  },
  {
    name: 'antfu-query',
    description: 'Interview the user relentlessly about a plan, decision, or idea until reaching a shared understanding, using the agent interactive question tool (not plain text). Use when the user wants to stress-test their thinking, clarify requirements, or says "grill me" or "query me".',
    whenToUse: 'The user wants to stress-test a plan or says "grill me".',
    bodyFile: 'antfu-query.md',
  },
]
