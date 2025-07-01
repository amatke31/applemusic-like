import {
	Route,
	createBrowserRouter,
	createRoutesFromElements,
} from "react-router-dom";
import { AppContainer } from "./components/AppContainer/index.tsx";
import { NowPlayingBar } from "./components/NowPlayingBar/index.tsx";
import ErrorPage from "./pages/error/index.tsx";
import SettingsPage from "./pages/settings/index.tsx"

export const router = createBrowserRouter(
	createRoutesFromElements(
		<>
			<Route
				path="/settings"
				element={<SettingsPage />}
				errorElement={<ErrorPage />}
			/>
			<Route
				element={<AppContainer playbar={<NowPlayingBar />} />}
				errorElement={<ErrorPage />}
			>
				<Route
					path="/"
					lazy={() => import("./pages/main/index.tsx")}
					errorElement={<ErrorPage />}
				/>
				<Route
					path="/all-playlists"
					lazy={() => import("./pages/all-playlists/index.tsx")}
					errorElement={<ErrorPage />}
				/>
				<Route
					path="/albums"
					lazy={() => import("./pages/albums/index.tsx")}
					errorElement={<ErrorPage />}
				/>
				<Route
					path="/songs"
					lazy={() => import("./pages/songs/index.tsx")}
					errorElement={<ErrorPage />}
				/>
				<Route
					path="/search"
					lazy={() => import("./pages/search/index.tsx")}
					errorElement={<ErrorPage />}
				/>
				<Route
					path="/playlist/:id"
					lazy={() => import("./pages/playlist")}
					errorElement={<ErrorPage />}
				/>
				<Route
					path="/album/:id"
					lazy={() => import("./pages/album")}
					errorElement={<ErrorPage />}
				/>
				<Route
					path="/song/:id"
					lazy={() => import("./pages/song/index.tsx")}
					errorElement={<ErrorPage />}
				/>
				<Route
					path="/amll-dev/mg-edit"
					lazy={() => import("./pages/amll-dev/mg-edit.tsx")}
					errorElement={<ErrorPage />}
				/>
				<Route
					path="/amll-dev"
					lazy={() => import("./pages/amll-dev/index.tsx")}
					errorElement={<ErrorPage />}
				/>
				<Route path="/ws" errorElement={<ErrorPage />}>
					<Route
						path="recv"
						lazy={() => import("./pages/ws/recv.tsx")}
						errorElement={<ErrorPage />}
					/>
					<Route
						path="send"
						lazy={() => import("./pages/ws/send.tsx")}
						errorElement={<ErrorPage />}
					/>
				</Route>
			</Route>
		</>,
	),
);
