import { Download, Eraser, MessageSquare, Send } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { apiGet } from "../lib/api";
import { useLlmStore } from "../store/llm";

const HISTORY_KEY = "streamfog-mcp-chat-history";
const PERSONALITY_KEY = "streamfog-mcp-chat-personality";
const MAX_MESSAGES = 100;

interface ChatMessage {
	role: "user" | "assistant";
	content: string;
	ts?: string;
}

interface SkillsResponse {
	success: boolean;
	data: { skills: { name: string; uri: string }[]; count: number };
}

interface SkillContentResponse {
	success: boolean;
	name: string;
	content: string;
}

const PERSONALITIES: Record<string, { label: string; prompt: string }> = {
	"stream-director": {
		label: "Stream Director",
		prompt:
			"You are a professional live-stream director. Be concise and action-oriented: suggest the exact lens or effect, confirm before switching during important moments, and explain why a visual choice fits the stream.",
	},
	"friendly-helper": {
		label: "Friendly Assistant",
		prompt:
			"You are a friendly, upbeat streaming assistant. Answer questions about Streamfog, OBS, and stream setup with clear step-by-step guidance. Keep replies warm and short.",
	},
	"quick-summarizer": {
		label: "Quick Summarizer",
		prompt:
			"You are a terse summarizer. Respond in at most 3 bullet points. No preamble, no filler.",
	},
	custom: {
		label: "Custom",
		prompt: "",
	},
};

const EXAMPLE_PROMPTS = [
	{
		group: "Control",
		prompts: [
			"Switch to the cyber_helmet lens",
			"Clear all effects",
			"Toggle the avatar on",
		],
	},
	{
		group: "Status",
		prompts: [
			"Is the Streamer.bot bridge connected?",
			"What lenses are configured?",
		],
	},
	{
		group: "Setup",
		prompts: [
			"How do I map a new lens in lenses.json?",
			"My action is sent but nothing happens - why?",
		],
	},
];

function loadHistory(): ChatMessage[] {
	try {
		const raw = localStorage.getItem(HISTORY_KEY);
		const parsed = raw ? (JSON.parse(raw) as ChatMessage[]) : [];
		return Array.isArray(parsed) ? parsed.slice(-MAX_MESSAGES) : [];
	} catch {
		return [];
	}
}

function saveHistory(messages: ChatMessage[]) {
	try {
		localStorage.setItem(
			HISTORY_KEY,
			JSON.stringify(messages.slice(-MAX_MESSAGES)),
		);
	} catch {
		// storage unavailable - non-fatal
	}
}

