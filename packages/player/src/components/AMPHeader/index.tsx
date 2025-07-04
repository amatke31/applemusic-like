import {
	type PropsWithChildren,
	type ReactNode,
	forwardRef,
	useEffect,
	useState,
} from "react";
import { EllipsisIcon } from "../AMPIcon/index";
import { AMPHeaderList } from "./list";
import { AMPHeaderListItem } from "./list-item";
import { ExtensionInjectPoint } from "../ExtensionInjectPoint";
import {
	MusicContextMode,
	musicContextModeAtom,
} from "../../states/appAtoms";
import { useTranslation } from "react-i18next";
import { platform } from "@tauri-apps/plugin-os";
import { useAtom } from "jotai";
import { useNavigate } from "react-router-dom";
import AMPContextualMenuButton from "../AMPContextualMenuButton";

export const AMPHeader = forwardRef<
	HTMLDivElement,
	PropsWithChildren<{ navLists: NavList[] }>
>(({ navLists }) => {
	const notLogin = true;

	const [musicContextMode, setMusicContextMode] = useAtom(musicContextModeAtom);
	const [currentPlatform, setCurrentPlatform] = useState<string>("");
	const { t } = useTranslation();
	const navigate = useNavigate();

	useEffect(() => {
		setCurrentPlatform(platform());
	}, []);

	const isSystemListenerMode =
		musicContextMode === MusicContextMode.SystemListener;

	return (
		<div className="header svelte-rjjbqs" data-testid="header">
			<nav data-testid="navigation" className="navigation svelte-13li0vp">
				<div className="navigation__header svelte-13li0vp">
					<div
						data-testid="logo"
						className="logo svelte-1o7dz8w"
						style={{
							placeItems: "center",
						}}
					>
						<div
							className="svelte-1o7dz8w"
							style={{
								fontSize: "2rem",
								fontWeight: "500",
							}}
						>
							AMLP Player
						</div>
						<AMPContextualMenuButton
							menuItems={[
								currentPlatform === "windows" && {
									label: isSystemListenerMode
										? t("page.main.menu.exitSystemListenerMode")
										: t("page.main.menu.enterSystemListenerMode"),
									onClick: () => {
										setMusicContextMode(
											isSystemListenerMode
												? MusicContextMode.Local // 如果已是监听模式，则切换回本地模式
												: MusicContextMode.SystemListener, // 否则，切换到监听模式
										);
									},
								},
								{
									label: t("page.main.menu.enterWSProtocolMode"),
									submenu: [
										{
											label: t("page.main.menu.asWSProtocolReceiver"),
											onClick: () => {
												navigate("/ws/recv");
											},
										},
										{ label: t("page.main.menu.asWSProtocolSenderWIP") },
									],
								},
								{
									label: t("page.main.menu.settings"),
									onClick: () => {
										navigate("/settings");
									},
								},
							]}
						>
							<div
								className="cloud-buttons svelte-u0auos"
								data-testid="cloud-buttons"
							>
								<div className="amp-contextual-menu-button svelte-1sn4kz">
									<button className="contextual-menu__trigger" type="button">
										<span
											className="more-button svelte-1sn4kz more-button--platter"
											data-testid="more-button"
											slot="trigger-content"
										>
											<EllipsisIcon />
										</span>
									</button>
								</div>
							</div>
						</AMPContextualMenuButton>
						<ExtensionInjectPoint injectPointName="page.main.sidebar.after" />
					</div>
				</div>
				<div
					data-testid="navigation-content"
					className="navigation__content svelte-13li0vp"
					id="navigation"
					aria-hidden="false"
				>
					<div className="navigation__scrollable-container svelte-13li0vp">
						{navLists.map((navList, idx) => (
							<AMPHeaderList label={navList.label} key={navList.label || idx}>
								{navList.items.map((item) => (
									<AMPHeaderListItem
										key={item.to}
										label={item.label}
										icon={item.icon}
										to={item.to}
									/>
								))}
							</AMPHeaderList>
						))}
					</div>
					{!notLogin ? (
						<div className="navigation__native-cta">
							<div slot="native-cta">
								<div
									data-testid="native-cta"
									className="native-cta svelte-ba5e5y"
								>
									<button
										className="native-cta__button svelte-ba5e5y"
										data-testid="native-cta-button"
										type="button"
									>
										<span className="native-cta__app-icon svelte-ba5e5y">
											<svg
												width="24"
												height="24"
												viewBox="0 0 24 24"
												xmlns="http://www.w3.org/2000/svg"
												slot="app-icon"
												aria-hidden="true"
											>
												<path d="M12 0c6.627 0 12 5.373 12 12s-5.373 12-12 12S0 18.627 0 12 5.373 0 12 0zm0 1C5.925 1 1 5.925 1 12s4.925 11 11 11 11-4.925 11-11S18.075 1 12 1zm5 4.91v9.69c0 1.822-1.45 2.212-2.36 2.212-.904 0-1.649-.696-1.649-1.583 0-1.068.803-1.515 1.822-1.722l.92-.207c.372-.075.488-.348.488-.638l.009-4.639c0-.323-.15-.439-.514-.356l-5.31 1.077c-.306.05-.397.14-.397.505v6.743c0 1.83-1.474 2.253-2.386 2.253-.919 0-1.623-.705-1.623-1.583 0-1.085.812-1.532 1.78-1.764l.987-.199c.306-.074.43-.314.43-.588V7.21c0-.406.29-.58.622-.646l6.262-1.267c.571-.116.919-.05.919.613z"></path>
											</svg>
										</span>{" "}
										<span className="native-cta__label svelte-ba5e5y">
											在“音乐”中打开
										</span>{" "}
										<span className="native-cta__arrow svelte-ba5e5y">
											<svg
												height="16"
												width="16"
												viewBox="0 0 16 16"
												className="native-cta-action"
												aria-hidden="true"
											>
												<path d="M1.559 16 13.795 3.764v8.962H16V0H3.274v2.205h8.962L0 14.441 1.559 16z"></path>
											</svg>
										</span>
									</button>
								</div>{" "}
								<button
									className="beta-button svelte-s7qkpt"
									data-testid="try-beta"
									type="button"
								>
									<span className="beta-button__text svelte-s7qkpt">
										体验 Beta 版
									</span>{" "}
									<svg
										height="16"
										width="16"
										viewBox="0 0 16 16"
										className="beta-button-action"
										aria-hidden="true"
									>
										<path d="M1.559 16 13.795 3.764v8.962H16V0H3.274v2.205h8.962L0 14.441 1.559 16z"></path>
									</svg>
								</button>
							</div>
						</div>
					) : (
						<></>
					)}
				</div>
			</nav>
		</div>
	);
});
