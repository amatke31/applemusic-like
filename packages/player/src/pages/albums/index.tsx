import { Flex, Spinner, Text } from "@radix-ui/themes";
import { useLiveQuery } from "dexie-react-hooks";
import { type FC, useMemo, useRef } from "react";
import { Trans } from "react-i18next";
import { ExtensionInjectPoint } from "../../components/ExtensionInjectPoint/index.tsx";
import { PageContainer } from "../../components/PageContainer/index.tsx";
import { PlaylistCard } from "../../components/PlaylistCard/index.tsx";
import { db, type Playlist } from "../../dexie.ts";

export const Component: FC = () => {
	const songs = useLiveQuery(() => db.songs.toArray());
	const viewportRef = useRef<HTMLDivElement>(null);

	const albums = useMemo(() => {
		if (songs === undefined) return;
		const albums: Playlist[] = [];
		const albumNames: { [x: string]: number } = {};
		for (const song of songs) {
			if (!Object.hasOwn(albumNames, song.songAlbum)) {
				albumNames[song.songAlbum] = albums.length;
				albums.push({
					name: song.songAlbum,
					id: albums.length,
					songIds: [],
					createTime: 1,
					updateTime: 1,
					playTime: 0,
				});
			}
			albums[albumNames[song.songAlbum]].songIds.push(song.id);
		}
		return albums;
	}, [songs]);

	return (
		<PageContainer>
			<Flex direction="column" height="100%">
				<Flex direction="row" align="center" wrap="wrap" mt="5" />
				<ExtensionInjectPoint injectPointName="page.albums.top" />
				{albums !== undefined ? (
					albums.length === 0 ? (
						<Text mt="9" as="div" align="center">
							<Trans i18nKey="page.main.noAlbumTip">没有专辑</Trans>
						</Text>
					) : (
						<div
							style={{
								minHeight: "0",
							}}
							ref={viewportRef}
							className="grid svelte-1a54yxp grid--flow-row"
						>
							{albums.map((playlist) => (
								<PlaylistCard key={playlist.id} playlist={playlist} isAlbum />
							))}
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
						<Trans i18nKey="page.main.loadingAlbums">加载专辑中</Trans>
					</Flex>
				)}
				<ExtensionInjectPoint injectPointName="page.albums.bottom" />
			</Flex>
		</PageContainer>
	);
};

Component.displayName = "AlbumsPage";

export default Component;
