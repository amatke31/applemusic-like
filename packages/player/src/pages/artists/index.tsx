import { Flex, Spinner, Text } from "@radix-ui/themes";
import { useLiveQuery } from "dexie-react-hooks";
import { type FC, useMemo, useState } from "react";
import { Trans } from "react-i18next";
import { ExtensionInjectPoint } from "../../components/ExtensionInjectPoint/index.tsx";
import { PageContainer } from "../../components/PageContainer/index.tsx";
import { db, type Playlist } from "../../dexie.ts";

export const Component: FC = () => {
	const songs = useLiveQuery(() => db.songs.toArray());

	const [selectedArtist, setSelectedArtist] = useState("");

	const artists = useMemo(() => {
		if (songs === undefined) return;
		const artists: Playlist[] = [];
		const artistNames: { [x: string]: number } = {};
		for (const song of songs) {
			if (!Object.hasOwn(artistNames, song.songArtists)) {
				artistNames[song.songArtists] = artists.length;
				artists.push({
					name: song.songArtists,
					id: artists.length,
					songIds: [],
					createTime: 1,
					updateTime: 1,
					playTime: 0,
				});
			}
			artists[artistNames[song.songArtists]].songIds.push(song.id);
		}
		return artists;
	}, [songs]);

	return (
		<PageContainer>
			<Flex direction="column" height="100%">
				<Flex direction="row" align="center" wrap="wrap" mt="5" />
				<ExtensionInjectPoint injectPointName="page.albums.top" />
				{artists !== undefined ? (
					artists.length === 0 ? (
						<Text mt="9" as="div" align="center">
							<Trans i18nKey="page.main.noArtistTip">没有艺人</Trans>
						</Text>
					) : (
						<div className="section svelte-wa5vzl">
							<div className="section-content svelte-wa5vzl">
								<div className="artists-container svelte-tsmke6">
									<div className="artist-list-container svelte-tsmke6">
										<div className="container svelte-zsv6m4 scrollable-container-constrained-width">
											<div
												className="scrollable-container svelte-zsv6m4"
												id="scrollable-page-override"
												style={{ contain: "layout" }}
											>
												<div
													className="virtual-rows svelte-zsv6m4"
													style={{
														minHeight: `${54 * artists.length}px`,
														"--rowHeight": "54px",
													}}
												>
													{artists.map((artist, index) => (
														<div
															className="virtual-row svelte-zsv6m4"
															data-testid="virtual-row"
															style={{
																contain: "strict",
																top: `${index * 54}px`,
																minHeight: "54px",
															}}
															onClick={(e) => {
																e.stopPropagation();
																setSelectedArtist(artist.name);
															}}
														>
															<div
																data-testid="library-artists-component"
																role="option"
																tabindex="0"
																className={`svelte-yegxkw${artist.name === selectedArtist ? " is-selected" : ""}`}
															>
																<span
																	data-testid="library-artist-icon"
																	className="artist-icon svelte-1ehefgf"
																	style={{ minWidth: "36px" }}
																>
																	<svg
																		viewBox="0 0 20 22"
																		width="28"
																		height="28"
																		xmlns="http://www.w3.org/2000/svg"
																		data-testid="library-general-artist-icon"
																		class="general-artist-icon"
																	>
																		<clipPath id="a">
																			<path d="m3 16.2.7.8 8.6-8.4c-.2-.1-.3-.3-.5-.4-.2-.2-.3-.3-.4-.5zm8.9-13.6 5.6 5.6c-1.1 1-2.3 1.5-3.6 1.2l-2.7 2.5.1 2.5v6c0 .7-.5 1.2-1.2 1.2s-1.2-.5-1.2-1.2v-6.2l-4.7 4.5c-.3.3-.8.3-1 0L1.5 20c-.2.2-.6.2-.8-.1l-.3-.3c-.2-.3-.2-.6-.1-.8L1.4 17c-.2-.2-.3-.7 0-1l9.2-9.8c-.2-1.3.2-2.6 1.3-3.6zm1.3-1.3c1.7-1.7 3.9-1.7 5.6 0s1.6 3.9 0 5.6z"></path>
																		</clipPath>
																		<path
																			clip-path="url(#a)"
																			d="M-5-5h30v31.6H-5z"
																		></path>
																	</svg>
																</span>
																<span className="artist-name svelte-yegxkw">
																	{artist.name}
																</span>
															</div>
														</div>
													))}
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					)
				) : (
					<Flex
						direction="column"
						gap="2"
						justify="center"
						align="center"
						height="70vh"
					>
						<Spinner size="3" />
						<Trans i18nKey="page.main.loadingArtists">加载专辑中</Trans>
					</Flex>
				)}
				<ExtensionInjectPoint injectPointName="page.albums.bottom" />
			</Flex>
		</PageContainer>
	);
};

Component.displayName = "ArtistsPage";

export default Component;
