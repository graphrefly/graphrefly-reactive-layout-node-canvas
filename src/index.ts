import { createRequire } from "node:module";
import type { Graph, Node } from "@graphrefly/ts";
import {
	capabilityTextMeasurements,
	type Measurements,
	type SegmentAdapter,
	type TextMeasureCapability,
} from "@graphrefly/ts/solutions/reactive-layout";

export interface NodeCanvasTextContextLike {
	measureText(text: string): { readonly width: number };
	font: string;
}

export interface NodeCanvasLike {
	getContext(type: "2d"): NodeCanvasTextContextLike | null;
}

export interface NodeCanvasPackageLike {
	createCanvas(width: number, height: number): NodeCanvasLike;
}

export interface NodeCanvasPackageTextMeasurementsOptions {
	readonly graph: Graph;
	readonly text: Node<string>;
	readonly font: Node<string>;
	readonly canvas?: NodeCanvasPackageLike;
	readonly width?: number;
	readonly height?: number;
	readonly segmentAdapter?: Node<SegmentAdapter>;
	readonly targetId?: string;
	readonly source?: string;
	readonly name?: string;
}

const requireCanvas = createRequire(typeof __filename === "string" ? __filename : import.meta.url);

function loadCanvasPackage(): NodeCanvasPackageLike {
	try {
		return requireCanvas("canvas") as NodeCanvasPackageLike;
	} catch (error) {
		throw new TypeError(
			"nodeCanvasPackageTextMeasurements requires peer package 'canvas'. Install canvas or pass { canvas }.",
			{ cause: error },
		);
	}
}

class NodeCanvasPackageTextCapability implements TextMeasureCapability {
	private context: NodeCanvasTextContextLike | null = null;

	constructor(
		private readonly canvasPackage: NodeCanvasPackageLike | undefined,
		private readonly width: number,
		private readonly height: number,
	) {}

	private getContext(): NodeCanvasTextContextLike {
		if (this.context !== null) return this.context;
		const context = (this.canvasPackage ?? loadCanvasPackage())
			.createCanvas(this.width, this.height)
			.getContext("2d");
		if (context === null) {
			throw new TypeError("nodeCanvasPackageTextMeasurements: failed to create a 2D context");
		}
		this.context = context;
		return context;
	}

	measureText(text: string, font: string): { readonly width: number } {
		const context = this.getContext();
		const previousFont = context.font;
		context.font = font;
		try {
			return context.measureText(text);
		} finally {
			context.font = previousFont;
		}
	}
}

export function nodeCanvasPackageTextMeasurements(
	opts: NodeCanvasPackageTextMeasurementsOptions,
): Node<Measurements> {
	const targetId = opts.targetId ?? "text";
	const capability = opts.graph.state<TextMeasureCapability>(
		new NodeCanvasPackageTextCapability(opts.canvas, opts.width ?? 0, opts.height ?? 0),
		{
			name: opts.name
				? `${opts.name}:node-canvas-measure-capability`
				: `${targetId}-node-canvas-measure-capability`,
		},
	);
	return capabilityTextMeasurements({
		graph: opts.graph,
		text: opts.text,
		font: opts.font,
		capability,
		segmentAdapter: opts.segmentAdapter,
		targetId: opts.targetId,
		source: opts.source ?? "nodeCanvasPackageTextMeasurements",
		name: opts.name,
	});
}
