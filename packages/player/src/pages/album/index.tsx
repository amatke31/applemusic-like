import { path } from "@tauri-apps/api";
import { open } from "@tauri-apps/plugin-dialog";
import { stat } from "@tauri-apps/plugin-fs";
import { platform } from "@tauri-apps/plugin-os";
import { useLiveQuery } from "dexie-react-hooks";
import md5 from "md5";
import { type FC, useCallback, useEffect, useMemo, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import AMPContextualMenuButton from "../../components/AMPContextualMenuButton/index.tsx";
import { showAMPDialog } from "../../components/AMPDialog/index.tsx";
import { EllipsisIcon } from "../../components/AMPIcon/EllipsisIcon.tsx";
import { PageContainer } from "../../components/PageContainer/index.tsx";
import { PlaylistCover } from "../../components/PlaylistCover/index.tsx";
import { PlaylistSongCard } from "../../components/PlaylistSongCard/index.tsx";
import { Playlist, type Song, db } from "../../dexie.ts";
import { emitAudioThread, readLocalMusicMetadata } from "../../utils/player.ts";
import SongsList from "../../components/SongsList/index.tsx";

export type Loadable<Value> =
	| {
			state: "loading";
	  }
	| {
			state: "hasError";
			error: unknown;
	  }
	| {
			state: "hasData";
			data: Awaited<Value>;
	  };

export const Component: FC = () => {
	const param = useParams();
	const songs = useLiveQuery(() => db.songs.toArray());
	const { t } = useTranslation();

	const [selectedSongId, setSelectedSongId] = useState("");

	const playlist = useMemo(() => {
		if (param.id === undefined) return;
		if (songs === undefined) return;
		const albums: Playlist[] = [];
		const albumNames: { [x: string]: number } = {};
		for (const song of songs) {
			if (!Object.hasOwn(albumNames, song.songAlbum)) {
				albumNames[song.songAlbum] = albums.length;
				albums.push({
					name: song.songAlbum,
					id: albums.length + 1,
					songIds: [],
					createTime: 1,
					updateTime: 1,
					playTime: 0,
				});
			}
			albums[albumNames[song.songAlbum]].songIds.push(song.id);
		}
		return albums[Number(param.id)];
	}, [songs, param.id]);

	useEffect(() => {
		setSelectedSongId("");
	}, []);

	const onPlayList = useCallback(
		async (songIndex = 0, shuffle = false) => {
			if (playlist === undefined) return;
			const collected = await db.songs
				.toCollection()
				.filter((v) => playlist.songIds.includes(v.id))
				.toArray();
			if (shuffle) {
				for (let i = 0; i < collected.length; i++) {
					const j = Math.floor(Math.random() * (i + 1));
					[collected[i], collected[j]] = [collected[j], collected[i]];
				}
			} else {
				collected.sort((a, b) => {
					return (
						playlist.songIds.indexOf(a.id) - playlist.songIds.indexOf(b.id)
					);
				});
			}
			await emitAudioThread("setPlaylist", {
				songs: collected.map((v, i) => ({
					type: "local",
					filePath: v.filePath,
					origOrder: i,
				})),
			});
			await emitAudioThread("jumpToSong", {
				songIndex,
			});
		},
		[playlist],
	);

	const onDeleteSong = useCallback(
		async (songId: string) => {
			if (playlist === undefined) return;
			await db.playlists.update(Number(param.id), (obj) => {
				obj.songIds = obj.songIds.filter((v) => v !== songId);
			});
		},
		[playlist, param.id],
	);

	const onPlaylistDefault = useCallback(onPlayList.bind(null, 0), [onPlayList]);
	const onPlaylistShuffle = useMemo(
		() => onPlayList.bind(null, 0, true),
		[onPlayList],
	);

	return (
		<div className="scrollable-page svelte-mt0bfj">
			<PageContainer>
				<div
					className="content-container svelte-9l1caf"
					onClick={() => setSelectedSongId("")}
				>
					<div className="section svelte-qc4ih7">
						<div className="section-content svelte-qc4ih7">
							<div className="container-detail-header svelte-1uuona0 container-detail-header--no-description">
								<div className="headings svelte-1uuona0">
									<h1
										className="headings__title svelte-1uuona0"
										data-testid="non-editable-product-title"
										style={{ position: "relative" }}
									>
										<span dir="auto">{playlist?.name || ""}</span>
										<span className="headings__badges svelte-1uuona0" />
									</h1>
									<div className="headings__tertiary-titles" />
									<div className="headings__metadata-bottom svelte-1uuona0" />
								</div>
								<div className="primary-actions svelte-1uuona0">
									<div
										className="primary-actions__button primary-actions__button--play svelte-1uuona0"
										onClick={() => onPlaylistDefault()}
									>
										<div
											data-testid="button-action"
											className="button svelte-rolo4i primary"
										>
											<button
												data-testid="click-action"
												className="click-action svelte-c0t0j2"
												type="button"
											>
												<span
													className="icon svelte-rolo4i"
													data-testid="play-icon"
												>
													<svg height="16" viewBox="0 0 16 16" width="16">
														<title>Play</title>
														<path d="m4.4 15.14 10.386-6.096c.842-.459.794-1.64 0-2.097L4.401.85c-.87-.53-2-.12-2 .82v12.625c0 .966 1.06 1.4 2 .844z" />
													</svg>
												</span>
												<Trans i18nKey="common.play">播放</Trans>
											</button>
										</div>
									</div>
									<div
										className="primary-actions__button primary-actions__button--shuffle svelte-1uuona0"
										onClick={() => onPlaylistShuffle()}
									>
										<div
											data-testid="button-action"
											className="button svelte-rolo4i primary"
										>
											<button
												data-testid="click-action"
												className="click-action svelte-c0t0j2"
												type="button"
											>
												<span
													className="icon svelte-rolo4i"
													data-testid="shuffle-icon"
												>
													<svg
														className="icon shuffle"
														viewBox="0 0 18 14"
														xmlns="http://www.w3.org/2000/svg"
													>
														<title>Shuffle</title>
														<path d="M.012 10.903c0 .43.333.732.79.732H2.54c1.272 0 2.019-.37 2.89-1.397l1.79-2.13 1.767 2.093c.894 1.065 1.737 1.434 3.009 1.434h1.478v1.782c0 .355.214.562.57.562.162 0 .31-.06.435-.155l2.898-2.418c.281-.23.281-.584 0-.828L14.48 8.161a.671.671 0 0 0-.436-.156c-.355 0-.569.2-.569.562v1.597H12.04c-.872 0-1.442-.288-2.07-1.042L8.166 6.985l1.811-2.144c.643-.761 1.161-1.035 2.019-1.035h1.478v1.627c0 .355.214.562.57.562.162 0 .31-.06.435-.156l2.898-2.417c.281-.23.281-.584 0-.828L14.48.177a.67.67 0 0 0-.436-.156c-.355 0-.569.2-.569.562v1.745h-1.471c-1.316 0-2.122.362-3.06 1.486L7.22 5.862l-1.79-2.13c-.87-1.027-1.67-1.397-2.933-1.397H.803c-.458 0-.791.303-.791.732s.333.74.79.74h1.635c.828 0 1.404.288 2.04 1.042l1.797 2.136-1.797 2.137c-.636.754-1.168 1.042-1.988 1.042H.803c-.458 0-.791.31-.791.74Z" />
													</svg>
												</span>
												<Trans i18nKey="common.shuffle">随机播放</Trans>
											</button>
										</div>
									</div>
								</div>
								<div slot="artwork" draggable="true">
									<PlaylistCover playlist={playlist} isAlbum />
								</div>
								<div className="secondary-actions svelte-1uuona0">
									<div
										className="secondary-actions svelte-vj7zg9"
										slot="secondary-actions"
									>
										<div
											className="cloud-buttons svelte-u0auos"
											data-testid="cloud-buttons"
										>
											<AMPContextualMenuButton
												menuItems={[
													{
														label: t("common.edit"),
														onClick: () => {},
													},
													{
														label: t("page.playlist.addLocalMusic.label"),
														onClick: () => {},
													},
													{
														label: t("common.deleteFromLibrary"),
														onClick: () => {},
													},
												]}
											>
												<span
													style={{
														display: "inline-block",
														position: "relative",
													}}
												>
													<div className="amp-contextual-menu-button svelte-1sn4kz">
														<button
															className="contextual-menu__trigger"
															type="button"
														>
															<span
																className="more-button svelte-1sn4kz more-button--platter"
																data-testid="more-button"
																slot="trigger-content"
															>
																<EllipsisIcon />
															</span>
														</button>
													</div>
												</span>
											</AMPContextualMenuButton>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
					<SongsList>
						{playlist?.songIds?.map((songId, index) => (
							<PlaylistSongCard
								key={`playlist-song-card-${songId}`}
								songId={songId}
								songIndex={index}
								onPlayList={onPlayList}
								onDeleteSong={onDeleteSong}
								onStar={() => {}}
								selectedSongId={selectedSongId}
								onSelectedSongIdChange={(songId) => {
									setSelectedSongId(songId);
								}}
							/>
						))}
					</SongsList>
				</div>
			</PageContainer>
		</div>
	);
};

Component.displayName = "PlaylistPage";

export default Component;
