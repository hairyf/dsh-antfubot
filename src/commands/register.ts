import type { Context } from '@deepseek-ai/cordis'
import type { CommandInvocation, CommandResult } from '@deepseek-ai/dsh-commands'
import type { UserMessage } from '@deepseek-ai/dsh-llm'
import { randomUUID } from 'node:crypto'
import { CommandDefinitionId } from '@deepseek-ai/dsh-commands/brand'
import { MessageId } from '@deepseek-ai/dsh-llm/brand'
import { COMMANDS, PACKAGE_NAME, SUBCOMMANDS } from '../constants'
import { listAccounts } from '../gh'
import { readSettings } from '../settings'
import { parseInput, parseSelection } from './parse'
import * as prompt from './templates'

/** Build one model-facing user message for a prompt this plugin composed. */
function message(text: string): UserMessage {
  return {
    id: MessageId(`${PACKAGE_NAME}-${randomUUID()}`),
    role: 'user',
    source: { kind: 'user' },
    content: [{ type: 'text', text }],
  }
}

/**
 * Queue the composed prompt as its own follow-up turn and wake the driver.
 *
 * Commands are not model messages, so without this the handler's text would
 * never reach the model. `followup` gives the prompt a dedicated turn, which
 * keeps a slash command's work separable from whatever the user was doing.
 */
function dispatch(invocation: CommandInvocation, text: string): CommandResult {
  invocation.agent.followup(message(text))
  return { kind: 'success', text: 'Sent to the agent.' }
}

/** Reject input that names an unsupported sub-action, listing what is valid. */
function usage(name: string, valid: readonly string[]): CommandResult {
  return {
    kind: 'error',
    text: `/${name} accepts: ${valid.join(', ')}. Run /${name} with no input for the default.`,
  }
}

export function registerCommands(ctx: Context): void {
  ctx.effect(function* () {
    yield ctx.commands.register({
      definitionId: CommandDefinitionId(PACKAGE_NAME),
      name: COMMANDS.triage,
      description: 'Triage this repo against the antfu issue-triage skill',
      input: { hint: '[update | focus <topic> | apply <1,2,4-6>]' },
      handler: async (invocation) => {
        const { action, rest } = parseInput(invocation.rawInput)

        if (action === undefined)
          return dispatch(invocation, prompt.TRIAGE_FULL)

        if (action === SUBCOMMANDS.update)
          return dispatch(invocation, prompt.TRIAGE_UPDATE)

        if (action === SUBCOMMANDS.focus) {
          if (rest.length === 0)
            return { kind: 'error', text: 'Usage: /triage focus <topic>' }
          return dispatch(invocation, prompt.triageFocus(rest))
        }

        if (action === SUBCOMMANDS.apply) {
          const selection = parseSelection(rest)
          if (!selection) {
            return {
              kind: 'error',
              text: 'Usage: /triage apply <rows>, for example /triage apply 1,2,4-6',
            }
          }
          return dispatch(invocation, prompt.triageApply(selection))
        }

        return usage(COMMANDS.triage, ['update', 'focus <topic>', 'apply <rows>'])
      },
    })

    yield ctx.commands.register({
      definitionId: CommandDefinitionId(`${PACKAGE_NAME}/task`),
      name: COMMANDS.task,
      description: 'List or start an item from this repo triage digest',
      input: { hint: '[TASKxx]' },
      handler: async (invocation) => {
        const { action } = parseInput(invocation.rawInput)
        if (action === undefined)
          return dispatch(invocation, prompt.TASK_LIST)
        if (!/^task\d+$/.test(action))
          return { kind: 'error', text: 'Usage: /task or /task <TASKxx>, for example /task TASK03' }
        return dispatch(invocation, prompt.taskRun(action.toUpperCase()))
      },
    })

    yield ctx.commands.register({
      definitionId: CommandDefinitionId(`${PACKAGE_NAME}/digest`),
      name: COMMANDS.digest,
      description: 'Show the current triage digest without rescanning',
      handler: (invocation) => {
        if (invocation.rawInput.trim().length > 0)
          return { kind: 'error', text: 'Usage: /digest (no arguments)' }
        return dispatch(invocation, prompt.DIGEST_READ)
      },
    })

    yield ctx.commands.register({
      definitionId: CommandDefinitionId(`${PACKAGE_NAME}/status`),
      name: COMMANDS.status,
      description: 'Show repo, account, digest freshness and pending reviews',
      handler: async (invocation) => {
        if (invocation.rawInput.trim().length > 0)
          return { kind: 'error', text: 'Usage: /status (no arguments)' }
        const settings = await readSettings()
        const active = settings.githubAccount
          ? (await listAccounts()).some(a => a.login === settings.githubAccount && a.active)
          : undefined
        return dispatch(invocation, prompt.statusSummary(settings, active))
      },
    })

    yield ctx.commands.register({
      definitionId: CommandDefinitionId(`${PACKAGE_NAME}/pr`),
      name: COMMANDS.pr,
      description: 'Open a pull request, or address its review comments',
      input: { hint: '[respond | review]' },
      handler: (invocation) => {
        const { action } = parseInput(invocation.rawInput)
        if (action === undefined)
          return dispatch(invocation, prompt.PR_CREATE)
        if (action === SUBCOMMANDS.respond)
          return dispatch(invocation, prompt.PR_RESPOND)
        if (action === SUBCOMMANDS.review)
          return dispatch(invocation, prompt.PR_REVIEW)
        return usage(COMMANDS.pr, ['respond', 'review'])
      },
    })

    yield ctx.commands.register({
      definitionId: CommandDefinitionId(`${PACKAGE_NAME}/simplify`),
      name: COMMANDS.simplify,
      description: 'Ablate the current changes down to what is proven needed',
      input: { hint: '[staged | HEAD~n]' },
      handler: (invocation) => {
        const { action } = parseInput(invocation.rawInput)
        const scope = action === undefined
          ? 'the uncommitted working tree'
          : action === 'staged' ? 'the staged changes' : `the diff against ${action}`
        if (action !== undefined && action !== 'staged' && !/^(?:head|origin\/)/i.test(action))
          return { kind: 'error', text: 'Usage: /simplify, /simplify staged, or /simplify HEAD~3' }
        return dispatch(invocation, prompt.simplify(scope))
      },
    })

    yield ctx.commands.register({
      definitionId: CommandDefinitionId(`${PACKAGE_NAME}/grill`),
      name: COMMANDS.grill,
      description: 'Interview me about this plan until we agree on it',
      input: { hint: '[the plan or decision]' },
      handler: (invocation) => {
        const { rest } = parseInput(invocation.rawInput)
        const text = rest.length > 0 ? `${prompt.GRILL}\n\nThe subject:\n${rest}` : prompt.GRILL
        return dispatch(invocation, text)
      },
    })
  }, 'antfuflow commands lifecycle')
}
