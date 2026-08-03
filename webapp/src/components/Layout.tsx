import {
	Camera,
	ChevronLeft,
	ChevronRight,
	HelpCircle,
	LayoutDashboard,
	MessageSquare,
	Settings,
	Terminal,
	Wrench,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { type HealthResponse, checkBackendHealth } from "../lib/api";
import useZoom from "../lib/useZoom";
import LogsModal from "./LogsModal";

const NAV_ITEMS = [
	{ to: "/", label: "Dashboard", icon: LayoutDashboard },
	{ to: "/tools", label: "Tools", icon: Wrench },
	{ to: "/chat", label: "Chat", icon: MessageSquare },
	{ to: "/settings", label: "Settings", icon: Settings },
	{ to: "/help", label: "Help", icon: HelpCircle },
];

export default function Layout() {
	const [collapsed, setCollapsed] = useState(false);
	const [logsOpen, setLogsOpen] = useState(false);
	const [backendOk, setBackendOk] = useState<boolean | null>(null);
	const [health, setHealth] = useState<HealthResponse | null>(null);
	const { zoom } = useZoom();

	const refresh = useCallback(async () => {
		const h = await checkBackendHealth();
		setBackendOk(h.ok);
		if (h.health) setHealth(h.health);
	}, []);

	useEffect(() => {
		refresh();
		// Exponential backoff poll: 1s, 2s, 4s, 8s, 16s, then cap at 16s
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

	useEffect(() => {
		let unlisten: (() => void) | undefined;
		(async () => {
			try {
				const { listen } = await import("@tauri-apps/api/event");
				unlisten = await listen<string>("backend-status", (event) => {
					if (event.payload === "ready") refresh();
					else if (
						typeof event.payload === "string" &&
						event.payload.startsWith("error:")
					)
						setBackendOk(false);
				});
			} catch {
				// Not inside Tauri - HTTP polling handles it
			}
		})();
		return () => {
			if (unlisten) unlisten();
		};
	}, [refresh]);

	const restartBackend = useCallback(async () => {
		try {
			const { invoke } = await import("@tauri-apps/api/core");
			await invoke("start_backend");
		} catch {
			// Not in Tauri - HTTP poll will update
		}
	}, []);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.ctrlKey && e.key.toLowerCase() === "l") {
				e.preventDefault();
				setLogsOpen((v) => !v);
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);

	return (
		<div className="flex min-h-screen bg-zinc-950 text-zinc-100">
			<aside
				className={`flex flex-col border-r border-zinc-800 bg-zinc-900/60 backdrop-blur transition-all ${collapsed ? "w-16" : "w-52"}`}
				data-testid="sidebar"
			>
				<div className="flex items-center gap-2 px-3 py-4">
					<Camera className="h-6 w-6 shrink-0 text-amber-400" />
					{!collapsed && (
						<div className="min-w-0">
							<div className="truncate text-sm font-semibold">
								Streamfog MCP
							</div>
							<div className="text-xs text-zinc-400">v0.1.0</div>
						</div>
					)}
				</div>
				<button
					type="button"
					onClick={() => setCollapsed((v) => !v)}
					className="mx-2 mb-2 flex items-center justify-center gap-1 rounded-lg border border-zinc-800 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
					title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
					data-testid="sidebar-collapse"
				>
					{collapsed ? (
						<ChevronRight className="h-3.5 w-3.5" />
					) : (
						<ChevronLeft className="h-3.5 w-3.5" />
					)}
				</button>
				<nav className="flex-1 space-y-1 px-2">
					{NAV_ITEMS.map(({ to, label, icon: Icon }) => (
						<NavLink
							key={to}
							to={to}
							end={to === "/"}
							className={({ isActive }) =>
								`flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors ${
									isActive
										? "bg-zinc-800 text-white"
										: "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
								}`
							}
							aria-label={label}
							data-testid={`nav-${label.toLowerCase()}`}
						>
							<Icon className="h-4 w-4 shrink-0" />
							{!collapsed && <span>{label}</span>}
						</NavLink>
					))}
				</nav>
				<div className="border-t border-zinc-800 p-3 text-center text-xs text-zinc-500">
					{Math.round(zoom * 100)}%
				</div>
			</aside>

			<div className="flex min-w-0 flex-1 flex-col">
				<header
					className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/60 px-4 py-2 backdrop-blur"
					data-testid="topbar"
				>
					<div className="text-sm font-medium text-zinc-300">Streamfog MCP</div>
					<div className="flex items-center gap-3">
						<div
							className="flex items-center gap-2 text-xs"
							data-testid="backend-dot"
						>
							<span
								className={`h-2 w-2 rounded-full ${backendOk === null ? "bg-zinc-500 animate-pulse" : backendOk ? "bg-emerald-400" : "bg-red-500"}`}
							/>
							<span className="text-zinc-300">
								{backendOk === null
									? "Connecting..."
									: backendOk
										? "Online"
										: "Offline"}
							</span>
						</div>
						{!backendOk && (
							<button
								type="button"
								onClick={restartBackend}
								className="rounded-lg border border-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-800"
								data-testid="restart-backend"
							>
								Restart Backend
							</button>
						)}
						{health && (
							<span className="hidden text-xs text-zinc-400 sm:inline">
								{health.tool_count} tools · {health.uptime_seconds}s
							</span>
						)}
						<button
							type="button"
							onClick={() => setLogsOpen(true)}
							className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
							title="Logs (Ctrl+L)"
							data-testid="open-logs"
						>
							<Terminal className="h-4 w-4" />
						</button>
					</div>
				</header>
				<main className="flex-1 overflow-y-auto p-6">
					<Outlet />
				</main>
			</div>

			{logsOpen && <LogsModal onClose={() => setLogsOpen(false)} />}
		</div>
	);
}
