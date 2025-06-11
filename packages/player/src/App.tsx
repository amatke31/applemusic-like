import {
	isLyricPageOpenedAtom,
	onClickAudioQualityTagAtom,
} from "@applemusic-like-lyrics/react-full";
import { Box, Theme } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { platform, version } from "@tauri-apps/plugin-os";
import classNames from "classnames";
import { useAtomValue, useStore } from "jotai";
import {
	StrictMode,
	Suspense,
	lazy,
	useEffect,
	useLayoutEffect,
	useState,
} from "react";
import { useTranslation } from "react-i18next";
import { RouterProvider } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import semverGt from "semver/functions/gt";
import Stats from "stats.js";
import styles from "./App.module.css";
import DarkThemeDetector from "./components/DarkThemeDetector/index.tsx";
import { ExtensionInjectPoint } from "./components/ExtensionInjectPoint/index.tsx";
import { LocalMusicContext } from "./components/LocalMusicContext/index.tsx";
import { ShotcutContext } from "./components/ShotcutContext/index.tsx";
import { UpdateContext } from "./components/UpdateContext/index.tsx";
import { WSProtocolMusicContext } from "./components/WSProtocolMusicContext/index.tsx";
import "./i18n";
import { router } from "./router.tsx";
import {
	MusicContextMode,
	audioQualityDialogOpenedAtom,
	displayLanguageAtom,
	isDarkThemeAtom,
	musicContextModeAtom,
	showStatJSFrameAtom,
} from "./states/index.ts";

const ExtensionContext = lazy(() => import("./components/ExtensionContext"));
const AMLLWrapper = lazy(() => import("./components/AMLLWrapper"));

function App() {
	const isLyricPageOpened = useAtomValue(isLyricPageOpenedAtom);
	const showStatJSFrame = useAtomValue(showStatJSFrameAtom);
	const musicContextMode = useAtomValue(musicContextModeAtom);
	const displayLanguage = useAtomValue(displayLanguageAtom);
	const isDarkTheme = useAtomValue(isDarkThemeAtom);
	const [hasBackground, setHasBackground] = useState(false);
	const store = useStore();
	const { i18n } = useTranslation();

	useEffect(() => {
		store.set(onClickAudioQualityTagAtom, {
			onEmit() {
				store.set(audioQualityDialogOpenedAtom, true);
			},
		});
	}, [store]);

	useEffect(() => {
		(async () => {
			const win = getCurrentWindow();
			if (platform() === "windows") {
				if (semverGt("10.0.22000", version())) {
					setHasBackground(true);
					await win.clearEffects();
				}
			}
			await new Promise((r) => requestAnimationFrame(r));

			await win.show();
		})();
	}, []);

	useEffect(() => {
		(async () => {
			const win = getCurrentWindow();
			if (isDarkTheme) {
				await win.setTheme("dark");
			} else {
				await win.setTheme("light");
			}
		})();
	}, [isDarkTheme]);

	useLayoutEffect(() => {
		console.log("displayLanguage", displayLanguage, i18n);
		i18n.changeLanguage(displayLanguage);
	}, [i18n, displayLanguage]);

	useEffect(() => {
		if (showStatJSFrame) {
			const stat = new Stats();
			document.body.appendChild(stat.dom);
			stat.dom.style.position = "fixed";
			stat.dom.style.left = "1em";
			stat.dom.style.top = "3em";
			let canceled = false;
			const update = () => {
				if (canceled) return;
				stat.end();
				stat.begin();
				requestAnimationFrame(update);
			};
			requestAnimationFrame(update);
			return () => {
				canceled = true;
				document.body.removeChild(stat.dom);
			};
		}
	}, [showStatJSFrame]);

	return (
		<>
			{/* 上下文组件均不建议被 StrictMode 包含，以免重复加载扩展程序发生问题  */}
			{musicContextMode === MusicContextMode.Local && <LocalMusicContext />}
			{musicContextMode === MusicContextMode.WSProtocol && (
				<WSProtocolMusicContext />
			)}
			<UpdateContext />
			<ShotcutContext />
			<DarkThemeDetector />
			<Suspense>
				<ExtensionContext />
			</Suspense>
			<ExtensionInjectPoint injectPointName="context" hideErrorCallout />
			<StrictMode>
				<Theme
					appearance={isDarkTheme ? "dark" : "light"}
					accentColor="red"
					panelBackground="solid"
					hasBackground={hasBackground}
					className={styles.radixTheme}
				>
					<Box
						className={classNames(
							styles.body,
							isLyricPageOpened && styles.amllOpened,
						)}
					>
						{/* <AppContainer playbar={<NowPlayingBar />}> */}
						<RouterProvider router={router} />
						{/* </AppContainer> */}
						{/* <Box className={styles.container}>
							<RouterProvider router={router} />
						</Box> */}
					</Box>
					<Suspense>
						<AMLLWrapper />
					</Suspense>
					<ToastContainer
						theme="dark"
						position="bottom-right"
						style={{
							marginBottom: "150px",
						}}
					/>
				</Theme>
			</StrictMode>
		</>
	);
}

export default App;
