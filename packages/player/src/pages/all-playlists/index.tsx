import { Flex, Spinner, Text } from "@radix-ui/themes";
import { useLiveQuery } from "dexie-react-hooks";
import { type FC, useRef } from "react";
import { Trans } from "react-i18next";
import { ExtensionInjectPoint } from "../../components/ExtensionInjectPoint/index.tsx";
import { NewPlaylistButton } from "../../components/NewPlaylistButton/index.tsx";
import { PageContainer } from "../../components/PageContainer/index.tsx";
import { PlaylistCard } from "../../components/PlaylistCard/index.tsx";
import { db } from "../../dexie.ts";

export const Component: FC = () => {
	const playlists = useLiveQuery(() => db.playlists.toArray());
	const viewportRef = useRef<HTMLDivElement>(null);

	return (
		<PageContainer>
			<Flex direction="column" height="100%">
				<Flex direction="row" align="center" wrap="wrap" mt="5">
					<Flex gap="1" wrap="wrap">
						<div style={{ margin: "12px 28px" }}>
							<ExtensionInjectPoint injectPointName="page.all-playlists.sidebar.before" />
							<NewPlaylistButton />
							<ExtensionInjectPoint injectPointName="page.all-playlists.sidebar.after" />
						</div>
					</Flex>
				</Flex>
				<ExtensionInjectPoint injectPointName="page.all-playlists.top" />
				{playlists !== undefined ? (
					playlists.length === 0 ? (
						<Text mt="9" as="div" align="center">
							<Trans i18nKey="page.main.noPlaylistTip">
								没有播放列表，快去新建一个吧！
							</Trans>
						</Text>
					) : (
						<div
							style={{
								minHeight: "0",
							}}
							ref={viewportRef}
							className="grid svelte-1a54yxp grid--flow-row"
						>
							{playlists.map((playlist) => (
								<PlaylistCard key={playlist.id} playlist={playlist} />
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
						<Trans i18nKey="page.main.loadingPlaylist">加载歌单中</Trans>
					</Flex>
				)}
				<ExtensionInjectPoint injectPointName="page.main.bottom" />
			</Flex>
		</PageContainer>
	);
};

Component.displayName = "MainPage";

export default Component;
