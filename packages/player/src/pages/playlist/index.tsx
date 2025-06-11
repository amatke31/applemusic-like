import { ArrowLeftIcon } from "@radix-ui/react-icons";
import { Button, Flex } from "@radix-ui/themes";
import { path } from "@tauri-apps/api";
import { open } from "@tauri-apps/plugin-dialog";
import { stat } from "@tauri-apps/plugin-fs";
import { platform } from "@tauri-apps/plugin-os";
import { useLiveQuery } from "dexie-react-hooks";
import md5 from "md5";
import { type FC, useCallback, useMemo, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import AMPContextualMenuButton from "../../components/AMPContextualMenuButton/index.tsx";
import { showAMPDialog } from "../../components/AMPDialog/index.tsx";
import { PageContainer } from "../../components/PageContainer/index.tsx";
import { PlaylistCover } from "../../components/PlaylistCover/index.tsx";
import { PlaylistSongCard } from "../../components/PlaylistSongCard/index.tsx";
import { type Song, db } from "../../dexie.ts";
import { emitAudioThread, readLocalMusicMetadata } from "../../utils/player.ts";

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
	const playlist = useLiveQuery(() => db.playlists.get(Number(param.id)));
	const { t } = useTranslation();

	const [selectedSongId, setSelectedSongId] = useState("");

	const onAddLocalMusics = useCallback(async () => {
		let filters = [
			{
				name: t("page.playlist.addLocalMusic.filterName", "音频文件"),
				extensions: ["mp3", "flac", "wav", "m4a", "aac", "ogg"],
			},
			{
				name: t("page.playlist.addLocalMusic.allFiles", "所有文件"),
				extensions: ["*"],
			},
		];
		if (platform() === "android") {
			filters = [
				{
					name: t("page.playlist.addLocalMusic.filterName", "音频文件"),
					extensions: ["audio/*"],
				},
				{
					name: t("page.playlist.addLocalMusic.allFiles", "所有文件"),
					extensions: ["*/*"],
				},
			];
		}
		if (platform() === "ios") {
			filters.length = 0;
		}
		const results = await open({
			multiple: true,
			title: "选择本地音乐",
			filters,
		});
		if (!results) return;
		console.log(results);
		const id = toast.loading(
			t(
				"page.playlist.addLocalMusic.toast.parsingMusicMetadata",
				"正在解析音乐元数据以添加歌曲 ({current, plural, other {#}} / {total, plural, other {#}})",
				{
					current: 0,
					total: results.length,
				},
			),
		);
		let current = 0;
		let success = 0;
		let errored = 0;
		const transformed = (
			await Promise.all(
				results.map(async (v) => {
					let normalized = v;
					console.log(v);
					if (platform() !== "android" && platform() !== "ios") {
						normalized = (await path.normalize(v)).replace(/\\/gi, "/");
					}
					try {
						console.log(await stat(v));
						const pathMd5 = md5(normalized);
						const musicInfo = await readLocalMusicMetadata(normalized);

						const coverData = new Uint8Array(musicInfo.cover);
						const coverBlob = new Blob([coverData], { type: "image" });

						success += 1;
						return {
							id: pathMd5,
							filePath: normalized,
							songName: musicInfo.name,
							songArtists: musicInfo.artist,
							songAlbum: musicInfo.album,
							lyricFormat: musicInfo.lyricFormat || "none",
							lyric: musicInfo.lyric,
							cover: coverBlob,
							duration: musicInfo.duration,
						} satisfies Song;
					} catch (err) {
						errored += 1;
						console.warn("解析歌曲元数据以添加歌曲失败", normalized, err);
						return null;
					} finally {
						current += 1;
						toast.update(id, {
							render: t(
								"page.playlist.addLocalMusic.toast.parsingMusicMetadata",
								"正在解析音乐元数据以添加歌曲 ({current, plural, other {#}} / {total, plural, other {#}})",
								{
									current: 0,
									total: results.length,
								},
							),
							progress: current / results.length,
						});
					}
				}),
			)
		).filter((v) => !!v);
		await db.songs.bulkPut(transformed);
		const shouldAddIds = transformed
			.map((v) => v.id)
			.filter((v) => !playlist?.songIds.includes(v))
			.reverse();
		await db.playlists.update(Number(param.id), (obj) => {
			obj.songIds.unshift(...shouldAddIds);
		});
		toast.done(id);
		if (errored > 0 && success > 0) {
			toast.warn(
				t(
					"page.playlist.addLocalMusic.toast.partiallyFailed",
					"已添加 {succeed, plural, other {#}} 首歌曲，其中 {errored, plural, other {#}} 首歌曲添加失败",
					{
						succeed: success,
						errored,
					},
				),
			);
		} else if (success === 0) {
			toast.error(
				t(
					"page.playlist.addLocalMusic.toast.allFailed",
					"{errored, plural, other {#}} 首歌曲添加失败",
					{
						errored,
					},
				),
			);
		} else {
			toast.success(
				t(
					"page.playlist.addLocalMusic.toast.success",
					"已全部添加 {count, plural, other {#}} 首歌曲",
					{
						count: success,
					},
				),
			);
		}
	}, [playlist, param.id, t]);

	const onPlaylistNameChange = (newName: string) => {
		if (playlist === undefined) return;
		db.playlists.update(Number(param.id), (obj) => {
			obj.name = newName;
		});
	};

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
				<Flex align="end" pt="4">
					<Button variant="soft" onClick={() => history.back()}>
						<ArrowLeftIcon />
						<Trans i18nKey="common.page.back">返回</Trans>
					</Button>
				</Flex>
				<div className="content-container svelte-9l1caf">
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
												<Trans i18nKey="page.playlist.playAll">播放全部</Trans>
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
												<Trans i18nKey="page.playlist.shufflePlayAll">
													随机播放
												</Trans>
											</button>
										</div>
									</div>
								</div>
								<div slot="artwork" draggable="true">
									<PlaylistCover playlistId={Number(param.id)} />
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
											<AMPContextualMenuButton>
												<span slot="trigger">
													<span
														aria-label="更多"
														className="more-button svelte-1sn4kz more-button--platter"
														data-testid="more-button"
														slot="trigger-content"
													>
														<svg
															width="28"
															height="28"
															viewBox="0 0 28 28"
															className="glyph"
															xmlns="http://www.w3.org/2000/svg"
														>
															<title>更多</title>
															<circle
																fill="var(--iconCircleFill, transparent)"
																cx="14"
																cy="14"
																r="14"
															/>
															<path
																fill="var(--iconEllipsisFill, white)"
																d="M10.105 14c0-.87-.687-1.55-1.564-1.55-.862 0-1.557.695-1.557 1.55 0 .848.695 1.55 1.557 1.55.855 0 1.564-.702 1.564-1.55zm5.437 0c0-.87-.68-1.55-1.542-1.55A1.55 1.55 0 0012.45 14c0 .848.695 1.55 1.55 1.55.848 0 1.542-.702 1.542-1.55zm5.474 0c0-.87-.687-1.55-1.557-1.55-.87 0-1.564.695-1.564 1.55 0 .848.694 1.55 1.564 1.55.848 0 1.557-.702 1.557-1.55z"
															/>
														</svg>
													</span>
												</span>
												<span slot="content">
													{[
														{
															label: "编辑",
															onClick: () => {
																let newName = playlist?.name || "";
																const dialog = showAMPDialog(
																	<form
																		className="playlist-form svelte-1kd2e9n"
																		onSubmit={(e) => {
																			e.preventDefault();
																			onPlaylistNameChange(newName);
																			dialog.close();
																		}}
																	>
																		<h3 className="modal-title svelte-1kd2e9n">
																			编辑歌单
																		</h3>
																		<input
																			className="playlist-title svelte-1kd2e9n"
																			name="title"
																			type="text"
																			defaultValue={newName}
																			onChange={(e) => {
																				newName = e.target.value;
																			}}
																			placeholder="歌单标题"
																			required
																		/>
																		<span style={{ height: 20 }} />
																		<div className="buttons svelte-1kd2e9n">
																			<div className="cancel-button svelte-1kd2e9n">
																				<div
																					className="button svelte-yk984v secondary"
																					data-testid="button-base-wrapper"
																				>
																					<button
																						data-testid="button-base"
																						type="button"
																						className="svelte-yk984v"
																						onClick={() => dialog.close()}
																					>
																						取消
																					</button>
																				</div>
																			</div>
																			<div className="submit-button">
																				<div
																					className="button svelte-yk984v primary"
																					data-testid="button-base-wrapper"
																				>
																					<button
																						data-testid="button-base"
																						type="submit"
																						className="svelte-yk984v"
																					>
																						完成
																					</button>
																				</div>
																			</div>
																		</div>
																	</form>,
																);
															},
														},
														{
															label: "添加歌曲",
															onClick: () => {
																onAddLocalMusics();
															},
														},
														{
															label: "从资料库中删除",
															onClick: () => {
																history.back();
																db.playlists.delete(Number(param.id));
															},
														},
													]}
												</span>
											</AMPContextualMenuButton>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
					<div className="section svelte-qc4ih7">
						<div className="section-content svelte-qc4ih7">
							<div
								className="songs-list svelte-p1kiu8 songs-list--header-is-visible songs-list--playlist"
								role="grid"
								draggable="true"
							>
								<div
									className="songs-list__header svelte-p1kiu8 songs-list__header--is-visible"
									aria-hidden="true"
									role="row"
									data-testid="tracklist-column-header"
								>
									<div
										className="songs-list__col songs-list__col--favorite-or-popular songs-list__header-col songs-list__header-col--favorite-or-popular svelte-p1kiu8"
										role="columnheader"
										data-testid="tracklist-column-header-favorite-or-popular"
									>
										<div className="songs-list__header-col-label songs-list__header-col-label--favorite-or-popular svelte-p1kiu8" />
									</div>
									<div
										className="songs-list__col songs-list__col--song songs-list__header-col songs-list__header-col--song svelte-p1kiu8"
										role="columnheader"
										data-testid="tracklist-column-header-song"
									>
										<div className="songs-list__header-col-label songs-list__header-col-label--song svelte-p1kiu8">
											歌曲
										</div>
									</div>
									<div
										className="songs-list__col songs-list__col--secondary songs-list__header-col songs-list__header-col--secondary svelte-p1kiu8"
										role="columnheader"
										data-testid="tracklist-column-header-secondary"
									>
										<div className="songs-list__header-col-label songs-list__header-col-label--secondary svelte-p1kiu8">
											艺人
										</div>
									</div>
									<div
										className="songs-list__col songs-list__col--tertiary songs-list__header-col songs-list__header-col--tertiary svelte-p1kiu8"
										role="columnheader"
										data-testid="tracklist-column-header-tertiary"
									>
										<div className="songs-list__header-col-label songs-list__header-col-label--tertiary svelte-p1kiu8">
											专辑
										</div>
									</div>
									<div
										className="songs-list__col songs-list__col--time songs-list__header-col songs-list__header-col--time svelte-p1kiu8"
										role="columnheader"
										data-testid="tracklist-column-header-time"
									>
										<div className="songs-list__header-col-label songs-list__header-col-label--time svelte-p1kiu8">
											时长
										</div>
									</div>
								</div>
								{playlist?.songIds &&
									playlist.songIds.map((songId, index) => (
										<PlaylistSongCard
											key={`playlist-song-card-${songId}`}
											songId={songId}
											songIndex={index}
											onPlayList={onPlayList}
											onDeleteSong={onDeleteSong}
											selectedSongId={selectedSongId}
											onSelectedSongIdChange={(songId) => {
												setSelectedSongId(songId);
											}}
										/>
									))}
							</div>
						</div>
					</div>
				</div>
			</PageContainer>
		</div>
	);
};

Component.displayName = "PlaylistPage";

export default Component;
