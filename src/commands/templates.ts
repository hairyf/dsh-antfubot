import type { AntfuFlowSettings } from '../types'
import { SKILL_NAMES } from '../constants'

/**
 * Prompts this plugin hands to the model.
 *
 * Each prompt names the skill it depends on so a reader can trace which
 * injected skill governs the work. They stay short: the skill carries the
 * procedure, the prompt carries only the request.
 */
const TRIAGE = 'antfu-issue-triage'
const CREATE_PR = 'antfu-create-pr'
const SIMPLIFY = 'antfu-simplify'
const QUERY = 'antfu-query'

export const TRIAGE_FULL = [
  'Triage this repository\'s open issues and pull requests.',
  '',
  `Follow the \`${TRIAGE}\` skill exactly. Present the three action tables and then stop for confirmation; run no write command in this turn.`,
].join('\n')

export const TRIAGE_UPDATE = [
  'Resume triage for this repository from the most recent digest.',
  '',
  'Find earlier digests with `gh issue list --state all --search "Triage digest in:title"`, read the matching one, skip items already checked, keep every item\'s TASKxx code, and scan only newer or newly active items. Then present the action tables and stop for confirmation; run no write command in this turn.',
].join('\n')

export function triageFocus(focus: string): string {
  return [
    `Triage this repository with a scoped digest focused on: ${focus}`,
    '',
    `Follow the \`${TRIAGE}\` skill's scoped-digest rules: pick items by relevance across the whole backlog, record how you chose in the Selection line, and reuse the same focus phrase the next run will search for. Present the action tables and stop for confirmation.`,
  ].join('\n')
}

export function triageApply(selection: readonly number[]): string {
  return [
    `Apply the approved rows from the triage tables you just produced: ${selection.join(', ')}.`,
    '',
    `Follow the \`${TRIAGE}\` skill: execute approved rows only, one issue per command (comment, then label, then close chained with &&), create approved new labels first in their own command, stop on the first API error, and end with a done/failed table with links.`,
  ].join('\n')
}

export const TASK_LIST = [
  'List every unfinished item from this repository\'s current triage digest.',
  '',
  'Read the newest `Triage digest` issue, print only the unchecked items with their TASKxx codes, status emoji, item number and one-line note, grouped exactly as the digest groups them. Do not modify anything.',
].join('\n')

export function taskRun(code: string): string {
  return [
    `Work on ${code} from this repository's triage digest.`,
    '',
    `Read that item from the digest, do the work it asks for, then follow the \`${CREATE_PR}\` skill to open the pull request (\`${SIMPLIFY}\` first when the diff is larger than the task). Finish by updating the digest: tick the item and add an \`Update (<date>)\` line describing what you did.`,
  ].join('\n')
}

export const DIGEST_READ = [
  'Show this repository\'s current triage digest.',
  '',
  'Print the digest issue number, its full body, and when it was last updated. Do not re-scan, re-derive, or modify anything.',
].join('\n')

export function statusSummary(settings: AntfuFlowSettings, active: boolean | undefined): string {
  const scope = settings.githubAccount
    ? `acting as ${settings.githubAccount}`
    : 'using the globally active gh account'
  const activeNote = active === undefined
    ? ''
    : active
      ? ' (it is the active gh account)'
      : ' (it is not the active gh account, which is expected: gh is scoped per call)'
  return [
    'Report this workspace\'s antfuflow status in one short block.',
    '',
    'Run only read-only commands and report:',
    '- repository: `gh repo view --json nameWithOwner` (when this is not a git repository, say so and stop)',
    `- gh account: this plugin is ${scope}${activeNote}`,
    '- digest: the newest `Triage digest` issue number, its date, and its unchecked-item count; say explicitly when it is older than 7 days',
    '- pull requests: how many of this account\'s open pull requests have review comments newer than the latest commit',
    '',
    'Do not modify anything.',
  ].join('\n')
}

export const PR_CREATE = [
  'Open a pull request for the current branch.',
  '',
  `Follow the \`${CREATE_PR}\` skill exactly: inspect the repository, compute the merge base, read the full diff, run the checks that match the changed surfaces, reshape the history into atomic Conventional Commits, then \`gh pr create --title ... --body-file ...\`. Use \`--draft\` when checks are still running.`,
].join('\n')

export const PR_RESPOND = [
  'Address the review comments on the current branch\'s pull request.',
  '',
  `Follow the \`${CREATE_PR}\` skill's step 10: fix each confirmed issue, run focused checks, add new commits (never rewrite pushed commits), push, reply to each thread with evidence, and resolve the threads you addressed. For a comment that is already handled or wrong, reply with the evidence instead of changing code.`,
].join('\n')

export const PR_REVIEW = [
  'Review the current branch\'s pull request without modifying it.',
  '',
  'Report findings as a reviewer would: correctness, missing tests, unnecessary complexity, and anything the description claims without evidence. Quote file paths and symbols. Do not edit files, do not commit, and do not post the review unless asked.',
].join('\n')

export function simplify(scope: string): string {
  return [
    `Simplify the changes in scope: ${scope}.`,
    '',
    `Follow the \`${SIMPLIFY}\` skill exactly: inventory each piece of the diff, ablate it, keep only what is proven needed, run the repository tests, typecheck and lint after each batch, then report the cut/kept table and the diff size before and after. Do not commit unless asked.`,
  ].join('\n')
}

export const GRILL = [
  `Interview me relentlessly about the plan or decision I am about to describe, following the \`${QUERY}\` skill.`,
  '',
  'Put every question through the interactive question tool rather than plain text, keep the recommended option first and marked (Recommended), and work one frontier per round until no branch is left.',
].join('\n')

/** Skill names this plugin expects to be present for its prompts. */
export const REQUIRED_SKILLS = SKILL_NAMES
