import { create } from "zustand";
import { type LlmProvider, llmDiscover } from "../lib/api";

const PROVIDER_KEY = "llm_provider";
const MODEL_KEY = "llm_model";

function readSaved(key: string): string {
	try {
		return localStorage.getItem(key) ?? "";
	} catch {
		return "";
	}
}

function writeSaved(key: string, value: string): void {
	try {
		localStorage.setItem(key, value);
	} catch {
		// storage unavailable - non-fatal
	}
}

interface LlmState {
	providers: LlmProvider[];
	status: Record<string, "probing" | "detected" | "not_found">;
	selectedProvider: string;
	selectedModel: string;
	gpu: { detected: boolean; name: string | null };
	discovering: boolean;
	discover: () => Promise<void>;
	selectProvider: (name: string) => void;
	selectModel: (model: string) => void;
}

export const useLlmStore = create<LlmState>()((set, get) => ({
	providers: [],
	status: {},
	selectedProvider: readSaved(PROVIDER_KEY),
	selectedModel: readSaved(MODEL_KEY),
	gpu: { detected: false, name: null },
	discovering: false,

	discover: async () => {
		set({ discovering: true });
		try {
			const data = await llmDiscover();
			const status: Record<string, "detected" | "not_found"> = {};
			for (const p of data.providers) status[p.name] = "detected";
			for (const k of ["ollama", "lmstudio", "vllm"])
				if (!status[k]) status[k] = "not_found";

			const saved = readSaved(PROVIDER_KEY);
			const stillAvailable = data.providers.some((p) => p.name === saved);
			const provider =
				data.providers.find(
					(p) => p.name === (stillAvailable ? saved : data.providers[0]?.name),
				) ?? null;

			const savedModel = readSaved(MODEL_KEY);
			const model = provider?.models.includes(savedModel)
				? savedModel
				: (provider?.models[0] ?? "");

			if (provider) writeSaved(PROVIDER_KEY, provider.name);
			if (model) writeSaved(MODEL_KEY, model);

			set({
				providers: data.providers,
				status,
				selectedProvider: provider?.name ?? "",
				selectedModel: model,
				gpu: data.gpu,
			});
		} catch {
			set({ status: {}, providers: [] });
		} finally {
			set({ discovering: false });
		}
	},

	selectProvider: (name: string) => {
		const provider = get().providers.find((p) => p.name === name);
		const model = provider?.models[0] ?? "";
		writeSaved(PROVIDER_KEY, name);
		if (model) writeSaved(MODEL_KEY, model);
		set({ selectedProvider: name, selectedModel: model });
	},

	selectModel: (model: string) => {
		writeSaved(MODEL_KEY, model);
		set({ selectedModel: model });
	},
}));
