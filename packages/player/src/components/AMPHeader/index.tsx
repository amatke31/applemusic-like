import { useLiveQuery } from "dexie-react-hooks";
import { type PropsWithChildren, forwardRef } from "react";
import { db } from "../../dexie";
import {
	ClockIcon,
	GearIcon,
	HomeIcon,
	MicroPhoneIcon,
	MusicNoteIcon,
	MusicNoteListIcon,
	SearchIcon,
	SquareGrid3x3Icon,
	SquareStackIcon,
	StarSquareIcon,
} from "../AMPIcon/index";
import { AMPHeaderList } from "./list";
import { AMPHeaderListItem } from "./list-item";

export const AMPHeader = forwardRef<
	HTMLDivElement,
	PropsWithChildren<{ onPush: () => void }>
>(() => {
	const playlists = useLiveQuery(() => db.playlists.toArray());

	return (
		<div className="header svelte-rjjbqs" data-testid="header">
			<nav data-testid="navigation" className="navigation svelte-13li0vp">
				<div className="navigation__header svelte-13li0vp">
					<div data-testid="logo" className="logo svelte-1o7dz8w" />
				</div>
				<div
					data-testid="navigation-content"
					className="navigation__content svelte-13li0vp"
					id="navigation"
					aria-hidden="false"
				>
					<div className="navigation__scrollable-container svelte-13li0vp">
						<AMPHeaderList label="">
							<AMPHeaderListItem label="首页" icon={<HomeIcon />} to="/" />
							<AMPHeaderListItem
								label="搜索"
								icon={<SearchIcon />}
								to="/search"
							/>
							<AMPHeaderListItem
								label="设置"
								icon={<GearIcon />}
								to="/settings"
							/>
						</AMPHeaderList>
						<AMPHeaderList label="资料库">
							<AMPHeaderListItem
								label="最近添加"
								icon={<ClockIcon />}
								to="/recently-added"
							/>
							<AMPHeaderListItem
								label="艺人"
								icon={<MicroPhoneIcon />}
								to="/artists"
							/>
							<AMPHeaderListItem
								label="专辑"
								icon={<SquareStackIcon />}
								to="/albums"
							/>
							<AMPHeaderListItem
								label="歌曲"
								icon={<MusicNoteIcon />}
								to="/songs"
							/>
						</AMPHeaderList>
						<AMPHeaderList label="播放列表">
							<AMPHeaderListItem
								label="所有播放列表"
								icon={<SquareGrid3x3Icon />}
								to="/all-playlists"
							/>
							<AMPHeaderListItem
								label="喜爱的歌曲"
								icon={<StarSquareIcon />}
								to="/like"
							/>
							{playlists ? (
								playlists.map((playlist) => (
									<AMPHeaderListItem
										key={playlist.id}
										label={playlist.name}
										icon={<MusicNoteListIcon />}
										to={`/playlist/${playlist.id}`}
									/>
								))
							) : (
								<div />
							)}
						</AMPHeaderList>
					</div>
				</div>
			</nav>
		</div>
	);
});
