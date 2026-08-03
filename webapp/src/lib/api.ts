export const API_BASE = "http://127.0.0.1:10994";

export async function apiGet<T>(path: string): Promise<T> {
	const res = await fetch(API_BASE + path);
	if (!res.ok) throw new Error(`HTTP ${res.status} on ${path}`);
	return res.json() as Promise<T>;
}

export async function apiPost<T>(
	path: string,
	body?: Record<string, unknown>,
): Promise<T> {
	const res = await fetch(API_BASE + path, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: body ? JSON.stringify(body) : undefined,
	});
	if (!res.ok) throw new Error(`HTTP ${res.status} on ${path}`);
	return res.json() as Promise<T>;
}

export interface HealthResponse {
	status: string;
	server: string;
	version: string;
	uptime_seconds: number;
	tool_count: number;
	providers: { streamerbot: BridgeStatus };
}

export interface BridgeStatus {
	connected: boolean;
	host: string;
	port: number;
	lenses_loaded: number;
	last_error: string | null;
}

export interface ToolInfo {
	name: string;
	description: string | null;
	input_schema: Record<string, unknown> | null;
}

export interface SkillInfo {
	name: string;
	uri: string;
}

export interface LlmProvider {
	name: string;
	base: string;
	port: number;
	models: string[];
}

export interface LlmDiscoverResponse {
	success: boolean;
	data: {
		providers: LlmProvider[];
		count: number;
		gpu: { detected: boolean; name: string | null };
	};
}

export async function checkBackendHealth(): Promise<{
	ok: boolean;
	health: HealthResponse | null;
	error?: string;
}> {
	try {
		const r = await fetch(`${API_BASE}/api/health`);
		if (!r.ok) return { ok: false, health: null, error: `HTTP ${r.status}` };
		const health = (await r.json()) as HealthResponse;
		return { ok: health.status === "ok", health };
	} catch (e) {
		return {
			ok: false,
			health: null,
			error: e instanceof Error ? e.message : "Network error",
		};
	}
}

export async function llmDiscover(): Promise<LlmDiscoverResponse["data"]> {
	const res = await apiGet<LlmDiscoverResponse>("/api/llm/discover");
	return res.data;
}
