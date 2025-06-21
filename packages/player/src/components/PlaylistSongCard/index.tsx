import { toDuration } from "@applemusic-like-lyrics/react-full";
import { useLiveQuery } from "dexie-react-hooks";
import type { Loadable } from "jotai/vanilla/utils/loadable";
import type React from "react";
import { type CSSProperties, forwardRef, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { type Song, db } from "../../dexie";
import { useSongCover } from "../../utils/use-song-cover";
import AMPContextualMenuButton from "../AMPContextualMenuButton";
import { EllipsisIcon, StarIcon } from "../AMPIcon";

export const PlaylistSongCard = forwardRef<
	HTMLDivElement,
	{
		songId: string;
		songIndex: number;
		onPlayList?: (songIndex: number) => void;
		onDeleteSong?: (songId: string) => void;
		onStar?: (songId: string) => void;
		selectedSongId: string;
		onSelectedSongIdChange: (songId: string) => void;
		style?: CSSProperties;
	}
>(
	({
		songId,
		songIndex,
		onPlayList,
		onDeleteSong,
		onStar,
		onSelectedSongIdChange,
		selectedSongId,
	}) => {
		const song: Loadable<Song> = useLiveQuery(
			() =>
				db.songs.get(songId).then((data) => {
					if (!data) {
						return {
							state: "hasError",
							error: new Error(`未找到歌曲 ID ${songId}`),
						};
					}
					return {
						state: "hasData",
						data: data,
					};
				}),
			[songId],
			{
				state: "loading",
			},
		);
		const songImgUrl = useSongCover(
			song.state === "hasData" ? song.data : undefined,
		);
		const { t } = useTranslation();
		const [imgError, setImgError] = useState(false);

		const isSelected = selectedSongId === songId;

		useEffect(() => {
			setImgError(false);
		}, [songImgUrl]);

		return (
			<div
				className={`songs-list-row drop-reset svelte-t6plbb songs-list-row--artwork songs-list-row--two-lines songs-list-row--playlist songs-list-row--alt${
					isSelected ? " songs-list-row--alt songs-list-row--selected" : ""
				}`}
				tabindex="0"
				data-row="0"
				data-current-mouse-target="false"
				data-testid="track-list-item"
				aria-label={
					song.state === "hasData" &&
					(song.data.songName ||
						song.data.filePath ||
						t("page.playlist.music.unknownSongName", "未知歌曲 ID {id}", {
							id: songId,
						}))
				}
				data-drop-area=""
				onKeyDown={() => {
					onSelectedSongIdChange(songId);
				}}
				onMouseDown={() => {
					onSelectedSongIdChange(songId);
				}}
			>
				<div
					className="songs-list__col songs-list__col--favorite-or-popular svelte-t6plbb"
					data-testid="track-column-favorite-or-popular"
					style={{ display: onStar ? "table-cell" : "none" }}
				>
					<div className="favorite-or-popular svelte-1aus0qc">
						<div className="favorite svelte-1aus0qc">
							<button
								className="favorite-button svelte-j6xj5e favorite-button--non-platter"
								aria-label="个人收藏"
								title="让我们进一步了解你喜欢的音乐类型。"
								type="button"
							>
								<StarIcon />
							</button>
						</div>
					</div>
				</div>
				<div
					className="songs-list__col songs-list__col--song svelte-t6plbb"
					data-testid="track-column-song"
				>
					<div className={"songs-list-row__song-container svelte-t6plbb"}>
						<div className="songs-list-row__song-index svelte-t6plbb">
							<div
								className="artwork-with-badge svelte-1h4psev"
								data-testid="artwork-with-badge"
							>
								<div
									className="artwork-with-badge__artwork svelte-1h4psev"
									data-testid="artwork"
								>
									<div
										data-testid="artwork-component"
										className="artwork-component artwork-component--aspect-ratio artwork-component--orientation-square svelte-10tj07c artwork-component--has-borders artwork-component--downloaded"
										style={
											{
												"--aspect-ratio": 1,
												"--placeholder-bg-color": "transparent",
											} as React.CSSProperties
										}
									>
										<picture className="svelte-10tj07c">
											{!imgError && (
												<img
													alt=""
													className="artwork-component__contents artwork-component__image svelte-10tj07c"
													loading="lazy"
													src={songImgUrl}
													decoding="async"
													width="40"
													height="40"
													style={{ opacity: 1 }}
													onError={() => setImgError(true)}
												/>
											)}
										</picture>
									</div>
								</div>
							</div>
							<div
								className="songs-list-row__play-button-wrapper svelte-t6plbb"
								data-testid="track-play-button"
							>
								<div className="interactive-play-button svelte-a72zjx">
									<button
										aria-label={`播放${
											song.state === "hasData" &&
											(song.data.songName ||
												song.data.filePath ||
												t(
													"page.playlist.music.unknownSongName",
													"未知歌曲 ID {id}",
													{
														id: songId,
													},
												))
										}`}
										className="play-button svelte-1tvdl0z play-button--standard"
										data-testid="play-button"
										type="button"
										onClick={() => {
											if (onPlayList) onPlayList(songIndex);
										}}
									>
										<svg
											width="16"
											height="16"
											viewBox="0 0 16 16"
											xmlns="http://www.w3.org/2000/svg"
											className="icon play-svg"
											data-testid="play-icon"
											aria-hidden="true"
										>
											<path
												fill="var(--nonPlatterIconFill, var(--keyColor, black))"
												d="m4.4 15.14 10.386-6.096c.842-.459.794-1.64 0-2.097L4.401.85c-.87-.53-2-.12-2 .82v12.625c0 .966 1.06 1.4 2 .844z"
											/>
										</svg>
									</button>
								</div>
							</div>
						</div>
						<div className="songs-list-row__song-wrapper svelte-t6plbb">
							<div
								className="songs-list-row__song-name-wrapper svelte-t6plbb"
								data-testid="song-name-wrapper"
							>
								<Link to={`/song/${songId}`}>
									<div
										data-testid="click-action"
										className="click-action svelte-c0t0j2"
									>
										<div
											className="songs-list-row__song-name svelte-t6plbb"
											aria-label={
												song.state === "hasData" &&
												(song.data.songName ||
													song.data.filePath ||
													t(
														"page.playlist.music.unknownSongName",
														"未知歌曲 ID {id}",
														{
															id: songId,
														},
													))
											}
											tabindex="-1"
											dir="auto"
											data-testid="track-title"
										>
											{song.state === "hasData" &&
												(song.data.songName ||
													song.data.filePath ||
													t(
														"page.playlist.music.unknownSongName",
														"未知歌曲 ID {id}",
														{
															id: songId,
														},
													))}
										</div>
									</div>
								</Link>
								<div
									className="songs-list-row__by-line svelte-t6plbb songs-list-row__by-line__mobile"
									data-testid="track-title-by-line"
									dir="auto"
								>
									<span className="svelte-t6plbb">
										<div
											data-testid="click-action"
											className="click-action svelte-c0t0j2"
										>
											{song.state === "hasData" &&
												(song.data.songArtists || "")}
										</div>
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>
				<div
					className="songs-list__col songs-list__col--secondary svelte-t6plbb"
					data-testid="track-column-secondary"
				>
					<div
						className="songs-list__song-link-wrapper svelte-t6plbb"
						dir="auto"
					>
						<span>
							<div
								data-testid="click-action"
								className="click-action svelte-c0t0j2"
							>
								{song.state === "hasData" && (song.data.songArtists || "")}
							</div>
						</span>
					</div>
				</div>
				<div
					className="songs-list__col songs-list__col--tertiary svelte-t6plbb"
					data-testid="track-column-tertiary"
				>
					<div
						className="songs-list__song-link-wrapper svelte-t6plbb"
						dir="auto"
					>
						<span>
							<div
								data-testid="click-action"
								className="click-action svelte-c0t0j2"
							>
								{song.state === "hasData" && (song.data.songAlbum || "")}
							</div>
						</span>
					</div>
				</div>
				<div
					className="songs-list__col songs-list__col--time svelte-t6plbb"
					data-testid="track-column-controls"
				>
					<div className="songs-list-row__controls svelte-t6plbb">
						<div className="songs-list-row__add-to-library svelte-t6plbb" />
						<time
							className="songs-list-row__length svelte-t6plbb"
							data-testid="track-duration"
						>
							{song.state === "hasData" &&
								(song.data.duration ? toDuration(song.data.duration) : "")}
						</time>
						<div className="songs-list-row__context-menu svelte-t6plbb">
							<AMPContextualMenuButton>
								<span slot="trigger">
									<span
										aria-label="更多"
										className="more-button svelte-1sn4kz more-button--non-platter"
										data-testid="more-button"
										slot="trigger-content"
									>
										<EllipsisIcon />
									</span>
								</span>
								<span slot="content">
									{[
										{
											label: "移除",
											onClick: () => {
												if (onDeleteSong) onDeleteSong(songId);
											},
										},
									]}
								</span>
							</AMPContextualMenuButton>
						</div>
					</div>
				</div>
			</div>
			// <Skeleton
			// 	style={style}
			// 	key={`song-card-${songId}`}
			// 	loading={song.state === "loading"}
			// 	ref={ref}
			// 	onDoubleClick={() => onPlayList(songIndex)}
			// >
			// 	<Box py="1" style={style}>
			// 		<Card>
			// 			<Flex p="1" align="center" gap="4">
			// 				<Avatar size="5" fallback={<div />} src={songImgUrl} />
			// 				<Flex direction="column" justify="center" flexGrow="1" minWidth="0">
			// 					<Text wrap="nowrap" truncate>
			// 						{song.state === "hasData" &&
			// 							(song.data.songName ||
			// 								song.data.filePath ||
			// 								t(
			// 									"page.playlist.music.unknownSongName",
			// 									"未知歌曲 ID {id}",
			// 									{
			// 										id: songId,
			// 									},
			// 								))}
			// 					</Text>
			// 					<Text wrap="nowrap" truncate color="gray">
			// 						{song.state === "hasData" && (song.data.songArtists || "")}
			// 					</Text>
			// 				</Flex>
			// 				<Text wrap="nowrap">
			// 					{song.state === "hasData" &&
			// 						(song.data.duration ? toDuration(song.data.duration) : "")}
			// 				</Text>
			// 				<IconButton variant="ghost" onClick={() => onPlayList(songIndex)}>
			// 					<PlayIcon />
			// 				</IconButton>
			// 				<DropdownMenu.Root>
			// 					<DropdownMenu.Trigger>
			// 						<IconButton
			// 							variant="ghost"
			// 							onClick={() => router.navigate(`/song/${songId}`)}
			// 						>
			// 							<HamburgerMenuIcon />
			// 						</IconButton>
			// 					</DropdownMenu.Trigger>
			// 					<DropdownMenu.Content>
			// 						<DropdownMenu.Item onClick={() => onPlayList(songIndex)}>
			// 							<Trans i18nKey="page.playlist.music.dropdown.playMusic">
			// 								播放音乐
			// 							</Trans>
			// 						</DropdownMenu.Item>
			// 						<DropdownMenu.Item onClick={() => navigate(`/song/${songId}`)}>
			// 							<Trans i18nKey="page.playlist.music.dropdown.editMusicOverrideData">
			// 								编辑歌曲覆盖信息
			// 							</Trans>
			// 						</DropdownMenu.Item>
			// 						<DropdownMenu.Separator />
			// 						<DropdownMenu.Item
			// 							color="red"
			// 							onClick={() => onDeleteSong(songId)}
			// 						>
			// 							<Trans i18nKey="page.playlist.music.dropdown.removeFromPlaylist">
			// 								从歌单中删除
			// 							</Trans>
			// 						</DropdownMenu.Item>
			// 					</DropdownMenu.Content>
			// 				</DropdownMenu.Root>
			// 			</Flex>
			// 		</Card>
			// 	</Box>
			// </Skeleton>
		);
	},
);
