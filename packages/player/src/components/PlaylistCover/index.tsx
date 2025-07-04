import classNames from "classnames";
import { useLiveQuery } from "dexie-react-hooks";
import { type FC, type HTMLProps, useEffect, useState } from "react";
import { db, type Playlist } from "../../dexie.ts";
import { DefaultCover } from "./default.tsx";
import styles from "./index.module.css";

export const PlaylistCover: FC<
	{
		playlist: Playlist;
		isAlbum?: boolean;
	} & HTMLProps<HTMLDivElement>
> = ({ playlist, isAlbum, className, ...props }) => {
	const [playlistImgs, setPlaylistImgs] = useState<string[]>([]);

	const uniqueSongs = useLiveQuery(async () => {
		if (playlist && !playlist.playlistCover) {
			const result = [];
			const seenBlobs = new Set<string>();

			for (const songId of playlist.songIds) {
				const song = await db.songs.get(songId);
				if (song?.cover.type.startsWith("image") && song.cover.size > 0) {
					const blobKey = await getBlobSignature(song.cover);
					if (!seenBlobs.has(blobKey)) {
						seenBlobs.add(blobKey);
						result.push(song);
						if (result.length === 4) break;
					}
				}
			}

			if (result.length > 0 && (isAlbum || result.length < 4)) {
				return [result[0]];
			}
			return result;
		}
		return [];
	}, [playlist]);

	// 生成Blob的唯一标识
	async function getBlobSignature(blob: Blob): Promise<string> {
		const buffer = await blob.arrayBuffer();
		const hashBuffer = await crypto.subtle.digest("SHA-1", buffer);
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
	}

	useEffect(() => {
		if (playlist?.playlistCover) {
			const coverUrl = URL.createObjectURL(playlist.playlistCover);
			setPlaylistImgs([coverUrl]);
			return () => URL.revokeObjectURL(coverUrl);
		}

		if (uniqueSongs && uniqueSongs.length > 0) {
			const imgs = uniqueSongs.map((v) => URL.createObjectURL(v.cover));
			setPlaylistImgs(imgs);
			return () => imgs.forEach((img) => URL.revokeObjectURL(img));
		}
	}, [uniqueSongs, playlist]);

	return (
		<div
			className={classNames(
				styles.playlistCover,
				"img-border",
				className,
				"svelte-10tj07c",
				"collage-artwork svelte-8qnhe3 is-collage",
			)}
			{...props}
			style={{ width: "100%", height: "100%" }}
		>
			{playlistImgs.length !== 0 ? (
				playlistImgs.map((img) => (
					<div
						key={img}
						style={{
							backgroundImage: `url(${img})`,
						}}
					/>
				))
			) : (
				<DefaultCover />
			)}
		</div>
	);
};
