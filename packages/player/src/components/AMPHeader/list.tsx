import { type PropsWithChildren, forwardRef } from "react";

export const AMPHeaderList = forwardRef<
	HTMLDivElement,
	PropsWithChildren<{ label: string }>
>(({ label, children }) => {
	return (
		<div className="navigation-items navigation-items--personalized svelte-ng61m8">
			<div
				aria-hidden="true"
				className="navigation-items__header svelte-ng61m8 drop-reset"
				data-testid="navigation-items-header"
				data-drop-area=""
			>
				<span>{label}</span>
			</div>
			<ul aria-label={label} className="navigation-items__list svelte-ng61m8">
				{children}
			</ul>
		</div>
	);
});
