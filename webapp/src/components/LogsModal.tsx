import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { apiGet } from "../lib/api";

interface LogRecord {
	ts: number;
	level: string;
	source: string;
	message: string;
}

interface LogsResponse {
	success: boolean;
	data: { records: LogRecord[]; count: number };
}

export default function LogsModal({ onClose }: { onClose: () => void }) {
	const [records, setRecords] = useState<LogRecord[]>([]);
	const [level, setLevel] = useState("");
	const [search, setSearch] = useState("");

	useEffect(() => {
		const load = async () => {
			try {
				const q = new URLSearchParams();
				if (level) q.set("level", level);
				if (search) q.set("search", search);
				q.set("limit", "200");
				const res = await apiGet<LogsResponse>(`/api/logs?${q.toString()}`);
				setRecords(res.data.records);
			} catch {
				setRecords([]);
			}
		};
		load();
		const timer = setInterval(load, 3000);
		return () => clearInterval(timer);
	}, [level, search]);

	const levelColor: Record<string, string> = {
		INFO: "text-sky-300",
		WARNING: "text-amber-300",
		ERROR: "text-red-400",
		CRITICAL: "text-red-400",
		DEBUG: "text-zinc-500",
	};

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
			onClick={(e) => {
				if (e.target === e.currentTarget) onClose();
			}}
			onKeyDown={(e) => {
				if (e.key === "Escape") onClose();
			}}
			role="presentation"
		>
			<div
				className="flex h-[70vh] w-full max-w-3xl flex-col rounded-xl border border-zinc-700 bg-zinc-900"
				data-testid="logs-modal"
			>
				<div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
					<h2 className="text-sm font-semibold text-zinc-200">Server Logs</h2>
					<button
						type="button"
						onClick={onClose}
						className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
						aria-label="Close logs"
					>
						<X className="h-4 w-4" />
					</button>
				</div>
				<div className="flex items-center gap-3 border-b border-zinc-800 px-4 py-2">
					<select
						value={level}
						onChange={(e) => setLevel(e.target.value)}
						className="rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-100"
						data-testid="logs-level"
					>
						<option value="">All levels</option>
						<option value="INFO">INFO+</option>
						<option value="WARNING">WARNING+</option>
						<option value="ERROR">ERROR+</option>
					</select>
					<input
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Search logs..."
						className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-100 placeholder:text-zinc-500"
						data-testid="logs-search"
					/>
				</div>
				<div className="flex-1 overflow-y-auto p-4 font-mono text-xs">
					{records.length === 0 ? (
						<div className="text-zinc-500">No log records yet.</div>
					) : (
						records.map((r, i) => (
							<div key={`${r.ts}-${i}`} className="mb-1 flex gap-2">
								<span className="shrink-0 text-zinc-500">
									{new Date(r.ts * 1000).toLocaleTimeString()}
								</span>
								<span
									className={`shrink-0 w-16 ${levelColor[r.level] ?? "text-zinc-300"}`}
								>
									{r.level}
								</span>
								<span className="shrink-0 text-zinc-500">{r.source}</span>
								<span className="break-all text-zinc-200">{r.message}</span>
							</div>
						))
					)}
				</div>
			</div>
		</div>
	);
}
