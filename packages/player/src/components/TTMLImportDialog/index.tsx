import type { TTMLLyric } from "@applemusic-like-lyrics/lyric";
import {
	Button,
	Callout,
	Card,
	Dialog,
	Flex,
	Spinner,
	Text,
	TextField,
} from "@radix-ui/themes";
import { open } from "@tauri-apps/plugin-shell";
import { useLiveQuery } from "dexie-react-hooks";
import { type FC, useLayoutEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { type TTMLDBLyricEntry, db } from "../../dexie.ts";
import styles from "./index.module.css";

function getMetadataValue(ttml: TTMLLyric, key: string) {
	let result = "";
	for (const [k, v] of ttml.metadata) {
		if (k === key) {
			result += v.join(", ");
		}
	}
	return result;
}

function fuzzyMatch(text: string, pattern: string): boolean {
	const normalize = (str: string) =>
		str
			.toLowerCase()
			.replace(/[\/,\-–—()（）]/g, " ")
			.replace(/\s+/g, " ")
			.trim();

	const normalizedText = normalize(text);
	const normalizedPattern = normalize(pattern);

	if (
		normalizedText.includes(normalizedPattern) ||
		normalizedPattern.includes(normalizedText)
	) {
		return true;
	}

	const textWords = new Set(normalizedText.split(" "));
	const patternWords = normalizedPattern.split(" ");

	const matchedWords = patternWords.filter(
		(word) => word.length > 1 && textWords.has(word),
	);
	const matchRatio = matchedWords.length / patternWords.length;

	if (matchRatio > 0.6) {
		return true;
	}

	function longestCommonSubsequence(a: string, b: string) {
		const matrix = Array(a.length + 1)
			.fill(0)
			.map(() => Array(b.length + 1).fill(0));

		for (let i = 1; i <= a.length; i++) {
			for (let j = 1; j <= b.length; j++) {
				matrix[i][j] =
					a[i - 1] === b[j - 1]
						? matrix[i - 1][j - 1] + 1
						: Math.max(matrix[i - 1][j], matrix[i][j - 1]);
			}
		}
		return matrix[a.length][b.length];
	}

	const lcsLength = longestCommonSubsequence(
		normalizedText.replace(/\s/g, ""),
		normalizedPattern.replace(/\s/g, ""),
	);

	if (lcsLength / normalizedPattern.replace(/\s/g, "").length > 0.7) {
		return true;
	}

	function getEditDistance(a: string, b: string) {
		if (a.length === 0) return b.length;
		if (b.length === 0) return a.length;

		const matrix = [];
		for (let i = 0; i <= b.length; i++) {
			matrix[i] = [i];
		}
		for (let j = 0; j <= a.length; j++) {
			matrix[0][j] = j;
		}

		for (let i = 1; i <= b.length; i++) {
			for (let j = 1; j <= a.length; j++) {
				matrix[i][j] =
					b.charAt(i - 1) === a.charAt(j - 1)
						? matrix[i - 1][j - 1]
						: Math.min(
								matrix[i - 1][j - 1] + 1,
								matrix[i][j - 1] + 1,
								matrix[i - 1][j] + 1,
							);
			}
		}

		return matrix[b.length][a.length];
	}

	const allowedDistance = Math.floor(normalizedPattern.length * 0.3);
	if (getEditDistance(normalizedText, normalizedPattern) <= allowedDistance) {
		return true;
	}

	return false;
}

function isTTMLEntryMatch(entry: TTMLDBLyricEntry, searchTerm: string) {
	const result = {
		name: entry.name,
		raw: entry.raw,
		songName: getMetadataValue(entry.content, "musicName"),
		songArtists: getMetadataValue(entry.content, "artists"),
		matchedLinePreview: [] as string[],
	};

	const matchTargets = [
		result.name,
		result.songName,
		result.songArtists,
		`${result.songName} ${result.songArtists}`,
		`${result.songArtists} ${result.songName}`,
		`${result.name} ${result.songArtists}`,
		`${result.songArtists} ${result.name}`,
		`${result.songName} (${result.songArtists})`,
		`${result.songArtists} (${result.songName})`,
	];

	for (const target of matchTargets) {
		if (fuzzyMatch(target, searchTerm)) {
			return result;
		}
	}

	for (let i = 0; i < entry.content.lines.length; i++) {
		const text = entry.content.lines[i].words.map((w) => w.word).join(" ");
		if (fuzzyMatch(text, searchTerm)) {
			result.matchedLinePreview = entry.content.lines
				.slice(i, i + 3)
				.map((l) => l.words.map((w) => w.word).join(" "));
			return result;
		}
	}
	return undefined;
}

export const TTMLImportDialog: FC<{
	defaultValue?: string;
	onSelectedLyric?: (ttmlContent: string) => void;
}> = ({ onSelectedLyric, defaultValue }) => {
	const { t } = useTranslation();

	const [searchWord, setSearchWord] = useState("");
	const [opened, setOpened] = useState(false);

	const result = useLiveQuery(() => {
		const words = searchWord.trim();
		if (words.length > 0) {
			return db.ttmlDB
				.toCollection()
				.reverse()
				.filter((x) => !!isTTMLEntryMatch(x, words))
				.limit(10)
				.sortBy("name")
				.then((x) =>
					x.map((x) => isTTMLEntryMatch(x, words)).filter((v) => !!v),
				);
		}
		return [];
	}, [searchWord]);

	useLayoutEffect(() => {
		setSearchWord(defaultValue ?? "");
	}, [defaultValue]);

	return (
		<Dialog.Root open={opened} onOpenChange={setOpened}>
			<Dialog.Trigger>
				<Button>
					<Trans i18nKey="amll.ttmlImportDialog.openButtonLabel">
						从 AMLL TTML DB 搜索 / 导入歌词
					</Trans>
				</Button>
			</Dialog.Trigger>
			<Dialog.Content>
				<Dialog.Title>
					<Trans i18nKey="amll.ttmlImportDialog.title">
						从 AMLL TTML DB 搜索 / 导入歌词
					</Trans>
				</Dialog.Title>
				<TextField.Root
					placeholder={t(
						"amll.ttmlImportDialog.searchInput.placeholder",
						"搜索歌曲、歌词内容、歌手等……",
					)}
					type="text"
					onChange={(v) => setSearchWord(v.target.value)}
					value={searchWord}
				/>
				<Callout.Root mt="4">
					<Trans i18nKey="amll.ttmlImportDialog.tip">
						在上方输入搜索关键词，点击候选项即可将歌词内容直接导入到歌词数据中。
					</Trans>
				</Callout.Root>
				<Callout.Root mt="4" color="grass">
					<Text>
						<Trans i18nKey="amll.ttmlImportDialog.supportText">
							AMLL TTML DB 是由 AMLL
							社区爱好者们一同建设的开源无版权歌词数据库，想为 AMLL TTML DB
							贡献歌词吗？前往
							<Button
								variant="outline"
								onClick={() =>
									open("https://github.com/Steve-xmh/amll-ttml-db")
								}
								style={{
									verticalAlign: "baseline",
									margin: "0 0.5em",
									fontWeight: "bold",
								}}
							>
								GitHub 仓库
							</Button>
							即可知晓提交歌词流程！
						</Trans>
					</Text>
				</Callout.Root>
				{result ? (
					result.length === 0 ? (
						<div style={{ margin: "1em", textAlign: "center", opacity: "0.5" }}>
							<Trans i18nKey="amll.ttmlImportDialog.noResults">无结果</Trans>
						</div>
					) : (
						result.map((v) => (
							<Card key={v.name} asChild>
								<button
									className={styles.resultCard}
									type="button"
									onClick={() => {
										onSelectedLyric?.(v.raw);
										setOpened(false);
									}}
								>
									<div className={styles.name}>{v.name}</div>
									<div>
										{v.songArtists} - {v.songName}
									</div>
									{v.matchedLinePreview.length > 0 && (
										<ul>
											{v.matchedLinePreview.map((l, i) => (
												<li key={`${l}-${i}`}>{l}</li>
											))}
										</ul>
									)}
								</button>
							</Card>
						))
					)
				) : (
					<Spinner />
				)}
				<Flex gap="3" mt="4" justify="end">
					<Dialog.Close>
						<Button variant="soft">
							<Trans i18nKey="common.dialog.close">关闭</Trans>
						</Button>
					</Dialog.Close>
				</Flex>
			</Dialog.Content>
		</Dialog.Root>
	);
};
