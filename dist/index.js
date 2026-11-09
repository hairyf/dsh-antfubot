import { randomUUID } from "node:crypto";
import { CommandDefinitionId } from "@deepseek-ai/dsh-commands/brand";
import { MessageId } from "@deepseek-ai/dsh-llm/brand";
import process$1, { cwd } from "node:process";
import { spawn } from "node:child_process";
import { basename, delimiter, dirname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { pipeline } from "node:stream/promises";
import { PassThrough } from "node:stream";
import readline from "node:readline";
import { closeSync, openSync, readSync, statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { defineWebServer } from "dsh-h3";
import { defineEventHandler, readBody } from "h3";
import Schema from "@deepseek-ai/schemastery";
//#region src/constants.ts
/** Package identity; also the bundle plugin id and CLI-facing label. */
const PACKAGE_NAME = "dsh-antfubot";
/** Registry provider label used for the injected skills. */
const SKILL_PROVIDER = "antfubot";
/** Slash commands registered by this plugin. */
const COMMANDS = {
	triage: "triage",
	task: "task",
	digest: "digest",
	status: "status",
	pr: "pr",
	simplify: "simplify",
	grill: "grill"
};
/** Sub-actions accepted as the first word of a command's raw input. */
const SUBCOMMANDS = {
	update: "update",
	focus: "focus",
	apply: "apply",
	respond: "respond",
	review: "review"
};
//#endregion
//#region node_modules/.pnpm/tinyexec@1.3.1/node_modules/tinyexec/dist/main.mjs
const isPathLikePattern = /^path$/i;
const defaultEnvPathInfo = {
	key: "PATH",
	value: ""
};
function getPathFromEnv(env) {
	for (const key in env) {
		if (!Object.prototype.hasOwnProperty.call(env, key) || !isPathLikePattern.test(key)) continue;
		const value = env[key];
		if (!value) return defaultEnvPathInfo;
		return {
			key,
			value
		};
	}
	return defaultEnvPathInfo;
}
function addNodeBinToPath(cwd, path) {
	const parts = path.value.split(delimiter);
	const nodeBinPaths = [];
	let currentPath = typeof cwd === "string" ? cwd : fileURLToPath(cwd, { windows: false });
	let lastPath;
	do {
		nodeBinPaths.push(resolve(currentPath, "node_modules", ".bin"));
		lastPath = currentPath;
		currentPath = dirname(currentPath);
	} while (currentPath !== lastPath);
	nodeBinPaths.push(dirname(process.execPath));
	const newPath = nodeBinPaths.concat(parts).join(delimiter);
	return {
		key: path.key,
		value: newPath
	};
}
function computeEnv(cwd, env, nodePath = true) {
	const envWithDefault = {
		...process.env,
		...env
	};
	if (!nodePath) return envWithDefault;
	const envPathInfo = addNodeBinToPath(cwd, getPathFromEnv(envWithDefault));
	envWithDefault[envPathInfo.key] = envPathInfo.value;
	return envWithDefault;
}
const combineStreams = (streams) => {
	let streamCount = streams.length;
	const combined = new PassThrough();
	const maybeEmitEnd = () => {
		if (--streamCount === 0) combined.end();
	};
	for (const stream of streams) pipeline(stream, combined, { end: false }).then(maybeEmitEnd).catch(maybeEmitEnd);
	return combined;
};
const metaCharsRegExp = /([()\][%!^"`<>&|;, *?])/g;
const shebangRegExp = /^#!\s*(.+)/;
const isWindowsExecutableRegExp = /\.(?:com|exe)$/i;
const isNodeModulesCmdRegExp = /node_modules[\\/]\.bin[\\/][^\\/]+\.cmd$/i;
const isWindows = process.platform === "win32";
const defaultPathExt = [
	".EXE",
	".CMD",
	".BAT",
	".COM"
];
const noPathExt = [""];
/**
* Normalizes the command and arguments to work cross-platform.
* On Windows, this basically handles things like shebangs, calling
* `node_modules/.bin` commands, and escaping meta characters.
* On other platforms, it just returns the command and arguments as-is.
*/
function normalizeSpawnCommand(command, args = [], options = {}) {
	if (options.shell === true || !isWindows) return {
		command,
		args,
		options
	};
	let file = resolveCommand(command, options);
	let shebang = null;
	if (file !== null) {
		const size = 150;
		const buffer = Buffer.alloc(size);
		let fd = null;
		try {
			fd = openSync(file, "r");
			readSync(fd, buffer, 0, size, 0);
		} catch {} finally {
			if (fd !== null) closeSync(fd);
		}
		const match = buffer.toString().match(shebangRegExp);
		if (match !== null) {
			const line = match[1].trim();
			const separatorIndex = line.indexOf(" ");
			const path = separatorIndex !== -1 ? line.slice(0, separatorIndex) : line;
			const argument = separatorIndex !== -1 ? line.slice(separatorIndex + 1) : "";
			const binary = basename(path);
			shebang = binary === "env" ? argument || null : binary;
		}
	}
	if (shebang !== null && file !== null) {
		args = [file, ...args];
		command = shebang;
		file = resolveCommand(command, options);
	}
	if (file === null || !isWindowsExecutableRegExp.test(file)) {
		const needsDoubleEscapeMetaChars = file !== null && isNodeModulesCmdRegExp.test(file);
		command = normalize(command);
		command = command.replace(metaCharsRegExp, "^$1");
		args = args.map((arg) => {
			arg = arg.replace(/(?=(\\+?)?)\1"/g, "$1$1\\\"");
			arg = arg.replace(/(?=(\\+?)?)\1$/, "$1$1");
			arg = `"${arg}"`;
			arg = arg.replace(metaCharsRegExp, "^$1");
			if (needsDoubleEscapeMetaChars) arg = arg.replace(metaCharsRegExp, "^$1");
			return arg;
		});
		args = [
			"/d",
			"/s",
			"/c",
			`"${[command, ...args].join(" ")}"`
		];
		command = options.env?.comspec ?? "cmd.exe";
		options = {
			...options,
			windowsVerbatimArguments: true
		};
	}
	return {
		command,
		args,
		options
	};
}
/**
* Resolves the command to an absolute path if possible.
* Handles things like traversing PATH and adding extensions from PATHEXT
*/
function resolveCommand(command, options) {
	const cwd$3 = (options.cwd ?? cwd()).toString();
	const env = options.env ?? process.env;
	const PATH = getPathFromEnv(env).value;
	const pathEnv = command.includes("/") || command.includes("\\") ? [""] : [cwd$3, ...PATH.split(delimiter)];
	let pathExt = env.PATHEXT ? env.PATHEXT.split(delimiter) : defaultPathExt;
	if (command.includes(".") && pathExt[0] !== "") pathExt = ["", ...pathExt];
	for (const extensions of [pathExt, noPathExt]) for (const path of pathEnv) {
		const dest = resolve(cwd$3, path.startsWith("\"") && path.endsWith("\"") && path.length > 1 ? path.slice(1, -1) : path, command);
		for (const ext of extensions) {
			const destWithExt = dest + ext;
			try {
				if (statSync(destWithExt).isFile()) return destWithExt;
			} catch {}
		}
	}
	return null;
}
var NonZeroExitError = class extends Error {
	result;
	output;
	exitCode;
	get signalCode() {
		return this.result.signalCode;
	}
	constructor(result, output, command, args) {
		let target = "The process";
		if (command) target = `The command \`${args?.length ? `${command} ${args.map((a) => /[ "'`()]/.test(a) ? JSON.stringify(a) : a).join(" ")}` : command}\``;
		const exitCode = result.exitCode ?? 1;
		super(result.signalCode !== null ? `${target} was killed by the signal ${result.signalCode}` : `${target} exited with a non-zero status (${exitCode})`);
		this.result = result;
		this.output = output;
		this.exitCode = exitCode;
		Object.defineProperty(this, "result", {
			enumerable: false,
			writable: false,
			configurable: false
		});
	}
};
const defaultOptions = {
	timeout: void 0,
	persist: false
};
const defaultNodeOptions = { windowsHide: true };
function combineSignals(signals) {
	const controller = new AbortController();
	for (const signal of signals) {
		if (signal.aborted) {
			controller.abort();
			return signal;
		}
		const onAbort = () => {
			controller.abort(signal.reason);
		};
		signal.addEventListener("abort", onAbort, { signal: controller.signal });
	}
	return controller.signal;
}
async function readStream(stream) {
	let output = "";
	try {
		for await (const chunk of stream) output += chunk.toString();
	} catch {}
	return output;
}
var ExecProcess = class {
	_process;
	_aborted = false;
	_options;
	_command;
	_args;
	_resolveClose;
	_processClosed;
	_thrownError;
	get process() {
		return this._process;
	}
	get pid() {
		return this._process?.pid;
	}
	get exitCode() {
		if (this._process && this._process.exitCode !== null) return this._process.exitCode;
	}
	get signalCode() {
		return this._process?.signalCode ?? null;
	}
	constructor(command, args, options) {
		this._options = {
			...defaultOptions,
			...options
		};
		this._command = command;
		this._args = args ?? [];
		this._processClosed = new Promise((resolve) => {
			this._resolveClose = resolve;
		});
	}
	kill(signal) {
		return this._process?.kill(signal) === true;
	}
	get aborted() {
		return this._aborted;
	}
	get killed() {
		return this._process?.killed === true;
	}
	pipe(command, args, options) {
		return exec(command, args, {
			...options,
			stdin: this
		});
	}
	async *[Symbol.asyncIterator]() {
		const proc = this._process;
		if (!proc) return;
		const streams = [];
		if (this._streamErr) streams.push(this._streamErr);
		if (this._streamOut) streams.push(this._streamOut);
		const streamCombined = combineStreams(streams);
		const rl = readline.createInterface({ input: streamCombined });
		for await (const chunk of rl) yield chunk.toString();
		await this._processClosed;
		proc.removeAllListeners();
		if (this._thrownError) throw this._thrownError;
		if (this._options?.throwOnError && (this.exitCode !== 0 && this.exitCode !== void 0 || this.signalCode !== null)) throw new NonZeroExitError(this, void 0, this._command, this._args);
	}
	async _waitForOutput() {
		const proc = this._process;
		if (!proc) throw new Error("No process was started");
		const [stdout, stderr] = await Promise.all([this._streamOut ? readStream(this._streamOut) : "", this._streamErr ? readStream(this._streamErr) : ""]);
		await this._processClosed;
		const { stdin } = this._options;
		if (stdin && typeof stdin !== "string") await stdin;
		proc.removeAllListeners();
		if (this._thrownError) throw this._thrownError;
		const result = {
			stderr,
			stdout,
			exitCode: this.exitCode
		};
		if (this._options.throwOnError && (this.exitCode !== 0 && this.exitCode !== void 0 || this.signalCode !== null)) throw new NonZeroExitError(this, result, this._command, this._args);
		return result;
	}
	then(onfulfilled, onrejected) {
		return this._waitForOutput().then(onfulfilled, onrejected);
	}
	_streamOut;
	_streamErr;
	spawn() {
		const options = this._options;
		const nodeOptions = {
			...defaultNodeOptions,
			...options.nodeOptions
		};
		const cwd$1 = nodeOptions?.cwd ?? cwd();
		const signals = [];
		this._resetState();
		if (options.timeout !== void 0) signals.push(AbortSignal.timeout(options.timeout));
		if (options.signal !== void 0) signals.push(options.signal);
		if (options.persist === true) nodeOptions.detached = true;
		if (signals.length > 0) nodeOptions.signal = combineSignals(signals);
		nodeOptions.env = computeEnv(cwd$1, nodeOptions.env, options.nodePath);
		const crossResult = normalizeSpawnCommand(this._command, this._args, nodeOptions);
		const handle = spawn(crossResult.command, crossResult.args, crossResult.options);
		if (handle.stderr) this._streamErr = handle.stderr;
		if (handle.stdout) this._streamOut = handle.stdout;
		this._process = handle;
		handle.once("error", this._onError);
		handle.once("close", this._onClose);
		if (handle.stdin) {
			const { stdin } = options;
			if (typeof stdin === "string") handle.stdin.end(stdin);
			else stdin?.process?.stdout?.pipe(handle.stdin);
		}
	}
	_resetState() {
		this._aborted = false;
		this._processClosed = new Promise((resolve) => {
			this._resolveClose = resolve;
		});
		this._thrownError = void 0;
	}
	_onError = (err) => {
		if (err.name === "AbortError" && (!(err.cause instanceof Error) || err.cause.name !== "TimeoutError")) {
			this._aborted = true;
			return;
		}
		this._thrownError = err;
	};
	_onClose = () => {
		if (this._resolveClose) this._resolveClose();
	};
};
const x = (command, args, userOptions) => {
	const proc = new ExecProcess(command, args, userOptions);
	proc.spawn();
	return proc;
};
const exec = x;
//#endregion
//#region src/types.ts
const DEFAULT_SETTINGS = { githubAccount: "" };
//#endregion
//#region src/settings.ts
/**
* Absolute path of this plugin's settings file.
*
* It lives under the active DSH profile so two profiles can act as different
* GitHub accounts. `DSH_PROFILE_DIR` is set for profile-launched harnesses;
* without a profile the user-level DSH home is used.
*/
function settingsPath() {
	const profileDir = process$1.env.DSH_PROFILE_DIR;
	return join(profileDir && profileDir.length > 0 ? profileDir : join(process$1.env.DSH_HOME ?? join(homedir(), ".dsh")), "antfubot", "settings.json");
}
function normalize$1(raw) {
	if (raw === null || typeof raw !== "object") return DEFAULT_SETTINGS;
	const value = raw;
	return { githubAccount: typeof value.githubAccount === "string" ? value.githubAccount.trim() : "" };
}
/** Read settings, falling back to defaults on a missing or corrupt file. */
async function readSettings() {
	try {
		const text = await readFile(settingsPath(), "utf8");
		return normalize$1(JSON.parse(text));
	} catch {
		return DEFAULT_SETTINGS;
	}
}
//#endregion
//#region src/gh.ts
/**
* Parse `gh auth status` output into accounts.
*
* gh prints one block per host and one `✓ Logged in to <host> account <login>`
* line per account, followed by `Active account: true` for the active one.
* Unparseable output yields an empty list: a broken gh install must surface as
* "no accounts", not crash the plugin.
*/
function parseAuthStatus(output) {
	const accounts = [];
	let last;
	for (const line of output.split(/\r?\n/)) {
		const login = /Logged in to (\S+) account (\S+)/.exec(line);
		if (login) {
			last = {
				login: login[2],
				host: login[1],
				active: false
			};
			accounts.push(last);
			continue;
		}
		if (last && /Active account:\s*true/i.test(line)) {
			const index = accounts.indexOf(last);
			accounts[index] = {
				...last,
				active: true
			};
			last = void 0;
		}
	}
	return accounts;
}
/** List gh CLI accounts without modifying the stored login. */
async function listAccounts() {
	const result = await x("gh", ["auth", "status"], { throwOnError: false });
	return parseAuthStatus(`${result.stdout}\n${result.stderr}`);
}
//#endregion
//#region src/commands/parse.ts
/**
* Split a command's raw input into a leading keyword and the remainder.
*
* The registry hands over everything after the command name verbatim, so this
* owns the whole grammar: the optional leading sub-action, then the arguments.
*/
function parseInput(rawInput) {
	const text = rawInput.trim();
	if (text.length === 0) return {
		action: void 0,
		rest: "",
		words: []
	};
	const parts = text.split(/\s+/);
	return {
		action: parts[0].toLowerCase(),
		rest: text.slice(parts[0].length).trim(),
		words: parts
	};
}
/**
* Parse `1,2,4-6` style row selections into a flat sorted list of row numbers.
*
* Returns `undefined` when any token is not a positive integer or range, so a
* typo refuses the whole apply instead of silently acting on a subset.
*/
function parseSelection(input) {
	const text = input.trim();
	if (text.length === 0) return void 0;
	const rows = /* @__PURE__ */ new Set();
	for (const token of text.split(/[,\s]+/).filter(Boolean)) {
		const range = /^(\d+)-(\d+)$/.exec(token);
		if (range) {
			const start = Number(range[1]);
			const end = Number(range[2]);
			if (start < 1 || end < start || end > 500) return void 0;
			for (let row = start; row <= end; row++) rows.add(row);
			continue;
		}
		const single = /^(\d+)$/.exec(token);
		if (!single) return void 0;
		const row = Number(single[1]);
		if (row < 1 || row > 500) return void 0;
		rows.add(row);
	}
	return rows.size > 0 ? [...rows].sort((a, b) => a - b) : void 0;
}
//#endregion
//#region src/commands/templates.ts
/**
* Prompts this plugin hands to the model.
*
* Each prompt names the skill it depends on so a reader can trace which
* injected skill governs the work. They stay short: the skill carries the
* procedure, the prompt carries only the request.
*/
const TRIAGE = "antfu-issue-triage";
const CREATE_PR = "antfu-create-pr";
const SIMPLIFY = "antfu-simplify";
const QUERY = "antfu-query";
const TRIAGE_FULL = [
	"Triage this repository's open issues and pull requests.",
	"",
	`Follow the \`${TRIAGE}\` skill exactly. Present the three action tables and then stop for confirmation; run no write command in this turn.`
].join("\n");
const TRIAGE_UPDATE = [
	"Resume triage for this repository from the most recent digest.",
	"",
	"Find earlier digests with `gh issue list --state all --search \"Triage digest in:title\"`, read the matching one, skip items already checked, keep every item's TASKxx code, and scan only newer or newly active items. Then present the action tables and stop for confirmation; run no write command in this turn."
].join("\n");
function triageFocus(focus) {
	return [
		`Triage this repository with a scoped digest focused on: ${focus}`,
		"",
		`Follow the \`${TRIAGE}\` skill's scoped-digest rules: pick items by relevance across the whole backlog, record how you chose in the Selection line, and reuse the same focus phrase the next run will search for. Present the action tables and stop for confirmation.`
	].join("\n");
}
function triageApply(selection) {
	return [
		`Apply the approved rows from the triage tables you just produced: ${selection.join(", ")}.`,
		"",
		`Follow the \`${TRIAGE}\` skill: execute approved rows only, one issue per command (comment, then label, then close chained with &&), create approved new labels first in their own command, stop on the first API error, and end with a done/failed table with links.`
	].join("\n");
}
const TASK_LIST = [
	"List every unfinished item from this repository's current triage digest.",
	"",
	"Read the newest `Triage digest` issue, print only the unchecked items with their TASKxx codes, status emoji, item number and one-line note, grouped exactly as the digest groups them. Do not modify anything."
].join("\n");
function taskRun(code) {
	return [
		`Work on ${code} from this repository's triage digest.`,
		"",
		`Read that item from the digest, do the work it asks for, then follow the \`${CREATE_PR}\` skill to open the pull request (\`${SIMPLIFY}\` first when the diff is larger than the task). Finish by updating the digest: tick the item and add an \`Update (<date>)\` line describing what you did.`
	].join("\n");
}
const DIGEST_READ = [
	"Show this repository's current triage digest.",
	"",
	"Print the digest issue number, its full body, and when it was last updated. Do not re-scan, re-derive, or modify anything."
].join("\n");
function statusSummary(settings, active) {
	return [
		"Report this workspace's antfubot status in one short block.",
		"",
		"Run only read-only commands and report:",
		"- repository: `gh repo view --json nameWithOwner` (when this is not a git repository, say so and stop)",
		`- gh account: this plugin is ${settings.githubAccount ? `acting as ${settings.githubAccount}` : "using the globally active gh account"}${active === void 0 ? "" : active ? " (it is the active gh account)" : " (it is not the active gh account, which is expected: gh is scoped per call)"}`,
		"- digest: the newest `Triage digest` issue number, its date, and its unchecked-item count; say explicitly when it is older than 7 days",
		"- pull requests: how many of this account's open pull requests have review comments newer than the latest commit",
		"",
		"Do not modify anything."
	].join("\n");
}
const PR_CREATE = [
	"Open a pull request for the current branch.",
	"",
	`Follow the \`${CREATE_PR}\` skill exactly: inspect the repository, compute the merge base, read the full diff, run the checks that match the changed surfaces, reshape the history into atomic Conventional Commits, then \`gh pr create --title ... --body-file ...\`. Use \`--draft\` when checks are still running.`
].join("\n");
const PR_RESPOND = [
	"Address the review comments on the current branch's pull request.",
	"",
	`Follow the \`${CREATE_PR}\` skill's step 10: fix each confirmed issue, run focused checks, add new commits (never rewrite pushed commits), push, reply to each thread with evidence, and resolve the threads you addressed. For a comment that is already handled or wrong, reply with the evidence instead of changing code.`
].join("\n");
const PR_REVIEW = [
	"Review the current branch's pull request without modifying it.",
	"",
	"Report findings as a reviewer would: correctness, missing tests, unnecessary complexity, and anything the description claims without evidence. Quote file paths and symbols. Do not edit files, do not commit, and do not post the review unless asked."
].join("\n");
function simplify(scope) {
	return [
		`Simplify the changes in scope: ${scope}.`,
		"",
		`Follow the \`${SIMPLIFY}\` skill exactly: inventory each piece of the diff, ablate it, keep only what is proven needed, run the repository tests, typecheck and lint after each batch, then report the cut/kept table and the diff size before and after. Do not commit unless asked.`
	].join("\n");
}
const GRILL = [
	`Interview me relentlessly about the plan or decision I am about to describe, following the \`${QUERY}\` skill.`,
	"",
	"Put every question through the interactive question tool rather than plain text, keep the recommended option first and marked (Recommended), and work one frontier per round until no branch is left."
].join("\n");
//#endregion
//#region src/commands/register.ts
/** Build one model-facing user message for a prompt this plugin composed. */
function message(text) {
	return {
		id: MessageId(`${PACKAGE_NAME}-${randomUUID()}`),
		role: "user",
		source: { kind: "user" },
		content: [{
			type: "text",
			text
		}]
	};
}
/**
* Queue the composed prompt as its own follow-up turn and wake the driver.
*
* Commands are not model messages, so without this the handler's text would
* never reach the model. `followup` gives the prompt a dedicated turn, which
* keeps a slash command's work separable from whatever the user was doing.
*/
function dispatch(invocation, text) {
	invocation.agent.followup(message(text));
	return {
		kind: "success",
		text: "Sent to the agent."
	};
}
/** Reject input that names an unsupported sub-action, listing what is valid. */
function usage(name, valid) {
	return {
		kind: "error",
		text: `/${name} accepts: ${valid.join(", ")}. Run /${name} with no input for the default.`
	};
}
function registerCommands(ctx) {
	ctx.effect(function* () {
		yield ctx.commands.register({
			definitionId: CommandDefinitionId(PACKAGE_NAME),
			name: COMMANDS.triage,
			description: "Triage this repo against the antfu issue-triage skill",
			input: { hint: "[update | focus <topic> | apply <1,2,4-6>]" },
			handler: async (invocation) => {
				const { action, rest } = parseInput(invocation.rawInput);
				if (action === void 0) return dispatch(invocation, TRIAGE_FULL);
				if (action === SUBCOMMANDS.update) return dispatch(invocation, TRIAGE_UPDATE);
				if (action === SUBCOMMANDS.focus) {
					if (rest.length === 0) return {
						kind: "error",
						text: "Usage: /triage focus <topic>"
					};
					return dispatch(invocation, triageFocus(rest));
				}
				if (action === SUBCOMMANDS.apply) {
					const selection = parseSelection(rest);
					if (!selection) return {
						kind: "error",
						text: "Usage: /triage apply <rows>, for example /triage apply 1,2,4-6"
					};
					return dispatch(invocation, triageApply(selection));
				}
				return usage(COMMANDS.triage, [
					"update",
					"focus <topic>",
					"apply <rows>"
				]);
			}
		});
		yield ctx.commands.register({
			definitionId: CommandDefinitionId(`${PACKAGE_NAME}/task`),
			name: COMMANDS.task,
			description: "List or start an item from this repo triage digest",
			input: { hint: "[TASKxx]" },
			handler: async (invocation) => {
				const { action } = parseInput(invocation.rawInput);
				if (action === void 0) return dispatch(invocation, TASK_LIST);
				if (!/^task\d+$/.test(action)) return {
					kind: "error",
					text: "Usage: /task or /task <TASKxx>, for example /task TASK03"
				};
				return dispatch(invocation, taskRun(action.toUpperCase()));
			}
		});
		yield ctx.commands.register({
			definitionId: CommandDefinitionId(`${PACKAGE_NAME}/digest`),
			name: COMMANDS.digest,
			description: "Show the current triage digest without rescanning",
			handler: (invocation) => {
				if (invocation.rawInput.trim().length > 0) return {
					kind: "error",
					text: "Usage: /digest (no arguments)"
				};
				return dispatch(invocation, DIGEST_READ);
			}
		});
		yield ctx.commands.register({
			definitionId: CommandDefinitionId(`${PACKAGE_NAME}/status`),
			name: COMMANDS.status,
			description: "Show repo, account, digest freshness and pending reviews",
			handler: async (invocation) => {
				if (invocation.rawInput.trim().length > 0) return {
					kind: "error",
					text: "Usage: /status (no arguments)"
				};
				const settings = await readSettings();
				return dispatch(invocation, statusSummary(settings, settings.githubAccount ? (await listAccounts()).some((a) => a.login === settings.githubAccount && a.active) : void 0));
			}
		});
		yield ctx.commands.register({
			definitionId: CommandDefinitionId(`${PACKAGE_NAME}/pr`),
			name: COMMANDS.pr,
			description: "Open a pull request, or address its review comments",
			input: { hint: "[respond | review]" },
			handler: (invocation) => {
				const { action } = parseInput(invocation.rawInput);
				if (action === void 0) return dispatch(invocation, PR_CREATE);
				if (action === SUBCOMMANDS.respond) return dispatch(invocation, PR_RESPOND);
				if (action === SUBCOMMANDS.review) return dispatch(invocation, PR_REVIEW);
				return usage(COMMANDS.pr, ["respond", "review"]);
			}
		});
		yield ctx.commands.register({
			definitionId: CommandDefinitionId(`${PACKAGE_NAME}/simplify`),
			name: COMMANDS.simplify,
			description: "Ablate the current changes down to what is proven needed",
			input: { hint: "[staged | HEAD~n]" },
			handler: (invocation) => {
				const { action } = parseInput(invocation.rawInput);
				const scope = action === void 0 ? "the uncommitted working tree" : action === "staged" ? "the staged changes" : `the diff against ${action}`;
				if (action !== void 0 && action !== "staged" && !/^(?:head|origin\/)/i.test(action)) return {
					kind: "error",
					text: "Usage: /simplify, /simplify staged, or /simplify HEAD~3"
				};
				return dispatch(invocation, simplify(scope));
			}
		});
		yield ctx.commands.register({
			definitionId: CommandDefinitionId(`${PACKAGE_NAME}/grill`),
			name: COMMANDS.grill,
			description: "Interview me about this plan until we agree on it",
			input: { hint: "[the plan or decision]" },
			handler: (invocation) => {
				const { rest } = parseInput(invocation.rawInput);
				return dispatch(invocation, rest.length > 0 ? `${GRILL}\n\nThe subject:\n${rest}` : GRILL);
			}
		});
	}, "antfubot commands lifecycle");
}
//#endregion
//#region src/config-forms.ts
/** Default used when a caller has no config yet (tests, first composition). */
const DEFAULT_CONFIG = { githubAccount: "" };
/** Narrow whatever the loader handed us into a usable Config. */
function normalizeConfig(raw) {
	if (raw === null || typeof raw !== "object") return DEFAULT_CONFIG;
	const value = raw;
	return { githubAccount: typeof value.githubAccount === "string" ? value.githubAccount.trim() : "" };
}
//#endregion
//#region src/server/routes/accounts.get.ts
/**
* List gh CLI accounts for the settings dropdown.
*
* The stored settings travel with the list so the panel can render the current
* selection even when the selected account is no longer logged in.
*/
var accounts_get_default = defineEventHandler(async () => {
	const [accounts, settings] = await Promise.all([listAccounts(), readSettings()]);
	return {
		accounts,
		settings
	};
});
//#endregion
//#region src/server/routes/settings.get.ts
/** Return the composed config so the card can render the current selection. */
var settings_get_default = defineEventHandler(() => ({ settings: currentConfig() }));
//#endregion
//#region src/server/routes/settings.put.ts
/**
* The account is edited through the harness config form, not over HTTP.
*
* This route exists only to reject writes clearly rather than silently
* accepting a value no composition would ever read.
*/
var settings_put_default = defineEventHandler(async (event) => {
	await readBody(event).catch(() => void 0);
	return { error: "Edit the GitHub account in this plugin's settings card." };
});
//#endregion
//#region src/server/index.ts
/** Routes this plugin owns. All of them live under one static prefix. */
const server = defineWebServer((app) => {
	app.get("/api/antfubot/settings", settings_get_default);
	app.put("/api/antfubot/settings", settings_put_default);
	app.get("/api/antfubot/accounts", accounts_get_default);
});
/** Register the routes on the host web server for this activation. */
function registerServer(ctx) {
	ctx.effect(() => server(ctx), "antfubot: routes");
}
//#endregion
//#region src/skills/catalog.ts
/**
* The four hand-written antfu workflow skills, injected as bundled skills.
*
* Bodies live in `assets/skills/<name>.md` (package-owned assets, shipped via
* `files` list) and are read on every `get()`, so editing one takes effect on
* the next load without a rebuild.
*/
const BUNDLED_SKILLS = [
	{
		name: "antfu-issue-triage",
		description: "Triage open issues and PRs of the current GitHub repo - find already-fixed, duplicate, and spam items, suggest labels, gauge demand from reactions and comments, then present a table of proposed actions and comments for confirmation before touching anything. Use when asked to triage, organize, clean up, or groom issues and PRs.",
		whenToUse: "The user asks to triage, groom, clean up, or audit a repository backlog.",
		bodyFile: "antfu-issue-triage.md"
	},
	{
		name: "antfu-create-pr",
		description: "Create a reviewable GitHub pull request from the current branch with a Conventional Commits title, a concise evidence-based body, and before/after screenshots for UI changes. Use when asked to open, create, publish, or prepare a PR.",
		whenToUse: "The user asks to open, prepare, or publish a pull request.",
		bodyFile: "antfu-create-pr.md"
	},
	{
		name: "antfu-simplify",
		description: "Simplify the changes of the current PR or working tree with an ablation study - remove each piece of the diff and keep only what is proven needed - so the result has just-right abstraction, minimal clean code, and stays robust and universal. Use when asked to simplify, slim down, clean up, or reduce the current changes or PR.",
		whenToUse: "The user asks to simplify, slim, or reduce the current diff.",
		bodyFile: "antfu-simplify.md"
	},
	{
		name: "antfu-query",
		description: "Interview the user relentlessly about a plan, decision, or idea until reaching a shared understanding, using the agent interactive question tool (not plain text). Use when the user wants to stress-test their thinking, clarify requirements, or says \"grill me\" or \"query me\".",
		whenToUse: "The user wants to stress-test a plan or says \"grill me\".",
		bodyFile: "antfu-query.md"
	}
];
//#endregion
//#region src/skills/provider.ts
/**
* Directory holding the skill bodies. Resolved from the built entry
* (`dist/index.js`), so it points at `<package>/skills`.
*/
const ASSETS_DIR = fileURLToPath(new URL("../assets/skills/", import.meta.url));
const RESOURCE_BASE = {
	kind: "directory",
	path: ASSETS_DIR
};
function candidate(skill) {
	return {
		name: skill.name,
		description: skill.description,
		whenToUse: skill.whenToUse,
		invocation: {
			modelInvocable: true,
			userInvocable: true
		},
		provider: SKILL_PROVIDER,
		source: "bundled",
		resourceBase: RESOURCE_BASE,
		rank: 600,
		locator: skill.bodyFile
	};
}
const provider = {
	name: SKILL_PROVIDER,
	list: () => Promise.resolve(BUNDLED_SKILLS.map(candidate)),
	async get(candidateSkill) {
		const entry = BUNDLED_SKILLS.find((skill) => skill.name === candidateSkill.name);
		if (!entry) return void 0;
		const body = await readFile(new URL(entry.bodyFile, `file://${ASSETS_DIR}/`), "utf8").catch(() => void 0);
		if (body === void 0) return void 0;
		return {
			name: entry.name,
			description: entry.description,
			whenToUse: entry.whenToUse,
			invocation: {
				modelInvocable: true,
				userInvocable: true
			},
			provider: SKILL_PROVIDER,
			source: "bundled",
			resourceBase: RESOURCE_BASE,
			content: body
		};
	}
};
/**
* Register the antfubot skill provider on `ctx.skills`.
*
* The provider is stable, so a rejected registration is a hard failure: the
* plugin should not pretend to inject skills it cannot deliver.
*/
function registerSkills(ctx) {
	ctx.skills.registerProvider(() => provider);
}
//#endregion
//#region src/config.ts
/**
* User-editable settings, rendered as this bundle's card on the Plugins page.
*
* A `volatile` field is what the settings surface projects into a live form; a
* static `Schema.string()` is ordinary composition configuration and never
* appears in a form. Changes reach `apply(ctx, config)` on the next
* composition.
*/
const Config = Schema.object({ 
/**
* GitHub account (gh CLI login) this plugin acts as.
*
* Empty means "use the account gh already has active". The scope is this
* plugin only: every gh call runs with GH_TOKEN for this login and nothing is
* written to gh's stored credentials.
*/
githubAccount: Schema.string().default("").volatile() });
//#endregion
//#region src/index.ts
const name = "antfubot";
const inject = [
	"skills",
	"commands",
	"settings",
	"webServer"
];
/** Value of the last composed config, read by the routes this plugin serves. */
let current = normalizeConfig(void 0);
/** The config the running commands and routes act on. */
function currentConfig() {
	return current;
}
/**
* Mount the antfubot workflow plugin.
*
* Three independent contributions: the four antfu skills reach every session
* catalog, the slash commands compose prompts that name those skills, and the
* HTTP routes back the account picker. Each fails loudly on its own instead of
* leaving a half-working surface.
*/
function apply(ctx, config) {
	current = normalizeConfig(config);
	ctx.effect(() => ctx.settings.configure({ auto: false }, ctx.fiber), "antfubot: settings page policy");
	registerSkills(ctx);
	registerCommands(ctx);
	registerServer(ctx);
}
//#endregion
export { Config, apply, currentConfig, inject, name };
