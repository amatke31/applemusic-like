import type React from "react";
import {
	type FC,
	type ReactNode,
	useEffect,
	useRef,
	useState,
} from "react";
import { createPortal } from "react-dom";

interface MenuItem {
	label: string;
	icon?: ReactNode;
	onClick?: () => void;
	submenu?: MenuItem[];
}

interface AMPContextualMenuButtonProps {
	menuItems: Array<MenuItem | false>;
	children: ReactNode;
}

export const AMPContextualMenuButton: FC<AMPContextualMenuButtonProps> = ({
	menuItems = [],
	children,
}) => {
	const [open, setOpen] = useState(false);
	const [pos, setPos] = useState({ left: 0, top: 0 });
	const triggerRef = useRef<HTMLButtonElement>(null);
	const menuRef = useRef<HTMLDivElement>(null);

	// 关闭菜单
	useEffect(() => {
		if (!open) return;
		const handleClick = (e: MouseEvent) => {
			if (
				!menuRef.current?.contains(e.target as Node) &&
				!triggerRef.current?.contains(e.target as Node)
			) {
				setOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	}, [open]);

	// 定位菜单
	const handleOpen = (e: React.MouseEvent) => {
		e.preventDefault();
		const rect = triggerRef.current?.getBoundingClientRect();
		setPos({
			left: rect ? rect.left : e.clientX,
			top: rect ? rect.bottom : e.clientY,
		});
		setOpen(true);
	};

	// 动态修正菜单位置，判断左/右对齐
	useEffect(() => {
		if (!open || !menuRef.current || !triggerRef.current) return;
		const padding = 8;
		const safeMargin = 4;
		const menuRect = menuRef.current.getBoundingClientRect();
		const triggerRect = triggerRef.current.getBoundingClientRect();
		let left = pos.left;
		let top = pos.top;

		// 判断菜单宽度
		const menuWidth = menuRect.width;

		// 如果菜单右侧超出窗口，则右对齐 trigger
		if (left + menuWidth > window.innerWidth - padding) {
			left = triggerRect.right - menuWidth;
			// 如果右对齐后左侧还超出，则贴左边
			if (left < padding + safeMargin) {
				left = padding + safeMargin;
			}
		}
		// 如果菜单左侧超出窗口，则贴左边
		if (left < padding + safeMargin) {
			left = padding + safeMargin;
		}
		// 修正底部超出
		if (top + menuRect.height > window.innerHeight - padding) {
			// 优先尝试显示在trigger上方
			if (triggerRect.top - menuRect.height > padding + safeMargin) {
				top = triggerRect.top - menuRect.height - safeMargin;
			} else {
				top = window.innerHeight - menuRect.height - padding - safeMargin;
			}
		}
		// 修正顶部超出
		if (top < padding + safeMargin) {
			top = padding + safeMargin;
		}
		if (left !== pos.left || top !== pos.top) {
			setPos({ left, top });
		}
	}, [open, pos.left, pos.top]);

	function AMPContextualMenuItem(item: MenuItem) {
		const [submenuOpen, setSubmenuOpen] = useState(false);
		const submenuTimeout = useRef<number>();

		return (
			<div className="amp-contextual-menu">
				<li
					className={`contextual-menu-item${item.submenu ? " contextual-menu-item--has-submenu" : ""}`}
					onMouseEnter={() => {
						if (item.submenu) {
							clearTimeout(submenuTimeout.current);
							setSubmenuOpen(true);
						}
					}}
					onMouseLeave={() => {
						if (item.submenu) {
							submenuTimeout.current = window.setTimeout(
								() => setSubmenuOpen(false),
								150,
							);
						}
					}}
					style={{ position: "relative" }}
				>
					<button
						title={item.label}
						onClick={(e) => {
							if (item.submenu) {
								e.stopPropagation();
								return;
							}
							item.onClick?.();
							setOpen(false);
						}}
						type="button"
					>
						<span className="contextual-menu-item__option-wrapper">
							<span className="contextual-menu-item__option-text">
								{item.label}
							</span>
							{item.icon && (
								<>
									<span className="contextual-menu-item__option-text contextual-menu-item__option-text--after" />
									<span className="contextual-menu-item__icon-container">
										{item.icon}
									</span>
								</>
							)}
						</span>
					</button>
					{item.submenu && submenuOpen && (
						<div
							className="contextual-menu contextual-menu--in-submenu"
							style={{
								position: "absolute",
								left: "100%",
								top: 0,
								minWidth: 185,
								maxWidth: 350,
								zIndex: 2147483648,
							}}
						>
							<ul className="contextual-menu__list" role="menu">
								{item.submenu.map((sub) => (
									<AMPContextualMenuItem {...sub} key={sub.label} />
								))}
							</ul>
						</div>
					)}
				</li>
			</div>
		);
	}

	return (
		<>
			<span ref={triggerRef} onClick={handleOpen}>
				{children}
			</span>
			{open &&
				Array.isArray(menuItems) &&
				createPortal(
					<div
						className="contextual-menu__overlay"
						style={{
							position: "fixed",
							left: 0,
							top: 0,
							zIndex: 2147483647,
							width: "100vw",
							height: "100vh",
						}}
					>
						<div
							ref={menuRef}
							className="contextual-menu"
							style={{
								position: "absolute",
								left: pos.left,
								top: pos.top,
								minWidth: 185,
								maxWidth: 350,
								zIndex: 2147483647,
							}}
						>
							<ul
								className="contextual-menu__list"
								role="menu"
								style={{ overflow: "visible" }}
							>
								{menuItems.map(
									(item) =>
										item && (
											<AMPContextualMenuItem {...item} key={item.label} />
										),
								)}
							</ul>
						</div>
					</div>,
					document.body,
				)}
		</>
	);
};

export default AMPContextualMenuButton;
