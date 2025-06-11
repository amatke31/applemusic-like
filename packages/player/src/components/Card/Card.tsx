import type { ReactNode } from "react";
import styles from "./index.module.css";

export const Card = ({ children }: { children: ReactNode }) => {
	return <div className={styles.card}>{children}</div>;
};
