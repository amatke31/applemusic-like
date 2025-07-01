import type { FC, ReactNode } from "react";
import { Trans } from "react-i18next";

interface SongsListProps {
	children: ReactNode;
}

export const SongsList: FC<SongsListProps> = ({ children }) => {
	return (
		<div className="section svelte-qc4ih7">
			<div className="section-content svelte-qc4ih7">
				<div
					className="songs-list svelte-p1kiu8 songs-list--header-is-visible songs-list--playlist"
					draggable="true"
				>
					<div
						className="songs-list__header svelte-p1kiu8 songs-list__header--is-visible"
						aria-hidden="true"
						data-testid="tracklist-column-header"
					>
						<div
							className="songs-list__col songs-list__col--favorite-or-popular songs-list__header-col songs-list__header-col--favorite-or-popular svelte-p1kiu8"
							data-testid="tracklist-column-header-favorite-or-popular"
						>
							<div className="songs-list__header-col-label songs-list__header-col-label--favorite-or-popular svelte-p1kiu8" />
						</div>
						<div
							className="songs-list__col songs-list__col--song songs-list__header-col songs-list__header-col--song svelte-p1kiu8"
							data-testid="tracklist-column-header-song"
						>
							<div className="songs-list__header-col-label songs-list__header-col-label--song svelte-p1kiu8">
								<Trans i18nKey="common.song">歌曲</Trans>
							</div>
						</div>
						<div
							className="songs-list__col songs-list__col--secondary songs-list__header-col songs-list__header-col--secondary svelte-p1kiu8"
							data-testid="tracklist-column-header-secondary"
						>
							<div className="songs-list__header-col-label songs-list__header-col-label--secondary svelte-p1kiu8">
								<Trans i18nKey="common.artist">艺人</Trans>
							</div>
						</div>
						<div
							className="songs-list__col songs-list__col--tertiary songs-list__header-col songs-list__header-col--tertiary svelte-p1kiu8"
							data-testid="tracklist-column-header-tertiary"
						>
							<div className="songs-list__header-col-label songs-list__header-col-label--tertiary svelte-p1kiu8">
								<Trans i18nKey="common.album">专辑</Trans>
							</div>
						</div>
						<div
							className="songs-list__col songs-list__col--time songs-list__header-col songs-list__header-col--time svelte-p1kiu8"
							data-testid="tracklist-column-header-time"
						>
							<div className="songs-list__header-col-label songs-list__header-col-label--time svelte-p1kiu8">
								<Trans i18nKey="common.time">时长</Trans>
							</div>
						</div>
					</div>
					{children}
				</div>
			</div>
		</div>
	);
};

export default SongsList;
