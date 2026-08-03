import { HelpCircle } from "lucide-react";

export default function Help() {
	return (
		<div className="mx-auto max-w-3xl space-y-8" data-testid="help-page">
			<h1 className="text-xl font-semibold text-zinc-100">
				<HelpCircle className="mr-2 inline h-5 w-5 text-amber-400" />
				Help
			</h1>

			<section>
				<h2 className="mb-2 text-sm font-semibold text-zinc-200">
					Architecture
				</h2>
				<pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-xs text-zinc-300">{`LLM Agent -> streamfog-mcp (:10994) -> Streamer.bot WebSocket -> Streamfog Desktop -> OBS
                         \\-> FastAPI REST -> React Dashboard (:10995)
MCP tools: streamfog_* (5 tools) served at http://127.0.0.1:10994/mcp (streamable HTTP)`}</pre>
			</section>

			<section>
				<h2 className="mb-2 text-sm font-semibold text-zinc-200">
					Prerequisites
				</h2>
				<ol className="list-inside list-decimal space-y-1 text-sm text-zinc-300">
					<li>Streamfog installed from streamfog.com and running</li>
					<li>Streamer.bot installed and running</li>
					<li>
						Streamfog → Streamer.bot integration enabled (Integrations panel)
					</li>
					<li>
						Streamer.bot WebSocket server enabled (Settings → WebSocket Server)
					</li>
					<li>
						Actions created in Streamer.bot (SetLens_*, ClearEffects,
						ToggleAvatar)
					</li>
					<li>lenses.json populated with action → lens mappings</li>
				</ol>
			</section>

			<section>
				<h2 className="mb-2 text-sm font-semibold text-zinc-200">
					Configuration (env)
				</h2>
				<table className="w-full text-sm">
					<thead>
						<tr className="border-b border-zinc-800 text-left text-xs text-zinc-500">
							<th className="py-1 pr-4">Variable</th>
							<th className="py-1 pr-4">Default</th>
							<th className="py-1">Description</th>
						</tr>
					</thead>
					<tbody className="text-zinc-300">
						<tr className="border-b border-zinc-800/60">
							<td className="py-1 pr-4 font-mono text-xs">
								STREAMFOG_MCP_STREAMERBOT_HOST
							</td>
							<td className="py-1 pr-4">127.0.0.1</td>
							<td className="py-1">Streamer.bot WebSocket host</td>
						</tr>
						<tr className="border-b border-zinc-800/60">
							<td className="py-1 pr-4 font-mono text-xs">
								STREAMFOG_MCP_STREAMERBOT_PORT
							</td>
							<td className="py-1 pr-4">8080</td>
							<td className="py-1">Streamer.bot WebSocket port</td>
						</tr>
						<tr className="border-b border-zinc-800/60">
							<td className="py-1 pr-4 font-mono text-xs">
								STREAMFOG_MCP_STREAMERBOT_TOKEN
							</td>
							<td className="py-1 pr-4">-</td>
							<td className="py-1">Streamer.bot auth token</td>
						</tr>
						<tr className="border-b border-zinc-800/60">
							<td className="py-1 pr-4 font-mono text-xs">
								STREAMFOG_MCP_LENS_MAP_PATH
							</td>
							<td className="py-1 pr-4">lenses.json</td>
							<td className="py-1">Lens → action mapping file</td>
						</tr>
						<tr>
							<td className="py-1 pr-4 font-mono text-xs">
								STREAMFOG_MCP_PORT
							</td>
							<td className="py-1 pr-4">10994</td>
							<td className="py-1">Backend port</td>
						</tr>
					</tbody>
				</table>
			</section>

			<section>
				<h2 className="mb-2 text-sm font-semibold text-zinc-200">
					Troubleshooting
				</h2>
				<dl className="space-y-3 text-sm text-zinc-300">
					<div>
						<dt className="font-semibold text-zinc-100">
							"Not connected to Streamer.bot"
						</dt>
						<dd>
							Streamer.bot is not running, or its WebSocket server is disabled.
							Open Streamer.bot → Settings → WebSocket Server and enable it.
						</dd>
					</div>
					<div>
						<dt className="font-semibold text-zinc-100">
							Action sent but nothing happens
						</dt>
						<dd>
							The action name in lenses.json does not exist in Streamer.bot.
							Verify the action name in Streamer.bot's Actions panel, update
							lenses.json, then use "Reload" on the Dashboard.
						</dd>
					</div>
					<div>
						<dt className="font-semibold text-zinc-100">
							"Dispatch failed" / auth error
						</dt>
						<dd>
							The Streamer.bot WebSocket token is enabled but
							STREAMFOG_MCP_STREAMERBOT_TOKEN does not match it, or vice versa.
							Match the token or disable it on both sides.
						</dd>
					</div>
					<div>
						<dt className="font-semibold text-zinc-100">
							Dashboard shows "Backend offline"
						</dt>
						<dd>
							Start the server with start.ps1 (or the desktop app). The
							dashboard retries with exponential backoff (1s → 16s) and recovers
							automatically.
						</dd>
					</div>
					<div>
						<dt className="font-semibold text-zinc-100">Keyboard shortcuts</dt>
						<dd>
							Ctrl+Scroll to zoom · Ctrl+0 to reset zoom · Ctrl+L to toggle the
							logs modal.
						</dd>
					</div>
				</dl>
			</section>

			<section>
				<h2 className="mb-2 text-sm font-semibold text-zinc-200">Docs</h2>
				<ul className="list-inside list-disc space-y-1 text-sm text-zinc-300">
					<li>
						<a
							href="/llms-full.txt"
							className="underline decoration-amber-400/50 underline-offset-2"
						>
							llms-full.txt
						</a>{" "}
						- full LLM-readable documentation
					</li>
					<li>
						<a
							href="/INSTALL.md"
							className="underline decoration-amber-400/50 underline-offset-2"
						>
							INSTALL.md
						</a>{" "}
						- installation guide
					</li>
					<li>
						<a
							href="/docs/TOOLS.md"
							className="underline decoration-amber-400/50 underline-offset-2"
						>
							docs/TOOLS.md
						</a>{" "}
						- tool reference
					</li>
				</ul>
			</section>
		</div>
	);
}
