import { graph } from "@graphrefly/ts";
import { describe, expect, it } from "vitest";
import { nodeCanvasPackageTextMeasurements } from "./index.js";

describe("@graphrefly/reactive-layout-node-canvas", () => {
	it("uses an injected canvas package and restores the context font", () => {
		const g = graph();
		const text = g.state("abc");
		const font = g.state("10px package");
		const context = {
			font: "old",
			measureText(segment: string) {
				return { width: segment.length * (this.font.includes("package") ? 5 : 1) };
			},
		};
		let created: readonly [number, number] | undefined;
		const measured = nodeCanvasPackageTextMeasurements({
			graph: g,
			text,
			font,
			width: 2,
			height: 3,
			canvas: {
				createCanvas(width, height) {
					created = [width, height];
					return { getContext: () => context };
				},
			},
		});
		const messages: unknown[] = [];
		const unsubscribe = measured.subscribe((message) => messages.push(message));

		expect(created).toEqual([2, 3]);
		expect(context.font).toBe("old");
		expect(JSON.stringify(messages)).toContain('"width":15');
		unsubscribe();
	});
});
