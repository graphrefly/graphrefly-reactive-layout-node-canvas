# @graphrefly/reactive-layout-node-canvas documentation map

This package owns its framework/provider integration. Protocol and generic runtime
contracts remain upstream. No separate local work sequencer or decision ledger
was found or created by this editorial batch.

| Category | Question | Current entrypoint | Maintenance boundary |
|---|---|---|---|
| Rules | What applies now? | [Root revision contract](../../graphrefly/authority/README.md#protocol-revision-contract), [TS package/adapter owner](../../graphrefly-ts/docs/README.md), local [export map](../package.json) and [source](../src/) | Keep package integration distinct from substrate/protocol ownership |
| Draft rules | What is inactive or proposed? | Root [rule revisions](../../graphrefly/spec/rules.jsonl) and explicitly scoped owner proposals | No local draft-rule registry is invented; drafts do not become API behavior |
| Decisions | Why this choice? | [Root owner locator](../../graphrefly/authority/ledgers.jsonl) | Resolve the existing unique owner; do not duplicate its body here |
| Work | What is being done? | Existing owner work through [root locator](../../graphrefly/authority/work-ledgers.jsonl); B142 in [root backlog](../../graphrefly/plan/backlog.jsonl) owns this cleanup | No local cursor or implementation authorization is inferred |
| Evidence | What was checked? | Package tests/checks; [B142 execution](../../graphrefly/sessions/active/docs-reorganization-evidence/2026-11-05-reactive-layout-node-canvas.md) | Results establish their checked scope only |
| Design / guides | How do I use it? | [Package README](../README.md), [public exports/scripts](../package.json), source JSDoc | Framework/provider behavior stays package-local; no shared API mirror |
| Archive | What did earlier work say? | [Changelog](../CHANGELOG.md) and retained Git history | No archive/trash candidate was established |
| Reference | What informs further work? | [Root guides](../../graphrefly/guide/guide.jsonl), [TS docs](../../graphrefly-ts/docs/README.md) | References do not dispatch work or change rules |

README owns package setup/commands; the [root workflow index](../../graphrefly/AGENTS.md)
routes shared review and personal workflows. This map owns category navigation only. No runtime source, exports,
protocol or decision body changed. No archive/trash move ran.

The pre-existing untracked AGENTS and three shared workflow adapters were retained unchanged, as required by the approved proposal.
