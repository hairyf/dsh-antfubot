# dsh-antfubot

Anthony Fu's agent workflow for DeepSeek Harness: issue triage, a persistent digest, task execution, pull requests, simplification, and design interviews.

`dsh-antfubot` does two things:

1. **Injects four skills** into every session catalog, so the agent has the procedure before you ask for it.
2. **Registers thirteen slash commands** that compose the request and hand it to the agent.

Both halves are plain data: the skills are markdown shipped in this package, the commands are prompts that name them.

## Install

```bash
dsh plugin install <path-or-package>
```

The plugin needs the gh CLI on `PATH`, authenticated with at least one account:

```bash
gh auth status
```

## Commands

| Command | Input | What it does |
| --- | --- | --- |
| `/triage` | — | Scan the repo's open issues and PRs, present three action tables, then stop for confirmation. |
| `/triage update` | — | Resume from the newest digest: skip checked items, scan only what is new, keep every `TASKxx` code. |
| `/triage focus <topic>` | a focus phrase | Build a scoped digest for one work line (`router rewrite`, `SSR hydration`). |
| `/triage apply <1,2,4-6>` | row numbers | Execute only the approved rows, one issue per command, then report a done/failed table. |
| `/task` | — | List the digest's unfinished items. |
| `/task <TASKxx>` | `TASK03` | Do that item, open the PR, and write the result back into the digest. |
| `/digest` | — | Show the current digest verbatim. Read-only. |
| `/status` | — | Repo, acting account, digest freshness, and pending review activity. |
| `/pr` | — | Open a pull request from the current branch. |
| `/pr respond` | — | Address review comments: fix, add commits, reply with evidence, resolve. |
| `/pr review` | — | Review the current PR without changing it. |
| `/simplify` | `staged` or `HEAD~3` | Ablation study on the current diff. |
| `/grill` | the plan | Interview you through the design tree until nothing is assumed. |

Every command queues its prompt as its own turn, so a slash command's work never mixes into whatever you were already doing.

## Skills

Four skills are injected from this package:

| Skill | Purpose |
| --- | --- |
| `antfu-issue-triage` | Read-only triage, action tables, confirmation gate, digest issue. |
| `antfu-create-pr` | Ten-step PR: merge base, full diff, checks, atomic commits, evidence body. |
| `antfu-simplify` | Ablation study that keeps only what is proven needed. |
| `antfu-query` | Relentless design-tree interview through the question tool. |

They are bundled at rank 600, so a workspace copy under `.agents/skills` or `.dsh/skills` overrides them. Bodies live in `assets/skills/<name>.md` and are read on every load: editing one takes effect without a rebuild.

## Settings

**Settings → General → GitHub Account** picks the gh account this plugin acts as.

The dropdown lists the accounts `gh auth status` reports and marks the active one. Selection is **plugin-scoped**: each gh call runs with `GH_TOKEN` for the chosen account, so nothing is written to gh's config and your global `gh auth` login stays exactly as it was. "Use the active gh account" clears the override.

The setting is stored per profile at `$DSH_PROFILE_DIR/antfubot/settings.json`.

## Configuration

Nothing else to configure. The plugin reads no secrets and writes only its own settings file.

## Development

```bash
pnpm install --frozen-lockfile
pnpm run lint --fix
pnpm run typecheck
pnpm run test -- --run
pnpm run build
```

E2E tests need Playwright browsers (`pnpm exec playwright install`) and the `@deepseek-ai/dsh` CLI; they skip when DSH is absent.

## Attribution

The four skills are vendored from [antfu/skills](https://github.com/antfu/skills) by Anthony Fu (MIT). This plugin packages them for DeepSeek Harness and adds the command surface; the workflow design is his.

## License

MIT