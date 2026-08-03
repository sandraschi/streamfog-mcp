import { Wrench } from "lucide-react";
import { useEffect, useState } from "react";
import { type ToolInfo, apiGet } from "../lib/api";

interface ToolsResponse {
	success: boolean;
	data: { tools: ToolInfo[]; count: number };
}

export default function Tools() {
	const [tools, setTools] = useState<ToolInfo[]>([]);
	const [selected, setSelected] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		apiGet<ToolsResponse>("/api/tools")
			.then((res) => setTools(res.data.tools))
			.catch(() => setError("Could not load tools - is the backend running?"));
	}, []);

	const active = tools.find((t) => t.name === selected) ?? null;

	return (
		<div className="mx-auto max-w-4xl" data-testid="tools-page">
			<h1 className="mb-1 text-xl font-semibold text-zinc-100">
				<Wrench className="mr-2 inline h-5 w-5 text-amber-400" />
				MCP Tools
			</h1>
			<p className="mb-6 text-sm text-zinc-400">
				{tools.length > 0
					? `${tools.length} tools registered by the server - loaded dynamically via /api/tools.`
					: (error ?? "Loading tools...")}
			</p>

			{error && (
				<div className="rounded-lg border border-red-800 bg-red-950/50 p-3 text-sm text-red-300">
					{error}
				</div>
			)}

			<div className="grid gap-4 md:grid-cols-2">
				<div className="space-y-2">
					{tools.map((t) => (
						<button
							type="button"
							key={t.name}
							onClick={() => setSelected(t.name)}
							className={`w-full rounded-xl border p-3 text-left transition-colors ${
								selected === t.name
									? "border-amber-700 bg-zinc-800/80"
									: "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
							}`}
							data-testid={`tool-${t.name}`}
						>
							<div className="font-mono text-sm font-medium text-zinc-100">
								{t.name}
							</div>
							<div className="mt-1 line-clamp-2 text-sm text-zinc-400">
								{t.description ?? "No description"}
							</div>
						</button>
					))}
				</div>

				<div
					className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"
					data-testid="tool-detail"
				>
					{active ? (
						<>
							<h2 className="font-mono text-sm font-semibold text-amber-300">
								{active.name}
							</h2>
							<p className="mt-2 text-sm text-zinc-300">
								{active.description ?? "No description"}
							</p>
							{active.input_schema ? (
								<div className="mt-4">
									<div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
										Input Schema
									</div>
									<pre className="max-h-80 overflow-auto rounded-lg bg-zinc-950 p-3 text-xs text-zinc-300">
										{JSON.stringify(active.input_schema, null, 2)}
									</pre>
								</div>
							) : (
								<p className="mt-4 text-sm text-zinc-500">
									This tool accepts no parameters.
								</p>
							)}
						</>
					) : (
						<p className="text-sm text-zinc-500">
							Select a tool to inspect its schema and description.
						</p>
					)}
				</div>
			</div>
		</div>
	);
}
