import { Camera, Eye, EyeOff, RefreshCw, Sparkles, Wand2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
	type HealthResponse,
	apiGet,
	apiPost,
	checkBackendHealth,
} from "../lib/api";

interface LensEntry {
	[key: string]: string;
}

interface LensesResponse {
	success: boolean;
	data: { lenses: LensEntry; count: number; path: string };
}

interface ActionResult {
	success?: boolean;
	message?: string;
}

export default function Dashboard() {
	const [health, setHealth] = useState<HealthResponse | null>(null);
	const [healthOk, setHealthOk] = useState<boolean | null>(null);
	const [lenses, setLenses] = useState<LensEntry>({});
	const [message, setMessage] = useState<string>("");
	const [loading, setLoading] = useState<string>("");

	const refresh = useCallback(async () => {
		const h = await checkBackendHealth();
		setHealthOk(h.ok);
		if (h.health) setHealth(h.health);
		try {
			const l = await apiGet<LensesResponse>("/api/v1/lenses");
			if (l?.data?.lenses) setLenses(l.data.lenses);
		} catch {
			// backend down - keep stale lens list
		}
	}, []);

	useEffect(() => {
		refresh();
		// Exponential backoff poll: 1s, 2s, 4s, 8s, 16s, then cap
		let delay = 1000;
		let timer: ReturnType<typeof setTimeout>;
		const poll = () => {
			timer = setTimeout(async () => {
				await refresh();
				delay = Math.min(delay * 2, 16000);
				poll();
			}, delay);
		};
		poll();
		return () => clearTimeout(timer);
	}, [refresh]);

	const handleAction = async (action: string, lens?: string) => {
		setLoading(action);
		setMessage("");
		try {
			let result: ActionResult;
			if (action === "set_lens" && lens) {
				result = await apiPost<ActionResult>("/api/v1/lenses/set", {
					lens_identifier: lens,
				});
			} else if (action === "clear") {
				result = await apiPost<ActionResult>("/api/v1/effects/clear");
			} else if (action === "toggle_avatar") {
				result = await apiPost<ActionResult>("/api/v1/avatar/toggle");
			} else if (action === "reload") {
				result = await apiPost<ActionResult>("/api/v1/lenses/reload");
				if (result?.success) refresh();
			} else {
				result = {};
			}
			setMessage(result?.message || (result?.success ? "OK" : "Failed"));
		} catch {
			setMessage("Backend unreachable - check that the server is running.");
		}
		setLoading("");
		refresh();
	};

	const connected = health?.providers?.streamerbot?.connected ?? false;
	const lensKeys = Object.keys(lenses);

	return (
		<div className="mx-auto max-w-4xl" data-testid="dashboard">
			{/* Hero */}
			<div className="mb-8 rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6">
				<div className="flex items-center gap-3">
					<Camera className="h-10 w-10 text-amber-400" />
					<div>
						<h1 className="text-2xl font-bold text-white">Streamfog MCP</h1>
						<p className="text-sm text-zinc-300">
							AR lens and face-filter orchestration for live OBS streams via
							Streamer.bot.
						</p>
					</div>
				</div>
				<div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
					<div
						className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3"
						data-testid="kpi-server"
					>
						<div className="text-xs text-zinc-400">Server</div>
						<div className="truncate text-sm font-semibold text-zinc-100">
							{health?.server ?? "Streamfog MCP"}
						</div>
					</div>
					<div
						className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3"
						data-testid="kpi-tools"
					>
						<div className="text-xs text-zinc-400">MCP Tools</div>
						<div className="text-sm font-semibold text-zinc-100">
							{health?.tool_count ?? "..."}
						</div>
					</div>
					<div
						className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3"
						data-testid="kpi-bridge"
					>
						<div className="text-xs text-zinc-400">Streamer.bot</div>
						<div className="flex items-center gap-1.5 text-sm font-semibold text-zinc-100">
							<span
								className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-400" : "bg-red-400"}`}
							/>
							{connected ? "Connected" : "Disconnected"}
						</div>
					</div>
					<div
						className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3"
						data-testid="kpi-uptime"
					>
						<div className="text-xs text-zinc-400">Uptime</div>
						<div className="text-sm font-semibold text-zinc-100">
							{health ? `${health.uptime_seconds}s` : "..."}
						</div>
					</div>
				</div>
				{healthOk === false && (
					<div
						className="mt-4 rounded-lg border border-red-800 bg-red-950/50 p-3 text-sm text-red-300"
						data-testid="backend-offline-banner"
					>
						Backend offline. Start it with{" "}
						<code className="text-red-200">start.ps1</code>, or use Restart
						Backend in the topbar if running as a desktop app.
					</div>
				)}
				{!connected && healthOk !== false && (
					<div
						className="mt-4 rounded-lg border border-amber-800 bg-amber-950/40 p-3 text-sm text-amber-200"
						data-testid="bridge-cta"
					>
						<strong>Streamer.bot not connected.</strong> Start Streamer.bot,
						enable its WebSocket server (Settings → WebSocket Server), and make
						sure the Streamfog integration is configured. See{" "}
						<a
							href="/help"
							className="underline decoration-amber-400/50 underline-offset-2"
						>
							Help
						</a>{" "}
						for the full checklist.
					</div>
				)}
			</div>

			{/* Quick Actions */}
			<div className="mb-8 grid grid-cols-2 gap-3">
				<button
					type="button"
					onClick={() => handleAction("clear")}
					disabled={loading === "clear"}
					className="flex items-center justify-center gap-2 rounded-xl border border-red-900 bg-red-950/50 p-4 font-medium text-red-200 transition-colors hover:bg-red-900/50 disabled:opacity-50"
					data-testid="clear-effects"
				>
					<EyeOff className="h-5 w-5" />
					Clear All Effects
				</button>
				<button
					type="button"
					onClick={() => handleAction("toggle_avatar")}
					disabled={loading === "toggle_avatar"}
					className="flex items-center justify-center gap-2 rounded-xl border border-purple-900 bg-purple-950/50 p-4 font-medium text-purple-200 transition-colors hover:bg-purple-900/50 disabled:opacity-50"
					data-testid="toggle-avatar"
				>
					<Sparkles className="h-5 w-5" />
					Toggle Avatar
				</button>
			</div>

			{message && (
				<div
					className="mb-6 rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2 text-sm text-zinc-200"
					data-testid="action-message"
				>
					{message}
				</div>
			)}

			{/* Lens Grid */}
			<div className="mb-4 flex items-center gap-2">
				<h2 className="text-lg font-semibold text-zinc-100">
					<Wand2 className="mr-2 inline h-4 w-4 text-amber-400" />
					Available Lenses ({lensKeys.length})
				</h2>
				<button
					type="button"
					onClick={() => handleAction("reload")}
					disabled={loading === "reload"}
					className="ml-auto flex items-center gap-1.5 rounded-lg border border-zinc-700 px-2.5 py-1.5 text-sm text-zinc-300 transition-colors hover:bg-zinc-800"
					title="Reload lens map from disk"
					data-testid="reload-lenses"
				>
					<RefreshCw
						className={`h-4 w-4 ${loading === "reload" ? "animate-spin" : ""}`}
					/>
					Reload
				</button>
			</div>

			{lensKeys.length === 0 ? (
				<div
					className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center text-zinc-400"
					data-testid="lenses-empty"
				>
					No lenses configured. Create a{" "}
					<code className="text-amber-300">lenses.json</code> file in the server
					root, e.g.:
					<pre className="mx-auto mt-3 max-w-md rounded-lg bg-zinc-950 p-3 text-left text-xs text-zinc-300">{`{
  "beauty_smooth": "SetLens_BeautySmooth",
  "cyber_helmet": "SetLens_CyberHelmet",
  "vtuber": "SetLens_VTuberAvatar"
}`}</pre>
				</div>
			) : (
				<div className="grid grid-cols-2 gap-3">
					{lensKeys.map((key) => (
						<button
							type="button"
							key={key}
							onClick={() => handleAction("set_lens", key)}
							disabled={loading === "set_lens"}
							className="group rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 text-left transition-all hover:border-amber-700 hover:bg-zinc-800/60 disabled:opacity-50"
							data-testid={`lens-${key}`}
						>
							<div className="flex items-center gap-2">
								<Eye className="h-4 w-4 text-amber-400" />
								<span className="font-medium capitalize text-zinc-100">
									{key.replace(/_/g, " ")}
								</span>
								{loading === "set_lens" && (
									<span className="ml-auto text-xs text-amber-300 animate-pulse">
										activating...
									</span>
								)}
							</div>
							<div className="mt-2 font-mono text-sm text-zinc-400">
								{lenses[key]}
							</div>
						</button>
					))}
				</div>
			)}
		</div>
	);
}
