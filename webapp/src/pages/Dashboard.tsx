import { useCallback, useEffect, useState } from "react";
import { Camera, Eye, EyeOff, RefreshCw, Sparkles, Wand2 } from "lucide-react";

interface BridgeStatus {
  connected: boolean;
  host: string;
  port: number;
  lenses_loaded: number;
  last_error: string | null;
}

interface ServerStatus {
  ok: boolean;
  version: string;
  bridge: BridgeStatus;
  lenses: number;
}

interface LensEntry {
  [key: string]: string;
}

async function apiGet(path: string) {
  const res = await fetch(`/api${path}`);
  return res.json();
}

async function apiPost(path: string, body?: Record<string, unknown>) {
  const res = await fetch(`/api${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

export default function Dashboard() {
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [lenses, setLenses] = useState<LensEntry>({});
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState<string>("");

  const refresh = useCallback(async () => {
    const s = await apiGet("/v1/status");
    setStatus(s);
    const l = await apiGet("/v1/lenses");
    if (l?.data?.lenses) setLenses(l.data.lenses);
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  const handleAction = async (action: string, lens?: string) => {
    setLoading(action);
    setMessage("");
    let result;
    if (action === "set_lens" && lens) {
      result = await apiPost("/v1/lenses/set", { lens_identifier: lens });
    } else if (action === "clear") {
      result = await apiPost("/v1/effects/clear");
    } else if (action === "toggle_avatar") {
      result = await apiPost("/v1/avatar/toggle");
    } else if (action === "reload") {
      result = await apiPost("/v1/lenses/reload");
      if (result?.data?.lenses) setLenses(result.data.lenses);
    }
    setMessage(result?.message || result?.success ? "OK" : "Failed");
    setLoading("");
    refresh();
  };

  const connected = status?.bridge?.connected ?? false;
  const lensKeys = Object.keys(lenses);

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-slate-200 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Camera className="w-8 h-8 text-cyan-400" />
          <div>
            <h1 className="text-2xl font-bold">Streamfog MCP</h1>
            <p className="text-slate-500 text-sm">AR Lens Orchestrator v{status?.version || "?"}</p>
          </div>
        </div>

        {/* Status bar */}
        <div className={`rounded-lg p-4 mb-6 flex items-center gap-3 ${connected ? "bg-emerald-950/50 border border-emerald-800" : "bg-red-950/50 border border-red-800"}`}>
          <div className={`w-3 h-3 rounded-full ${connected ? "bg-emerald-400" : "bg-red-400"}`} />
          <div className="flex-1">
            <span className="font-medium">{connected ? "Connected" : "Disconnected"}</span>
            <span className="text-slate-500 ml-2">
              {status?.bridge?.host}:{status?.bridge?.port} &middot; {status?.bridge?.lenses_loaded ?? 0} lenses
            </span>
            {status?.bridge?.last_error && (
              <span className="block text-red-400 text-sm mt-1">{status.bridge.last_error}</span>
            )}
          </div>
          <button
            onClick={() => handleAction("reload")}
            disabled={loading === "reload"}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            title="Reload lens map"
          >
            <RefreshCw className={`w-4 h-4 ${loading === "reload" ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <button
            onClick={() => handleAction("clear")}
            disabled={loading === "clear"}
            className="flex items-center justify-center gap-2 p-4 rounded-lg bg-red-950/50 border border-red-800 hover:bg-red-900/50 transition-colors font-medium"
          >
            <EyeOff className="w-5 h-5" />
            Clear All Effects
          </button>
          <button
            onClick={() => handleAction("toggle_avatar")}
            disabled={loading === "toggle_avatar"}
            className="flex items-center justify-center gap-2 p-4 rounded-lg bg-purple-950/50 border border-purple-800 hover:bg-purple-900/50 transition-colors font-medium"
          >
            <Sparkles className="w-5 h-5" />
            Toggle Avatar
          </button>
        </div>

        {message && (
          <div className="mb-6 px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-sm text-slate-400">
            {message}
          </div>
        )}

        {/* Lens Grid */}
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-cyan-400" />
          Available Lenses ({lensKeys.length})
        </h2>

        {lensKeys.length === 0 ? (
          <div className="text-center p-8 rounded-lg bg-slate-900/50 border border-slate-800 text-slate-500">
            No lenses configured. Create a <code className="text-cyan-400">lenses.json</code> file in the server root.
            <pre className="mt-3 text-left text-xs bg-slate-950 p-3 rounded">{`{
  "beauty_smooth": "SetLens_BeautySmooth",
  "cyber_helmet": "SetLens_CyberHelmet",
  "vtuber": "SetLens_VTuberAvatar"
}`}</pre>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {lensKeys.map((key) => (
              <button
                key={key}
                onClick={() => handleAction("set_lens", key)}
                disabled={loading === "set_lens"}
                className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-cyan-700 hover:bg-slate-800/60 transition-all text-left group"
              >
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-cyan-400" />
                  <span className="font-medium capitalize">{key.replace(/_/g, " ")}</span>
                  {loading === "set_lens" && <span className="ml-auto text-xs text-cyan-400 animate-pulse">activating...</span>}
                </div>
                <div className="text-xs text-slate-500 mt-2 font-mono">{lenses[key]}</div>
              </button>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-slate-800 text-center text-xs text-slate-600">
          Streamfog MCP v0.1.0 &middot; Fleet Port {10995} &middot; Backend {10994}
        </div>
      </div>
    </div>
  );
}
