import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Chat from "./pages/Chat";
import Dashboard from "./pages/Dashboard";
import Help from "./pages/Help";
import Settings from "./pages/Settings";
import Tools from "./pages/Tools";

export default function App() {
	return (
		<Routes>
			<Route element={<Layout />}>
				<Route path="/" element={<Dashboard />} />
				<Route path="/tools" element={<Tools />} />
				<Route path="/chat" element={<Chat />} />
				<Route path="/settings" element={<Settings />} />
				<Route path="/help" element={<Help />} />
				<Route path="*" element={<Dashboard />} />
			</Route>
		</Routes>
	);
}
