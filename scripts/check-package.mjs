import { execFileSync } from "node:child_process";
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readdirSync,
	readFileSync,
	rmSync,
	symlinkSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const packageRoot = resolve(process.argv[2] ?? ".");
const packageJson = JSON.parse(readFileSync(join(packageRoot, "package.json"), "utf8"));
const expectedEntries = {
	"@graphrefly/nestjs": {
		".": ["GraphReq", "createNestGraphBoundaryRunner", "fromNestReq", "getNestBoundaryBindings"],
		"./microservices": ["GraphMessage", "createGraphMessageBridge", "provideGraphMessageProviders"],
		"./native": [
			"createGraphExceptionFilter",
			"createNestGraphGuardAwaitScope",
			"provideGraphNativeProviders",
		],
		"./websockets": ["GraphWs", "createGraphWsBridge", "provideGraphWsProviders"],
	},
	"@graphrefly/reactive-layout-node-canvas": {
		".": ["nodeCanvasPackageTextMeasurements"],
	},
	"@graphrefly/solid": {
		".": ["createNodeInput", "createNodeRecord", "createNodeValue"],
	},
	"@graphrefly/svelte": {
		".": ["nodeReadable", "nodeRecord", "nodeWritable"],
	},
	"@graphrefly/vue": {
		".": ["useNodeInput", "useNodeRecord", "useNodeValue"],
	},
}[packageJson.name];

function fail(message) {
	throw new Error(`check-ecosystem-package: ${message}`);
}

function assert(condition, message) {
	if (!condition) fail(message);
}

function resolveInstalledPackage(name) {
	const segments = name.split("/");
	const local = join(packageRoot, "node_modules", ...segments);
	if (existsSync(local)) return local;
	const root = join(ROOT, "node_modules", ...segments);
	if (existsSync(root)) return root;
	return undefined;
}

assert(expectedEntries, `unknown ecosystem package: ${packageJson.name}`);
assert(packageJson.dependencies === undefined, "package must not declare runtime dependencies");
assert(
	packageJson.optionalDependencies === undefined,
	"package must not declare optional dependencies",
);
assert(packageJson.sideEffects === false, "sideEffects must be false");

assert(
	JSON.stringify(Object.keys(packageJson.exports ?? {}).sort()) ===
		JSON.stringify(Object.keys(expectedEntries).sort()),
	"package export keys do not match the reviewed entry set",
);
for (const [subpath, expectedExports] of Object.entries(expectedEntries)) {
	const entry = packageJson.exports?.[subpath];
	for (const [label, target] of [
		["ESM", entry?.import?.default],
		["CJS", entry?.require?.default],
		["ESM DTS", entry?.import?.types],
		["CJS DTS", entry?.require?.types],
	]) {
		assert(typeof target === "string", `${subpath} ${label} export target must be declared`);
		assert(
			existsSync(join(packageRoot, target)),
			`${subpath} ${label} export target is missing: ${target}`,
		);
	}
	assert(expectedExports.length > 0, `${subpath} must declare reviewed runtime exports`);
}

