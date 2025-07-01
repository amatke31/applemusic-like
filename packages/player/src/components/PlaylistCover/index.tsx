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
	const [playlistImgs, setPlaylistImgs] = useState([] as string[]);

	const firstFourSongs = useLiveQuery(async () => {
		if (playlist && !playlist.playlistCover) {
			let result = [];
			for (const songId of playlist.songIds) {
				const song = await db.songs.get(songId);
				if (song?.cover.type.startsWith("image") && song.cover.size > 0) {
					result.push(song);
					if (result.length === 4) break;
				}
			}
			if (result.length > 0 && (isAlbum || result.length < 4))
				result = [result[0]];
			return result;
		}
		return [];
	}, [playlist]);

	useEffect(() => {
		if (playlist?.playlistCover) {
			const coverUrl = URL.createObjectURL(playlist.playlistCover);

			setPlaylistImgs([coverUrl]);

			return () => {
				URL.revokeObjectURL(coverUrl);
			};
		}
		if (firstFourSongs) {
			const imgs = firstFourSongs.map((v) => URL.createObjectURL(v.cover));

			setPlaylistImgs(imgs);

			return () => {
				for (const img of imgs) {
					URL.revokeObjectURL(img);
				}
			};
		}
	}, [firstFourSongs, playlist]);

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
