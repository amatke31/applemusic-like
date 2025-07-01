import { type PropsWithChildren, type ReactNode, forwardRef } from "react";
import { Link, useLocation } from "react-router-dom";

export const AMPHeaderListItem = forwardRef<
	HTMLDivElement,
	PropsWithChildren<{ label: string; icon?: ReactNode; to: string }>
>(({ label, icon, to }) => {
	const location = useLocation();
	const isSelected = location.pathname === to;

	return (
		<li
			className={`navigation-item navigation-item__all-playlists svelte-1a5yt87 drop-reset${isSelected && " navigation-item--selected"}`}
			data-testid="navigation-item"
		>
			<Link to={to}>
				<div
					className="navigation-item__link svelte-1a5yt87"
					data-testid="all-playlists"
					tabindex="-1"
				>
					<div className="navigation-item__content svelte-zhx7t9">
						<span className="navigation-item__icon svelte-zhx7t9">{icon}</span>
						<span className="navigation-item__label svelte-zhx7t9">
							{label}
						</span>
					</div>
				</div>
			</Link>
		</li>
	);
});
