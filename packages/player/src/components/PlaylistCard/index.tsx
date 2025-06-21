import type React from "react";
import { type PropsWithChildren, forwardRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { type Playlist, db } from "../../dexie.ts";
import { emitAudioThread } from "../../utils/player.ts";
import AMPContextualMenuButton from "../AMPContextualMenuButton/index.tsx";
import { EllipsisIcon } from "../AMPIcon";
import { PlaylistCover } from "../PlaylistCover/index.tsx";

export const PlaylistCard = forwardRef<
	HTMLDivElement,
	PropsWithChildren<{
		playlist: Playlist;
	}>
>(({ playlist }) => {
	useTranslation();

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
	const onPlaylistDefault = useCallback(onPlayList.bind(null, 0), []);

	return (
		<li className="grid-item svelte-1a54yxp">
			<div
				className="product-lockup svelte-1rancje"
				// aria-label="Against the Tide - Single、鸣潮先约电台 &amp; Forts"
				data-testid="product-lockup"
				draggable="true"
			>
				<div
					className="product-lockup__artwork svelte-1rancje has-controls"
					aria-hidden="false"
				>
					<div
						data-testid="artwork-component"
						className="artwork-component artwork-component--aspect-ratio artwork-component--orientation-square svelte-10tj07c artwork-component--fullwidth artwork-component--has-borders artwork-component--downloaded"
						style={
							{
								"--artwork-bg-color": "#232757",
								"--aspect-ratio": 1,
								"--placeholder-bg-color": "transparent",
							} as React.CSSProperties
						}
					>
						<PlaylistCover playlistId={playlist.id} />
					</div>

					<div
						className="square-lockup__social svelte-152pqr7"
						slot="artwork-metadata-overlay"
					/>
					<div
						data-testid="lockup-control"
						className="product-lockup__controls svelte-1rancje"
					>
						<Link to={`/playlist/${playlist.id}`}>
							<div
								className="product-lockup__link svelte-1rancje"
								data-testid="product-lockup-link"
								// aria-label="Against the Tide - Single、鸣潮先约电台 &amp; Forts"
							>
								{playlist.name}
							</div>
						</Link>
						<div
							data-testid="play-button"
							className="product-lockup__play-button svelte-1rancje"
						>
							<button
								aria-label={`播放“${playlist.name}”`}
								className="play-button svelte-1tvdl0z play-button--platter"
								data-testid="play-button"
								type="button"
								onClick={() => {
									void onPlaylistDefault();
								}}
							>
								<svg
									aria-hidden="true"
									className="icon play-svg"
									data-testid="play-icon"
									viewBox="0 0 60 60"
								>
									<path
										className="icon-circle-fill__circle"
										fill="var(--iconCircleFillBG, transparent)"
										d="M30 60c16.411 0 30-13.617 30-30C60 13.588 46.382 0 29.971 0 13.588 0 .001 13.588.001 30c0 16.383 13.617 30 30 30Z"
									/>
									<path
										fill="var(--iconFillArrow, var(--keyColor, black))"
										d="M24.411 41.853c-1.41.853-3.028.177-3.028-1.294V19.47c0-1.44 1.735-2.058 3.028-1.294l17.265 10.235a1.89 1.89 0 0 1 0 3.265L24.411 41.853Z"
									/>
								</svg>
							</button>
						</div>
						<div
							data-testid="context-button"
							className="product-lockup__context-button svelte-1rancje"
						>
							<div slot="context-button">
								<AMPContextualMenuButton>
									<span slot="trigger">
										<span
											aria-label="更多"
											className="more-button svelte-1sn4kz more-button--platter more-button--material"
											data-testid="more-button"
											slot="trigger-content"
										>
											<EllipsisIcon />
										</span>
									</span>
									<span slot="content">
										{[
											{
												label: "删除",
												onClick: () => {
													history.back();
													db.playlists.delete(Number(playlist.id));
												},
											},
										]}
									</span>
								</AMPContextualMenuButton>
							</div>
						</div>
					</div>
				</div>
				<div className="product-lockup__content svelte-1rancje">
					<div
						className="product-lockup__content-details svelte-1rancje"
						dir="auto"
					>
						<Link to={`/playlist/${playlist.id}`}>
							<div className="product-lockup__title-link svelte-1rancje">
								<div
									className="multiline-clamp svelte-1a7gcr6 multiline-clamp--overflow multiline-clamp--with-badge"
									style={
										{
											"--mc-lineClamp": "var(--defaultClampOverride, 2)",
										} as React.CSSProperties
									}
								>
									<span className="multiline-clamp__text svelte-1a7gcr6">
										<span
											data-testid="product-lockup-title"
											className="product-lockup__title link svelte-1rancje"
										>
											{playlist.name}
										</span>
									</span>
									<span className="multiline-clamp__badge svelte-1a7gcr6" />
								</div>
							</div>
						</Link>
						{/* <p
							data-testid="product-lockup-subtitles"
							className="product-lockup__subtitle-links svelte-1rancje product-lockup__subtitle-links--singlet"
						>
							<div
								className="multiline-clamp svelte-1a7gcr6 multiline-clamp--overflow"
								style={
									{
										"--mc-lineClamp": "var(--defaultClampOverride, 2)",
									} as React.CSSProperties
								}
							>
								<span className="multiline-clamp__text svelte-1a7gcr6">
									<a
										href="https://music.apple.com/WebObjects/MZStore.woa/wa/viewCollaboration?cc=cn&amp;ids=1750699818-1498271801"
										className="product-lockup__subtitle link svelte-1rancje"
										data-testid="product-lockup-subtitle"
									>
										鸣潮先约电台 &amp; Forts
									</a>
								</span>
							</div>
						</p> */}
					</div>
				</div>
			</div>
		</li>
	);
});
