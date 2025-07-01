import classNames from "classnames";
import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import {
	type FC,
	type PropsWithChildren,
	type ReactNode,
	useMemo,
	useState,
} from "react";
import { Outlet } from "react-router-dom";
import { AMPHeader } from "../AMPHeader";
import styles from "./index.module.css";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../dexie";
import {
	SearchIcon,
	HomeIcon,
	ClockIcon,
	MicroPhoneIcon,
	SquareStackIcon,
	MusicNoteIcon,
	SquareGrid3x3Icon,
	StarSquareIcon,
	MusicNoteListIcon,
} from "../AMPIcon";
import { t } from "i18next";

const sidebarWidthAtom = atomWithStorage("sidebarWidth", 256);

export const AppContainer: FC<
	PropsWithChildren<{
		sidebar?: ReactNode;
		playbar?: ReactNode;
	}>
> = ({ sidebar, playbar, children }) => {
	const playlists = useLiveQuery(() => db.playlists.toArray());
	const [sidebarWidth, setSidebarWidth] = useAtom(sidebarWidthAtom);
	const [dragging, setDragging] = useState(false);
	const onSidebarDraggerMouseDown = () => {
		setDragging(true);
		const onMouseMove = (evt: MouseEvent) => {
			setSidebarWidth(
				Math.max(192, Math.min(512, window.innerWidth / 2, evt.clientX)),
			);
		};
		const onMouseUp = () => {
			window.removeEventListener("mousemove", onMouseMove);
			window.removeEventListener("mouseup", onMouseUp);
			setDragging(false);
		};
		window.addEventListener("mousemove", onMouseMove);
		window.addEventListener("mouseup", onMouseUp);
	};

	const NAV_LISTS_BASE: NavList[] = [
		{
			label: "",
			items: [
				{ label: t("header.search"), icon: <SearchIcon />, to: "/search" },
				{ label: t("header.home"), icon: <HomeIcon />, to: "/" },
			],
		},
		{
			label: t("header.library.label"),
			items: [
				{ label: t("header.library.recentlyAdded"), icon: <ClockIcon />, to: "/recently-added" },
				{ label: t("header.library.artists"), icon: <MicroPhoneIcon />, to: "/artists" },
				{ label: t("header.library.albums"), icon: <SquareStackIcon />, to: "/albums" },
				{ label: t("header.library.songs"), icon: <MusicNoteIcon />, to: "/songs" },
			],
		},
		{
			label: t("header.playlists.label"),
			items: [
				{
					label: t("header.playlists.allPlaylists"),
					icon: <SquareGrid3x3Icon />,
					to: "/all-playlists",
				},
				{ label: t("header.playlists.favouriteSongs"), icon: <StarSquareIcon />, to: "/like" },
			],
		},
	];

	const navLists = useMemo(() => {
		const lists = NAV_LISTS_BASE.map((list) => ({
			...list,
			items: [...list.items],
		}));
		if (playlists?.length) {
			const playlistNav = lists.find((l) => l.label === "播放列表");
			if (playlistNav) {
				playlistNav.items.push(
					...playlists.map((pl) => ({
						label: pl.name,
						icon: <MusicNoteListIcon />,
						to: `/playlist/${pl.id}`,
					})),
				);
			}
		}
		return lists;
	}, [playlists]);

	return (
		<div className="app-container svelte-t3vj1e is-library-page is-not-focused">
			<AMPHeader navLists={navLists} />
			<div className={styles.appContainer}>
				<div className={styles.sidebar} style={{ width: `${sidebarWidth}px` }}>
					{sidebar}
				</div>
				<div
					className={classNames(
						styles.sidebarDivider,
						dragging && styles.dragging,
					)}
					style={{
						cursor:
							sidebarWidth === 192
								? "e-resize"
								: sidebarWidth === 512
									? "w-resize"
									: "ew-resize",
					}}
					onMouseDown={onSidebarDraggerMouseDown}
				/>
				<div className={styles.main}>
					{children}
					<Outlet />
				</div>
				<div className={styles.playbar}>{playbar}</div>
			</div>
		</div>
	);
};
