# dsh-antfubot

Anthony Fu's agent workflow for DeepSeek Harness: issue triage, a persistent digest, task execution, pull requests, and design interviews.

## What it adds

**Four skills** in every session catalog:

| Skill | Purpose |
| --- | --- |
| `antfu-issue-triage` | Read-only triage, action tables, confirmation gate, digest issue. |
| `antfu-create-pr` | Ten-step PR: merge base, full diff, checks, atomic commits, evidence body. |
| `antfu-simplify` | Ablation study that keeps only what is proven needed. |
| `antfu-query` | Design-tree interview through the question tool. |

**Thirteen slash commands.**

| Command | Input | What it does |
| --- | --- | --- |
| `/triage` | — | Scan open issues and PRs, present action tables, stop for confirmation. |
| `/triage update` | — | Resume from the newest digest and scan only what is new. |
| `/triage focus <topic>` | focus phrase | Scoped digest for one work line. |
| `/triage apply <1,2,4-6>` | rows | Execute only the approved rows. |
| `/task` | — | List the digest's unfinished items. |
| `/task <TASKxx>` | `TASK03` | Do that item, open the PR, write back to the digest. |
| `/digest` | — | Show the current digest. Read-only. |
| `/status` | — | Repo, acting account, digest freshness, pending reviews. |
| `/pr` | — | Open a pull request from the current branch. |
| `/pr respond` | — | Fix, commit, reply with evidence, resolve. |
| `/pr review` | — | Review the current PR without changing it. |
| `/simplify` | `staged`, `HEAD~3` | Ablation study on the current diff. |
| `/grill` | the plan | Interview you until nothing is assumed. |

## Settings

Open **Plugins → dsh-antfubot**. **GitHub account** picks which gh account this plugin acts as.

Each gh call runs with `GH_TOKEN` for the chosen login, so nothing is written to gh's config and your global `gh auth` account stays as it is. "Use the active gh account" clears the override.

Requires the gh CLI on `PATH`, logged in at least once (`gh auth status`).

## License

MIT. The four skills are vendored from [antfu/skills](https://github.com/antfu/skills) by Anthony Fu (MIT); the workflow design is his.
