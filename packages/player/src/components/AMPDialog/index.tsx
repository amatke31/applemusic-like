import { type FC, type ReactNode, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface AMPDialogProps {
	open: boolean;
	onClose?: () => void;
	children: ReactNode;
}

export const AMPDialog: FC<AMPDialogProps> = ({
	open: openProp,
	onClose,
	children,
}) => {
	const [open, setOpen] = useState(openProp);
	const dialogRef = useRef<HTMLDialogElement>(null);

	// 同步外部 open
	useEffect(() => {
		setOpen(openProp);
	}, [openProp]);

	// 关闭时按ESC或点击遮罩，setOpen(false) 并通知外部
	useEffect(() => {
		if (!open) return;
		const handleKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				setOpen(false);
				onClose?.();
			}
		};
		const handleClick = (e: MouseEvent) => {
			if (
				dialogRef.current &&
				e.target instanceof Node &&
				!dialogRef.current.contains(e.target)
			) {
				setOpen(false);
				onClose?.();
			}
		};
		document.addEventListener("keydown", handleKey);
		document.addEventListener("mousedown", handleClick);
		return () => {
			document.removeEventListener("keydown", handleKey);
			document.removeEventListener("mousedown", handleClick);
		};
	}, [open, onClose]);

	if (!open) return null;

	return createPortal(
		<div
			style={{
				position: "fixed",
				inset: 0,
				zIndex: 2147483647,
				background: "rgba(0,0,0,0.35)",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			<dialog
				className="svelte-1a4zf5b"
				ref={dialogRef}
				open
				data-testid="dialog"
				style={{
					margin: 0,
					display: "block",
					position: "relative",
					top: 0,
					transform: "none",
				}}
			>
				{children}
			</dialog>
		</div>,
		document.body,
	);
};

// 工厂函数，方便以函数方式弹出
export function showAMPDialog(content: ReactNode) {
	const container = document.createElement("div");
	document.body.appendChild(container);

	let setDialogOpen: ((open: boolean) => void) | null = null;

	function close() {
		if (setDialogOpen) setDialogOpen(false); // 先关闭Dialog
		setTimeout(() => {
			try {
				document.body.removeChild(container);
			} catch (e) {
				console.error(e);
			}
		}, 200);
	}

	function DialogWrapper() {
		const [open, setOpen] = useState(true);
		// 让外部close能控制open
		useEffect(() => {
			setDialogOpen = setOpen;
			return () => {
				setDialogOpen = null;
			};
		}, []);
		return (
			<AMPDialog open={open} onClose={close}>
				{content}
			</AMPDialog>
		);
	}

	import("react-dom/client").then(({ createRoot }) => {
		createRoot(container).render(<DialogWrapper />);
	});

	return { close };
}

export default AMPDialog;
