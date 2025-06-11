import { Cross2Icon } from "@radix-ui/react-icons";
import {
	Button,
	Card,
	Container,
	Flex,
	Inset,
	Spinner,
	Text,
	TextField,
} from "@radix-ui/themes";
import { useLiveQuery } from "dexie-react-hooks";
import { atom, useAtom } from "jotai";
import { type FC, type HTMLProps, useCallback, useRef, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { SearchIcon } from "../../components/AMPIcon/index.tsx";
import { PlaylistCard } from "../../components/PlaylistCard/index.tsx";
import { PlaylistSongCard } from "../../components/PlaylistSongCard/index.tsx";
import { db } from "../../dexie.ts";
import styles from "./index.module.css";

const FilterButton: FC<
	{
		label: string;
	} & HTMLProps<HTMLButtonElement>
> = ({ label, ...props }) => {
	return (
		<button className={styles.filterButton} {...props}>
			{label}
		</button>
	);
};

interface Filter {
	filterType: string;
	keyword: string;
	regexp: RegExp;
}

const filtersAtom = atom([] as Filter[]);
const keywordAtom = atom("");

export const Component: FC = () => {
	const [filters, setFilters] = useAtom(filtersAtom);
	const [keyword, setKeyword] = useAtom(keywordAtom);
	const trimmedKeyword = keyword.trim();
	const { t } = useTranslation();
	const inputRef = useRef<HTMLInputElement>(null);

	const [selectedSongId, setSelectedSongId] = useState("");

	const songsSearchResult = useLiveQuery(
		async () =>
			db.songs
				.filter((song) => {
					for (const filter of filters) {
						switch (filter.filterType) {
							case "songName":
								if (!filter.regexp.test(song.songName)) return false;
								break;
							case "artistName":
								if (!filter.regexp.test(song.songArtists)) return false;
								break;
							case "albumName":
								if (!filter.regexp.test(song.songAlbum)) return false;
								break;
							case "lyricContent":
								if (!filter.regexp.test(song.lyric)) return false;
								break;
							default:
								break;
						}
					}
					return true;
				})
				.distinct()
				.limit(20)
				.toArray(),
		[filters],
	);

	const playlistsSearchResult = useLiveQuery(
		async () =>
			db.playlists
				.filter((playlist) => {
					for (const filter of filters) {
						switch (filter.filterType) {
							case "playlistName":
								if (!filter.regexp.test(playlist.name)) return false;
								break;
							default:
								break;
						}
					}
					return true;
				})
				.distinct()
				.limit(20)
				.toArray(),
		[filters],
	);

	const addFilter = useCallback(
		(filterType: string) => {
			setFilters((prev) => [
				...prev,
				{
					filterType,
					keyword: trimmedKeyword,
					regexp: new RegExp(trimmedKeyword, "i"),
				},
			]);
			setKeyword("");
			inputRef.current?.focus();
		},
		[trimmedKeyword, setFilters, setKeyword],
	);

	return (
		<Container mx="4">
			<Flex align="end" pt="6" />
			<TextField.Root
				placeholder={t(
					"page.search.filter.placeholder",
					"搜索歌单、歌名、歌手等信息……",
				)}
				mt="2"
				value={keyword}
				onChange={(evt) => setKeyword(evt.target.value)}
				onKeyUp={(evt) => {
					if (evt.key === "Enter" && trimmedKeyword !== "") {
						addFilter("songName");
					} else if (evt.key === "Backspace" && keyword === "") {
						setFilters((prev) => prev.slice(0, -1));
					}
				}}
				ref={inputRef}
			>
				<TextField.Slot>
					<div style={{ fill: "#fa2d48", height: "24px" }}>
						<SearchIcon />
					</div>
					{filters.map(({ filterType, keyword }, i) => (
						<Button
							key={`filter-tag-${i}`}
							variant="soft"
							radius="full"
							size="1"
							onClick={() => {
								setFilters((prev) => prev.filter((_, index) => index !== i));
							}}
						>
							{filterType === "songName" &&
								t("page.search.filter.songName", "歌曲名 : {keyword}", {
									keyword,
								})}
							{filterType === "artistName" &&
								t("page.search.filter.artistName", "歌手名 : {keyword}", {
									keyword,
								})}
							{filterType === "albumName" &&
								t("page.search.filter.albumName", "专辑名 : {keyword}", {
									keyword,
								})}
							{filterType === "playlistName" &&
								t("page.search.filter.playlistName", "播放列表名 : {keyword}", {
									keyword,
								})}
							{filterType === "lyricContent" &&
								t("page.search.filter.lyricContent", "歌词内容 : {keyword}", {
									keyword,
								})}
							<Cross2Icon />
						</Button>
					))}
				</TextField.Slot>
			</TextField.Root>
			{trimmedKeyword.length > 0 && (
				<Card mt="2">
					<Inset>
						<FilterButton
							label={t(
								"page.search.filter.candidate.songName",
								"歌曲名 包含 {keyword}",
								{
									keyword: trimmedKeyword,
								},
							)}
							onClick={() => addFilter("songName")}
						/>
						<FilterButton
							label={t(
								"page.search.filter.candidate.artistName",
								"歌手名 包含 {keyword}",
								{
									keyword: trimmedKeyword,
								},
							)}
							onClick={() => addFilter("artistName")}
						/>
						<FilterButton
							label={t(
								"page.search.filter.candidate.albumName",
								"专辑名 包含 {keyword}",
								{
									keyword: trimmedKeyword,
								},
							)}
							onClick={() => addFilter("albumName")}
						/>
						<FilterButton
							label={t(
								"page.search.filter.candidate.playlistName",
								"播放列表名称 包含 {keyword}",
								{
									keyword: trimmedKeyword,
								},
							)}
							onClick={() => addFilter("playlistName")}
						/>
						<FilterButton
							label={t(
								"page.search.filter.candidate.lyricContent",
								"歌词内容 包含 {keyword}",
								{
									keyword: trimmedKeyword,
								},
							)}
							onClick={() => addFilter("lyricContent")}
						/>
					</Inset>
				</Card>
			)}
			{filters.length === 0 ? (
				<Text as="div" color="gray" mt="4" align="center">
					<Trans i18nKey="page.search.placeholder">
						搜索歌曲、歌手、专辑、歌词、播放列表等信息
					</Trans>
				</Text>
			) : (
				<>
					{!songsSearchResult && (
						<Flex
							m="4"
							direction="column"
							gap="4"
							justify="center"
							align="center"
						>
							<Spinner />
							<Text color="gray">搜索歌曲中</Text>
						</Flex>
					)}
					{songsSearchResult && songsSearchResult.length > 0 && (
						<>
							<Text as="div" mt="4">
								{t(
									"page.search.searchSongResultAmount",
									"搜索到 {amount} 首歌曲",
									{
										amount: playlistsSearchResult.length,
									},
								)}
							</Text>

							<div
								className="songs-list svelte-p1kiu8 songs-list--header-is-visible songs-list--playlist"
								role="grid"
								draggable="true"
							>
								{songsSearchResult.map((song, index) => (
									<PlaylistSongCard
										key={`playlist-song-card-${song.id}`}
										songId={song.id}
										songIndex={index}
										selectedSongId={selectedSongId}
										onSelectedSongIdChange={(songId) => {
											setSelectedSongId(songId);
										}}
									></PlaylistSongCard>
								))}
							</div>
						</>
					)}
					{songsSearchResult?.length === 0 && (
						<Text color="gray" align="center">
							<Trans i18nKey="page.search.noSongResult">无歌曲结果</Trans>
						</Text>
					)}
					{!playlistsSearchResult && (
						<Flex
							m="4"
							direction="column"
							gap="4"
							justify="center"
							align="center"
						>
							<Spinner />
							<Text color="gray">
								<Trans i18nKey="page.search.searchingPlaylist">
									搜索播放列表中
								</Trans>
							</Text>
						</Flex>
					)}
					{playlistsSearchResult?.length === 0 && (
						<Text>
							<Trans i18nKey="page.search.noPlaylistResult">
								无播放列表结果
							</Trans>
						</Text>
					)}
					{playlistsSearchResult && playlistsSearchResult.length > 0 && (
						<>
							<Text as="div" mt="4">
								{t(
									"page.search.searchPlaylistResultAmount",
									"搜索到 {amount} 个播放列表",
									{
										amount: playlistsSearchResult.length,
									},
								)}
							</Text>

							<div
								style={{
									minHeight: "0",
								}}
								className="grid svelte-1a54yxp grid--flow-row"
							>
								{playlistsSearchResult.map((playlist) => (
									<PlaylistCard
										playlist={playlist}
										key={`search-result-playlist-${playlist.id}`}
									></PlaylistCard>
								))}
							</div>
						</>
					)}
				</>
			)}
		</Container>
	);
};

Component.displayName = "SearchPage";

export default Component;
