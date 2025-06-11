import type { ReactNode } from "react";
import styles from "./index.module.css";

export const CardGroup = ({ children }: { children: ReactNode }) => {
	return <div className={styles["card-group"]}>{children}</div>;
};