const tmp = mkdtempSync(join(tmpdir(), "graphrefly-ecosystem-package-"));
const externalCwd = mkdtempSync(join(tmpdir(), "graphrefly-ecosystem-external-cwd-"));
try {
	const packDir = join(tmp, "pack");
	mkdirSync(packDir);
	execFileSync("npm", ["pack", "--pack-destination", packDir], {
		cwd: packageRoot,
		stdio: "pipe",
	});
	const tarballs = readdirSync(packDir).filter((entry) => entry.endsWith(".tgz"));
	assert(tarballs.length === 1, "npm pack must produce exactly one tarball");
	writeFileSync(join(tmp, "package.json"), JSON.stringify({ private: true, type: "module" }));
	execFileSync(
		"npm",
		[
			"install",
			"--ignore-scripts",
			"--legacy-peer-deps",
			"--package-lock=false",
			"--no-audit",
			"--no-fund",
			join(packDir, tarballs[0]),
		],
		{ cwd: tmp, stdio: "pipe" },
	);
	const packageInstall = join(tmp, "node_modules", ...packageJson.name.split("/"));
	const packedManifest = JSON.parse(readFileSync(join(packageInstall, "package.json"), "utf8"));
	assert(packedManifest.name === packageJson.name, "packed package name changed");
	assert(packedManifest.version === packageJson.version, "packed package version changed");
	assert(
		packedManifest.repository?.url === packageJson.repository?.url,
		"packed repository authority changed",
	);

	for (const peerName of Object.keys(packageJson.peerDependencies ?? {})) {
		const target = resolveInstalledPackage(peerName);
		if (target === undefined) {
			assert(
				packageJson.peerDependenciesMeta?.[peerName]?.optional === true,
				`required peer package is not installed: ${peerName}`,
			);
			continue;
		}
		const link = join(tmp, "node_modules", ...peerName.split("/"));
		mkdirSync(dirname(link), { recursive: true });
		symlinkSync(target, link, "dir");
	}
	const nodeTypes = resolveInstalledPackage("@types/node");
	assert(nodeTypes !== undefined, "@types/node is required by the consumer type smoke");
	const nodeTypesLink = join(tmp, "node_modules", "@types", "node");
	mkdirSync(dirname(nodeTypesLink), { recursive: true });
	symlinkSync(nodeTypes, nodeTypesLink, "dir");
	if (packageJson.name === "@graphrefly/reactive-layout-node-canvas") {
		const canvasInstall = join(tmp, "node_modules", "canvas");
		mkdirSync(canvasInstall, { recursive: true });
		writeFileSync(
			join(canvasInstall, "package.json"),
			JSON.stringify({ name: "canvas", version: "3.2.3", main: "index.cjs" }),
		);
		writeFileSync(
			join(canvasInstall, "index.cjs"),
			`exports.createCanvas = () => ({
	getContext: () => ({
		font: "",
		measureText: (text) => ({ width: text.length * 7 }),
	}),
});
`,
		);
	}

	writeFileSync(
		join(tmp, "esm-smoke.mjs"),
		`import assert from "node:assert/strict";
const expectedEntries = ${JSON.stringify(expectedEntries)};
for (const [subpath, expected] of Object.entries(expectedEntries)) {
	const specifier = ${JSON.stringify(packageJson.name)} + (subpath === "." ? "" : subpath.slice(1));
	const sdk = await import(specifier);
	for (const name of expected) assert.equal(typeof sdk[name] === "function" || sdk[name] !== undefined, true);
}
`,
	);
	writeFileSync(
		join(tmp, "cjs-smoke.cjs"),
		`const assert = require("node:assert/strict");
const expectedEntries = ${JSON.stringify(expectedEntries)};
for (const [subpath, expected] of Object.entries(expectedEntries)) {
	const specifier = ${JSON.stringify(packageJson.name)} + (subpath === "." ? "" : subpath.slice(1));
	const sdk = require(specifier);
	for (const name of expected) assert.equal(typeof sdk[name] === "function" || sdk[name] !== undefined, true);
}
`,
	);
	const esmTypeImports = [];
	const cjsTypeImports = [];
	let entryIndex = 0;
	for (const [subpath, expected] of Object.entries(expectedEntries)) {
		const specifier = packageJson.name + (subpath === "." ? "" : subpath.slice(1));
		const bindings = expected.join(", ");
		esmTypeImports.push(
			`import { ${bindings} } from ${JSON.stringify(specifier)};\nvoid [${bindings}];`,
		);
		const namespace = `entry${entryIndex}`;
		cjsTypeImports.push(
			`import ${namespace} = require(${JSON.stringify(specifier)});\nvoid [${expected
				.map((name) => `${namespace}.${name}`)
				.join(", ")}];`,
		);
		entryIndex += 1;
	}
	writeFileSync(join(tmp, "esm-types.mts"), `${esmTypeImports.join("\n")}\n`);
	writeFileSync(join(tmp, "cjs-types.cts"), `${cjsTypeImports.join("\n")}\n`);
	writeFileSync(
		join(tmp, "tsconfig.json"),
		JSON.stringify({
			compilerOptions: {
				module: "NodeNext",
				moduleResolution: "NodeNext",
				noEmit: true,
				strict: true,
				skipLibCheck: false,
				target: "ES2022",
				types: ["node"],
			},
			include: ["esm-types.mts", "cjs-types.cts"],
		}),
	);
	execFileSync(process.execPath, ["esm-smoke.mjs"], { cwd: tmp, stdio: "pipe" });
	execFileSync(process.execPath, ["cjs-smoke.cjs"], { cwd: tmp, stdio: "pipe" });
	execFileSync(join(ROOT, "node_modules", ".bin", "tsc"), ["-p", "tsconfig.json"], {
		cwd: tmp,
		stdio: "inherit",
	});
	if (packageJson.name === "@graphrefly/reactive-layout-node-canvas") {
		writeFileSync(
			join(tmp, "node-canvas-lazy.mjs"),
			`import assert from "node:assert/strict";
import { graph } from "@graphrefly/ts";
import { nodeCanvasPackageTextMeasurements } from "@graphrefly/reactive-layout-node-canvas";
const g = graph();
const measured = nodeCanvasPackageTextMeasurements({
	graph: g,
	text: g.state("abc"),
	font: g.state("10px test"),
});
const messages = [];
const unsubscribe = measured.subscribe((message) => messages.push(message));
assert.match(JSON.stringify(messages), /"width":21/);
unsubscribe();
`,
		);
		execFileSync(process.execPath, [join(tmp, "node-canvas-lazy.mjs")], {
			cwd: externalCwd,
			stdio: "pipe",
		});
	}
} finally {
	rmSync(tmp, { recursive: true, force: true });
	rmSync(externalCwd, { recursive: true, force: true });
}

console.log(`check-package: ${packageJson.name} packed ESM/CJS/DTS smoke passed`);
