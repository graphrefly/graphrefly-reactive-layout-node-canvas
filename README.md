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
