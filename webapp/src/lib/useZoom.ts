import { useCallback, useEffect, useState } from "react";

const ZOOM_LEVELS = [0.5, 0.6, 0.7, 0.8, 1.0, 1.25, 1.5, 2.0, 3.0];

function useZoom() {
	const [zoomIndex, setZoomIndex] = useState(() => {
		try {
			const saved = localStorage.getItem("tauri-zoom");
			return saved
				? Math.max(0, ZOOM_LEVELS.indexOf(Number.parseFloat(saved)))
				: 4;
		} catch {
			return 4;
		}
	});

	const applyZoom = useCallback(async (level: number) => {
		localStorage.setItem("tauri-zoom", String(level));
		try {
			const { getCurrentWebviewWindow } = await import(
				"@tauri-apps/api/webviewWindow"
			);
			await getCurrentWebviewWindow().setZoom(level);
			return;
		} catch {
			// dev browser - fall through to CSS zoom
		}
		document.documentElement.style.zoom = String(level);
	}, []);

	useEffect(() => {
		const handler = (e: WheelEvent) => {
			if (!e.ctrlKey) return;
			e.preventDefault();
			setZoomIndex((prev) => {
				const next =
					e.deltaY < 0
						? Math.min(prev + 1, ZOOM_LEVELS.length - 1)
						: Math.max(prev - 1, 0);
				if (next !== prev) applyZoom(ZOOM_LEVELS[next]);
				return next;
			});
		};
		const resetHandler = (e: KeyboardEvent) => {
			if (e.ctrlKey && e.key === "0") {
				e.preventDefault();
				setZoomIndex(4);
				applyZoom(ZOOM_LEVELS[4]);
			}
		};
		window.addEventListener("wheel", handler, { passive: false });
		window.addEventListener("keydown", resetHandler);
		const saved = localStorage.getItem("tauri-zoom");
		if (saved) applyZoom(Number.parseFloat(saved));
		return () => {
			window.removeEventListener("wheel", handler);
			window.removeEventListener("keydown", resetHandler);
		};
	}, [applyZoom]);

	return { zoom: ZOOM_LEVELS[zoomIndex] };
}

export default useZoom;
