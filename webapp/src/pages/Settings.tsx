import { Activity, Cpu, Settings as SettingsIcon, Wifi } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
	type HealthResponse,
	type LlmProvider,
	apiGet,
	checkBackendHealth,
} from "../lib/api";
import { useLlmStore } from "../store/llm";

interface LensesResponse {
	success: boolean;
	data: { lenses: Record<string, string>; count: number; path: string };
}

interface SkillsResponse {
	success: boolean;
	data: { skills: { name: string; uri: string }[]; count: number };
}

export default function Settings() {
	const [health, setHealth] = useState<HealthResponse | null>(null);
	const [lensPath, setLensPath] = useState<string>("");
	const [skills, setSkills] = useState<string[]>([]);
	const llm = useLlmStore();

	const refresh = useCallback(async () => {
		const h = await checkBackendHealth();
		if (h.health) setHealth(h.health);
		try {
			const l = await apiGet<LensesResponse>("/api/v1/lenses");
			setLensPath(l.data.path);
		} catch {
			// backend down
		}
		try {
			const s = await apiGet<SkillsResponse>("/api/skills");
			setSkills(s.data.skills.map((k) => k.name));
		} catch {
			// backend down
		}
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: health refresh + llm discover run once on mount
	useEffect(() => {
		refresh();
		llm.discover();
	}, [refresh]);

	const provider = llm.providers.find(
		(p: LlmProvider) => p.name === llm.selectedProvider,
	);

	return (
		<div className="mx-auto max-w-3xl space-y-6" data-testid="settings-page">
			<h1 className="text-xl font-semibold text-zinc-100">
				<SettingsIcon className="mr-2 inline h-5 w-5 text-amber-400" />
				Settings
			</h1>

			<section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
				<h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-200">
					<Activity className="h-4 w-4 text-amber-400" />
					Backend Health
				</h2>
				<div
					className="grid grid-cols-2 gap-3 sm:grid-cols-4"
					data-testid="health-kpis"
				>
					<div
						className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3"
						data-testid="kpi-version"
					>
						<div className="text-xs text-zinc-500">Version</div>
						<div className="text-sm font-semibold text-zinc-100">
							{health?.version ?? "..."}
						</div>
					</div>
					<div
						className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3"
						data-testid="kpi-status"
					>
						<div className="text-xs text-zinc-500">Status</div>
						<div className="text-sm font-semibold text-zinc-100">
							{health?.status ?? "..."}
						</div>
					</div>
					<div
						className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3"
						data-testid="kpi-uptime"
					>
						<div className="text-xs text-zinc-500">Uptime</div>
						<div className="text-sm font-semibold text-zinc-100">
							{health ? `${health.uptime_seconds}s` : "..."}
						</div>
					</div>
					<div
						className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3"
						data-testid="kpi-tools"
					>
						<div className="text-xs text-zinc-500">Tools</div>
						<div className="text-sm font-semibold text-zinc-100">
							{health?.tool_count ?? "..."}
						</div>
					</div>
				</div>
				<div className="mt-3 flex items-center gap-2 text-sm">
					<Wifi className="h-4 w-4 text-zinc-400" />
					<span className="text-zinc-400">Streamer.bot:</span>
					<span
						className={
							health?.providers?.streamerbot?.connected
								? "text-emerald-300"
								: "text-red-300"
						}
					>
						{health?.providers?.streamerbot?.connected
							? "Connected"
							: "Disconnected"}
					</span>
					<span className="text-zinc-500">
						{health?.providers?.streamerbot?.host}:
						{health?.providers?.streamerbot?.port}
					</span>
				</div>
				<div className="mt-2 text-sm text-zinc-400">
					Lens map:{" "}
					<code className="text-zinc-300">{lensPath || "lenses.json"}</code> (
					{health?.providers?.streamerbot?.lenses_loaded ?? 0} lenses)
				</div>
			</section>

			<section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
				<h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-200">
					<Cpu className="h-4 w-4 text-amber-400" />
					Local LLM
				</h2>
				{llm.discovering ? (
					<p className="text-sm text-zinc-400">Probing local providers...</p>
				) : llm.providers.length === 0 ? (
					<div
						className="text-sm text-amber-200"
						data-testid="llm-not-detected"
					>
						No local LLM detected. Install{" "}
						<a
							href="https://ollama.com"
							target="_blank"
							rel="noreferrer"
							className="underline decoration-amber-400/50 underline-offset-2"
						>
							Ollama
						</a>{" "}
						or LM Studio to enable AI chat features.
						{llm.gpu.detected && (
							<div className="mt-2 text-zinc-300">
								High-performance GPU detected ({llm.gpu.name}). Install Ollama
								or LM Studio to unlock free local AI features.
							</div>
						)}
					</div>
				) : (
					<div className="grid gap-3 sm:grid-cols-2">
						<div>
							<label
								className="mb-1 block text-xs text-zinc-400"
								htmlFor="llm-provider-select"
							>
								Provider
							</label>
							<select
								id="llm-provider-select"
								value={llm.selectedProvider}
								onChange={(e) => llm.selectProvider(e.target.value)}
								className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-100"
								data-testid="llm-provider-select"
							>
								{llm.providers.map((p: LlmProvider) => (
									<option key={p.name} value={p.name}>
										{p.name} ({p.port})
									</option>
								))}
							</select>
						</div>
						<div>
							<label
								className="mb-1 block text-xs text-zinc-400"
								htmlFor="llm-model-select"
							>
								Model
							</label>
							<select
								id="llm-model-select"
								value={llm.selectedModel}
								onChange={(e) => llm.selectModel(e.target.value)}
								className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-100"
								data-testid="llm-model-select"
							>
								{(provider?.models ?? []).map((m: string) => (
									<option key={m} value={m}>
										{m}
									</option>
								))}
							</select>
						</div>
					</div>
				)}
				<div className="mt-3 flex flex-wrap gap-2 text-xs">
					{Object.entries(llm.status).map(([name, state]) => (
						<span
							key={name}
							className={`rounded-full border px-2 py-0.5 ${state === "detected" ? "border-emerald-800 text-emerald-300" : "border-zinc-700 text-zinc-500"}`}
							data-testid={`provider-${name}`}
						>
							{name}: {state === "detected" ? "Detected" : "Not found"}
						</span>
					))}
					{llm.gpu.detected && (
						<span
							className="rounded-full border border-amber-800 px-2 py-0.5 text-amber-300"
							data-testid="gpu-detected"
						>
							GPU: {llm.gpu.name}
						</span>
					)}
				</div>
			</section>

			<section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
				<h2 className="mb-3 text-sm font-semibold text-zinc-200">Skills</h2>
				{skills.length === 0 ? (
					<p className="text-sm text-zinc-500">No skills registered.</p>
				) : (
					<ul className="space-y-1 text-sm text-zinc-300">
						{skills.map((s) => (
							<li key={s} className="font-mono">
								{s}
							</li>
						))}
					</ul>
				)}
			</section>
		</div>
	);
}