export default function Chat() {
	const [messages, setMessages] = useState<ChatMessage[]>(loadHistory);
	const [input, setInput] = useState("");
	const [skillContent, setSkillContent] = useState("");
	const [skillName, setSkillName] = useState("");
	const [personalityId, setPersonalityId] = useState(() => {
		try {
			return localStorage.getItem(PERSONALITY_KEY) ?? "stream-director";
		} catch {
			return "stream-director";
		}
	});
	const [customPrompt, setCustomPrompt] = useState("");
	const [thinking, setThinking] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const messagesRef = useRef<HTMLDivElement>(null);
	const llm = useLlmStore();

	useEffect(() => {
		try {
			localStorage.setItem(PERSONALITY_KEY, personalityId);
		} catch {
			// ignore
		}
	}, [personalityId]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: skill + provider discovery run once on mount
	useEffect(() => {
		// Skill-first: load the primary skill as the base system prompt
		apiGet<SkillsResponse>("/api/skills")
			.then(async (res) => {
				const first = res.data.skills[0];
				if (!first) return;
				setSkillName(first.name);
				const content = await apiGet<SkillContentResponse>(
					`/api/skills/${first.name}`,
				);
				setSkillContent(content.content);
			})
			.catch(() => {
				setSkillContent("");
			});
		llm.discover();
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: scroll-to-bottom must re-run when the message list grows
	useEffect(() => {
		messagesRef.current?.scrollTo({
			top: messagesRef.current.scrollHeight,
			behavior: "smooth",
		});
	}, [messages.length, thinking]);

	const buildSystemPrompt = useCallback((): string => {
		const role = PERSONALITIES[personalityId]?.prompt ?? "";
		if (personalityId === "custom")
			return customPrompt || skillContent || "You are a helpful assistant.";
		if (!role) return skillContent || "You are a helpful assistant.";
		return `${skillContent || "You are a helpful streaming assistant."}\n\n---\n\n## Role\n${role}`;
	}, [personalityId, skillContent, customPrompt]);

	const sendMessage = useCallback(
		async (text?: string) => {
			const content = (text ?? input).trim();
			if (!content || thinking) return;
			if (!llm.selectedProvider || !llm.selectedModel) {
				setError(
					"No local LLM detected. Start Ollama or LM Studio, then pick a provider in Settings.",
				);
				return;
			}
			setError(null);
			const userMsg: ChatMessage = {
				role: "user",
				content,
				ts: new Date().toISOString(),
			};
			const updated = [...messages, userMsg];
			setMessages(updated);
			saveHistory(updated);
			setInput("");
			setThinking(true);

			try {
				const provider = llm.providers.find(
					(p) => p.name === llm.selectedProvider,
				);
				if (!provider) throw new Error("Provider not found");
				const url = `${provider.base}/v1/chat/completions`;
				const history = updated
					.slice(-20)
					.map((m) => ({ role: m.role, content: m.content }));
				const res = await fetch(url, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						model: llm.selectedModel,
						messages: [
							{ role: "system", content: buildSystemPrompt() },
							...history,
						],
						stream: true,
					}),
				});
				if (!res.ok || !res.body)
					throw new Error(`HTTP ${res.status} from provider`);

				const reader = res.body.getReader();
				const decoder = new TextDecoder();
				let assistant = "";
				setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
				while (true) {
					const { done, value } = await reader.read();
					if (done) break;
					const chunk = decoder.decode(value, { stream: true });
					for (const line of chunk.split("\n")) {
						const trimmed = line.trim();
						if (!trimmed.startsWith("data:")) continue;
						const payload = trimmed.slice(5).trim();
						if (payload === "[DONE]") continue;
						try {
							const json = JSON.parse(payload);
							const delta: string | undefined =
								json.choices?.[0]?.delta?.content;
							if (delta) {
								assistant += delta;
								setMessages((prev) => {
									const next = [...prev];
									next[next.length - 1] = {
										role: "assistant",
										content: assistant,
									};
									return next;
								});
							}
						} catch {
							// partial JSON line - skip
						}
					}
				}
				const final = [
					...messages,
					userMsg,
					{
						role: "assistant" as const,
						content: assistant,
						ts: new Date().toISOString(),
					},
				];
				saveHistory(final);
			} catch (e) {
				const msg = e instanceof Error ? e.message : "Request failed";
				setError(`LLM request failed: ${msg}`);
				const final: ChatMessage[] = [
					...messages,
					userMsg,
					{
						role: "assistant",
						content: `Error: ${msg}`,
						ts: new Date().toISOString(),
					},
				];
				saveHistory(final);
			} finally {
				setThinking(false);
			}
		},
		[
			input,
			thinking,
			llm.selectedProvider,
			llm.selectedModel,
			llm.providers,
			messages,
			buildSystemPrompt,
		],
	);

	const exportChat = () => {
		const text = messages
			.map(
				(m) =>
					`[${m.ts ? new Date(m.ts).toISOString() : "?"}] ${m.role.toUpperCase()}: ${m.content}`,
			)
			.join("\n\n");
		const blob = new Blob([text], { type: "text/plain" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `streamfog-mcp-chat-${Date.now()}.txt`;
		a.click();
		URL.revokeObjectURL(url);
	};

	const clearChat = () => {
		setMessages([]);
		saveHistory([]);
	};

	const provider = llm.providers.find((p) => p.name === llm.selectedProvider);
	const flatExamples = EXAMPLE_PROMPTS.flatMap((g) => g.prompts);

	return (
		<div
			className="mx-auto flex h-full max-w-3xl flex-col"
			data-testid="chat-page"
		>
			<div
				className="mb-4 flex flex-wrap items-center gap-3"
				data-testid="chat-controls"
			>
				<h1 className="mr-auto flex items-center gap-2 text-xl font-semibold text-zinc-100">
					<MessageSquare className="h-5 w-5 text-amber-400" />
					Chat
				</h1>
				<select
					value={personalityId}
					onChange={(e) => setPersonalityId(e.target.value)}
					className="rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-100"
					data-testid="personality-select"
					aria-label="Personality"
				>
					{Object.entries(PERSONALITIES).map(([id, p]) => (
						<option key={id} value={id}>
							{p.label}
						</option>
					))}
				</select>
				{personalityId === "custom" && (
					<input
						value={customPrompt}
						onChange={(e) => setCustomPrompt(e.target.value)}
						placeholder="Custom system prompt..."
						className="w-64 rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-500"
						data-testid="custom-prompt"
					/>
				)}
				<button
					type="button"
					onClick={exportChat}
					disabled={messages.length === 0}
					className="rounded-lg border border-zinc-700 p-2 text-zinc-300 transition-colors hover:bg-zinc-800 disabled:opacity-40"
					title="Export chat (.txt)"
					data-testid="chat-export"
				>
					<Download className="h-4 w-4" />
				</button>
				<button
					type="button"
					onClick={clearChat}
					disabled={messages.length === 0}
					className="rounded-lg border border-zinc-700 p-2 text-zinc-300 transition-colors hover:bg-zinc-800 disabled:opacity-40"
					title="Clear conversation"
					data-testid="chat-clear"
				>
					<Eraser className="h-4 w-4" />
				</button>
				<span
					className={`flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs ${
						llm.selectedProvider
							? "border-emerald-800 text-emerald-300"
							: "border-zinc-700 text-zinc-500"
					}`}
					data-testid="llm-status"
				>
					<span
						className={`h-1.5 w-1.5 rounded-full ${llm.selectedProvider ? "bg-emerald-400" : "bg-zinc-500"}`}
					/>
					{llm.selectedProvider
						? `${provider?.name ?? ""} · ${llm.selectedModel}`
						: "No LLM detected"}
				</span>
				{skillName && (
					<span className="rounded-full border border-zinc-700 px-2 py-1 text-xs text-zinc-400">
						skill:{skillName}
					</span>
				)}
			</div>

			<div
				ref={messagesRef}
				className="flex-1 space-y-4 overflow-y-auto pb-4"
				data-testid="chat-messages"
			>
				{messages.length === 0 && !thinking ? (
					<div className="pt-8 text-center">
						<MessageSquare className="mx-auto mb-3 h-8 w-8 text-zinc-600" />
						<p className="text-sm text-zinc-400">
							Ask about lenses, effects, avatar control, or stream setup. Chat
							uses the{" "}
							{llm.selectedProvider
								? `${provider?.name} provider (${llm.selectedModel})`
								: "local LLM configured in Settings"}
							.
						</p>
						<div className="mt-6 space-y-4" data-testid="example-prompts">
							{EXAMPLE_PROMPTS.map((group) => (
								<div key={group.group}>
									<div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
										{group.group}
									</div>
									<div className="flex flex-wrap justify-center gap-2">
										{group.prompts.map((p) => (
											<button
												type="button"
												key={p}
												onClick={() => setInput(p)}
												className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:border-amber-700 hover:text-zinc-100"
											>
												{p}
											</button>
										))}
									</div>
								</div>
							))}
						</div>
					</div>
				) : (
					messages.map((m, i) => (
						<div
							key={`${m.ts ?? "m"}-${i}`}
							className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
						>
							<div
								className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${
									m.role === "user"
										? "bg-amber-500/15 text-amber-100"
										: "border border-zinc-800 bg-zinc-900/60 text-zinc-200"
								}`}
								data-testid={`chat-msg-${m.role}`}
							>
								{m.content || "..."}
							</div>
						</div>
					))
				)}
				{thinking && (
					<div className="flex justify-start">
						<div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-2.5 text-sm text-zinc-400">
							Thinking...
						</div>
					</div>
				)}
				{error && (
					<div
						className="rounded-xl border border-red-800 bg-red-950/50 px-4 py-2 text-sm text-red-300"
						data-testid="chat-error"
					>
						{error}
					</div>
				)}
			</div>

			<div className="flex items-center gap-2 border-t border-zinc-800 pt-3">
				<input
					value={input}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter" && !e.shiftKey) {
							e.preventDefault();
							sendMessage();
						}
					}}
					placeholder={
						flatExamples.length
							? `e.g. ${flatExamples[0]}`
							: "Ask about lenses or effects..."
					}
					className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-amber-700 focus:outline-none"
					data-testid="chat-input"
				/>
				<button
					type="button"
					onClick={() => sendMessage()}
					disabled={thinking || !input.trim() || !llm.selectedProvider}
					className="rounded-xl bg-amber-500 p-2.5 text-zinc-950 transition-colors hover:bg-amber-400 disabled:opacity-40"
					aria-label="Send"
					data-testid="chat-send"
				>
					<Send className="h-4 w-4" />
				</button>
			</div>
		</div>
	);
}
