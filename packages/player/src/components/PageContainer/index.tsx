import classNames from "classnames";
import type { FC, PropsWithChildren } from "react";

export const PageContainer: FC<PropsWithChildren> = ({ children }) => {
	return (
		<div
			className={classNames(
				// styles.container,
				"content-container svelte-9l1caf",
			)}
		>
			{children}
		</div>
	);
};
