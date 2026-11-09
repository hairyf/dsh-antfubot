# dsh-antfubot

Anthony Fu 的 Agent 工作流，用于 DeepSeek Harness：triage、常驻 digest、任务执行、PR 与设计访谈。

## 技能

四个技能会注入到每个会话的技能目录。

| 技能 | 作用 |
| --- | --- |
| `antfu-issue-triage` | 只读 triage、动作表格、确认闸门、digest issue。 |
| `antfu-create-pr` | 十步开 PR：merge base、完整 diff、检查、原子提交、证据化正文。 |
| `antfu-simplify` | 消融实验，只保留证明必要的改动。 |
| `antfu-query` | 用提问工具做设计树访谈。 |

## 指令

| 指令 | 作用 |
| --- | --- |
| `/triage` | 扫描 open issue 与 PR，输出动作表格后停下等确认。 |
| `/triage update` | 从最新 digest 续跑，只扫增量。 |
| `/triage focus <主题>` | 针对一条工作线生成范围化 digest。 |
| `/triage apply <行号>` | 只执行被批准的行。 |
| `/task` | 列出 digest 中未完成项。 |
| `/task <TASKxx>` | 执行该项、开 PR、回写 digest。 |
| `/digest` | 只读查看当前 digest。 |
| `/status` | 仓库、使用账号、digest 新鲜度、待处理评审。 |
| `/pr` | 为当前分支开 PR。 |
| `/pr respond` | 修复、提交、带证据回复、resolve。 |
| `/pr review` | 只评审当前 PR，不改动。 |
| `/simplify` | 对当前 diff 做消融实验。 |
| `/grill` | 访谈到你没有未定的假设。 |

## GitHub 账号

本页顶部的设置卡片用于选择这些指令使用的 gh 账号。

每次 gh 调用都以该账号的 `GH_TOKEN` 运行，不会写入 gh 配置，全局 `gh auth` 账号保持不变。需要本机安装 gh CLI 并至少登录一次。
