import { useLayoutEffect, useState } from "react";
import { type Song, db } from "../dexie.ts";
import { getVideoThumbnail } from "./video-thumbnail.ts";

export const useSongCover = (song?: Song) => {
	const [songImgUrl, setSongImgUrl] = useState<string>("");

	useLayoutEffect(() => {
		if (!song?.cover) {
			setSongImgUrl("");
			return;
		}

		// 处理图片或已缓存缩略图 - 转为 Base64
		if (song.cover.type.startsWith("image") || song.cachedThumbnail) {
			const blob = song.cachedThumbnail || song.cover;
			const reader = new FileReader();

			reader.onload = () => {
				setSongImgUrl(reader.result as string);
			};

			reader.readAsDataURL(blob);
			return;
		}

		// 处理视频封面
		if (song.cover.type.startsWith("video")) {
			let isCurrent = true;

			getVideoThumbnail(song.cover)
				.then((blob) => {
					if (!isCurrent) return;

					const reader = new FileReader();
					reader.onload = () => {
						setSongImgUrl(reader.result as string);
					};
					reader.readAsDataURL(blob);

					db.songs.update(song.id, { cachedThumbnail: blob });
				})
				.catch(console.error);

			return () => {
				isCurrent = false;
			};
		}

		setSongImgUrl("");
	}, [song]);

	return songImgUrl;
};
