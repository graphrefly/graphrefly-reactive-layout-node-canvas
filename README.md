# @graphrefly/reactive-layout-node-canvas

Concrete `canvas` package integration for GraphReFly reactive-layout text measurement.

The framework-neutral `TextMeasureCapability` and caller-owned context helper remain in
`@graphrefly/ts`; this package owns only loading or accepting the third-party `canvas` runtime.

```ts
import { graph } from "@graphrefly/ts";
import { nodeCanvasPackageTextMeasurements } from "@graphrefly/reactive-layout-node-canvas";

const g = graph();
const measurements = nodeCanvasPackageTextMeasurements({
	graph: g,
	text: g.state("Hello GraphReFly"),
	font: g.state("16px sans-serif"),
});
```

Install `canvas` when the package should load the runtime itself. Tests and hosts may instead pass a
structurally compatible `{ createCanvas(...) }` implementation through the `canvas` option.

The package was established as a standalone repository from
`graphrefly/graphrefly-react@72fb622`; its original package implementation entered that repository in
commits `548f9d3` and `88da899`.

## Where things are

| Path | Contents |
|---|---|
| [src/](src/) | Package implementation and tests |
| [package.json](package.json) | Public exports, dependencies and commands |
| [docs/](docs/README.md) | Rules/owner map, work and evidence links |
| [CHANGELOG.md](CHANGELOG.md) | Package release history |

## Where things stand

The [documentation map](docs/README.md) links the package API owner, root protocol
and current work/evidence. Version and export facts remain in package metadata;
this entrypoint does not infer acceptance from a release or test result.

## Start locally

Use the [mise toolchain](.mise.toml), then:

```sh
mise trust
mise install
pnpm install
```

| Command | What it does |
|---|---|
| `pnpm test` | Package tests |
| `pnpm run lint` | Biome check |
| `pnpm run typecheck` | TypeScript types |
| `pnpm run build` | Package, declarations and export checks |

[Shared agent workflow](../graphrefly/AGENTS.md).
