import { Flex, Spinner, Text } from "@radix-ui/themes";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useLiveQuery } from "dexie-react-hooks";
import { type FC, useRef } from "react";
import { Trans } from "react-i18next";
import { ExtensionInjectPoint } from "../../components/ExtensionInjectPoint/index.tsx";
import { PageContainer } from "../../components/PageContainer/index.tsx";
import { PlaylistCard } from "../../components/PlaylistCard/index.tsx";
import { db } from "../../dexie.ts";

export const Component: FC = () => {
	const playlists = useLiveQuery(() => db.playlists.toArray());
	const parentRef = useRef<HTMLDivElement>(null);

	const rowVirtualizer = useVirtualizer({
		count: playlists?.length ?? 0,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 96,
		overscan: 5,
	});

	return (
		<PageContainer>
			<Flex direction="column" height="100%">
				<Flex direction="row" align="center" wrap="wrap" mt="5" />
				<ExtensionInjectPoint injectPointName="page.main.top" />

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
							className="grid svelte-1a54yxp grid--flow-row"
							ref={parentRef}
						>
							<div
								style={{
									height: `${rowVirtualizer.getTotalSize()}px`,
									width: "100%",
									position: "relative",
								}}
							>
								{rowVirtualizer.getVirtualItems().map((virtualItem) => {
									const playlist = playlists[virtualItem.index];
									return (
										<div
											key={virtualItem.key}
											style={{
												position: "absolute",
												top: 0,
												left: 0,
												width: "100%",
												padding: "4px 8px",
												height: `${virtualItem.size}px`,
												transform: `translateY(${virtualItem.start}px)`,
												boxSizing: "border-box",
											}}
										>
											<PlaylistCard playlist={playlist} />
										</div>
									);
								})}
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
