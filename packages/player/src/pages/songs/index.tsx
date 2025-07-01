import { useLiveQuery } from "dexie-react-hooks";
import { type FC, useCallback, useEffect, useState } from "react";
import { PageContainer } from "../../components/PageContainer/index.tsx";
import { PlaylistSongCard } from "../../components/PlaylistSongCard/index.tsx";
import { db } from "../../dexie.ts";
import SongsList from "../../components/SongsList/index.tsx";
import { emitAudioThread } from "../../utils/player.ts";

export type Loadable<Value> =
	| {
			state: "loading";
	  }
	| {
			state: "hasError";
			error: unknown;
	  }
	| {
			state: "hasData";
			data: Awaited<Value>;
	  };

export const Component: FC = () => {
	const songs = useLiveQuery(() => db.songs.toArray());

	const [selectedSongId, setSelectedSongId] = useState("");

	const onSong = useCallback(
		async (songIndex = 0) => {
			if (songs === undefined) return;
			await emitAudioThread("setPlaylist", {
				songs: songs.map((v, i) => ({
					type: "local",
					filePath: v.filePath,
					origOrder: i,
				})),
			});
			await emitAudioThread("jumpToSong", {
				songIndex,
			});
		},
		[songs],
	);

	useEffect(() => {
		setSelectedSongId("");
	}, []);

	return (
		<div className="scrollable-page svelte-mt0bfj">
			<PageContainer>
				<div
					className="content-container svelte-9l1caf"
					onClick={() => setSelectedSongId("")}
				>
					<SongsList>
						{songs?.map((song, index) => (
							<PlaylistSongCard
								key={`playlist-song-card-${song.id}`}
								songId={song.id}
								songIndex={index}
								onPlayList={onSong}
								onDeleteSong={() => {}}
								onStar={() => {}}
								selectedSongId={selectedSongId}
								onSelectedSongIdChange={(songId) => {
									setSelectedSongId(songId);
								}}
							/>
						))}
					</SongsList>
				</div>
			</PageContainer>
		</div>
	);
};

Component.displayName = "SongsPage";

export default Component;
