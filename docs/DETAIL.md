# dsh-antfubot

Anthony Fu's agent workflow for DeepSeek Harness: triage, a persistent digest, task execution, pull requests, and design interviews.

## Skills

Four skills reach every session catalog.

| Skill | Purpose |
| --- | --- |
| `antfu-issue-triage` | Read-only triage, action tables, confirmation gate, digest issue. |
| `antfu-create-pr` | Ten-step PR: merge base, full diff, checks, atomic commits, evidence body. |
| `antfu-simplify` | Ablation study that keeps only what is proven needed. |
| `antfu-query` | Design-tree interview through the question tool. |

## Commands

| Command | What it does |
| --- | --- |
| `/triage` | Scan open issues and PRs, present action tables, stop for confirmation. |
| `/triage update` | Resume from the newest digest and scan only what is new. |
| `/triage focus <topic>` | Scoped digest for one work line. |
| `/triage apply <rows>` | Execute only the approved rows. |
| `/task` | List the digest's unfinished items. |
| `/task <TASKxx>` | Do that item, open the PR, write back to the digest. |
| `/digest` | Show the current digest. Read-only. |
| `/status` | Repo, acting account, digest freshness, pending reviews. |
| `/pr` | Open a pull request from the current branch. |
| `/pr respond` | Fix, commit, reply with evidence, resolve. |
| `/pr review` | Review the current PR without changing it. |
| `/simplify` | Ablation study on the current diff. |
| `/grill` | Interview you until nothing is assumed. |

## GitHub account

The settings card at the top of this page picks which gh account these commands act as.

Each gh call runs with `GH_TOKEN` for the chosen login, so nothing is written to gh's config and your global `gh auth` account stays as it is. Requires the gh CLI on `PATH`, logged in at least once.
