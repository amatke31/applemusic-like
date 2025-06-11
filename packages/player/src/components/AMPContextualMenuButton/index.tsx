import type React from "react";
import {
	Children,
	type FC,
	type ReactNode,
	isValidElement,
	useEffect,
	useRef,
	useState,
} from "react";
import { createPortal } from "react-dom";

interface MenuItem {
	label: string;
	icon?: ReactNode;
	onClick?: () => void;
	submenu?: {
		title?: string;
		groups: {
			title?: string;
			items: MenuItem[];
		}[];
	};
}

interface AMPContextualMenuButtonProps {
	children: ReactNode;
}

function findSlot(children: ReactNode, slotName: string) {
	let slotContent: ReactNode = null;
	Children.forEach(children, (child) => {
		if (isValidElement(child) && child.props && child.props.slot === slotName) {
			slotContent = child.props.children;
		}
	});
	return slotContent;
}

export const AMPContextualMenuButton: FC<AMPContextualMenuButtonProps> = ({
	children,
}) => {
	const [open, setOpen] = useState(false);
	const [pos, setPos] = useState({ left: 0, top: 0 });
	const triggerRef = useRef<HTMLButtonElement>(null);
	const menuRef = useRef<HTMLDivElement>(null);

	// 获取slot内容
	const trigger = findSlot(children, "trigger");
	const menuItems = findSlot(children, "content") as unknown as MenuItem[];

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

	return (
		<span style={{ display: "inline-block", position: "relative" }}>
			<div className="amp-contextual-menu-button svelte-1sn4kz">
				<button
					ref={triggerRef}
					className="contextual-menu__trigger"
					type="button"
					aria-haspopup="true"
					aria-expanded={open}
					onClick={handleOpen}
				>
					{trigger}
				</button>
			</div>
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
							<ul className="contextual-menu__list" role="menu">
								{menuItems.map((item) =>
									item.submenu ? (
										<div className="amp-contextual-menu" key={item.label}>
											<li
												className="contextual-menu-item"
												style={
													{
														"--ctxmenu-submenu-min-width": "185px",
														"--ctxmenu-submenu-max-width": "350px",
														"--ctxmenu-submenu-max-height": "350px",
													} as React.CSSProperties
												}
											>
												<button title={item.label} type="button">
													<span className="contextual-menu-item__option-wrapper">
														<span className="contextual-menu-item__option-text">
															{item.label}
														</span>
														<span className="contextual-menu-item__option-text contextual-menu-item__option-text--after" />
														<span className="contextual-menu-item__icon-container">
															{item.icon}
														</span>
													</span>
												</button>
												<div className="contextual-menu-item--nested">
													<div className="contextual-menu contextual-menu--in-submenu contextual-menu--nested">
														<ul className="contextual-menu__list" role="menu">
															{item.submenu.title && (
																<li className="contextual-menu-item contextual-menu__subhead">
																	<button type="button">
																		<span>{item.submenu.title}</span>
																	</button>
																</li>
															)}
															{item.submenu.groups.map((group) => (
																<div
																	className="contextual-menu__group"
																	key={
																		group.title ||
																		group.items.map((i) => i.label).join("_")
																	}
																>
																	{group.title && (
																		<span className="contextual-menu__group-title">
																			{group.title}
																		</span>
																	)}
																	{group.items.map((subitem) => (
																		<li
																			className="contextual-menu-item"
																			key={subitem.label}
																		>
																			<button
																				title={subitem.label}
																				onClick={() => {
																					subitem.onClick?.();
																					setOpen(false);
																				}}
																				type="button"
																			>
																				<span className="contextual-menu-item__option-wrapper">
																					<span className="contextual-menu-item__option-text">
																						{subitem.label}
																					</span>
																					<span className="contextual-menu-item__option-text contextual-menu-item__option-text--after" />
																					<span className="contextual-menu-item__icon-container">
																						{subitem.icon}
																					</span>
																				</span>
																			</button>
																		</li>
																	))}
																</div>
															))}
														</ul>
													</div>
												</div>
											</li>
										</div>
									) : (
										<div className="amp-contextual-menu" key={item.label}>
											<li className="contextual-menu-item">
												<button
													title={item.label}
													onClick={() => {
														item.onClick?.();
														setOpen(false);
													}}
													type="button"
												>
													<span className="contextual-menu-item__option-wrapper">
														<span className="contextual-menu-item__option-text">
															{item.label}
														</span>
														<span className="contextual-menu-item__option-text contextual-menu-item__option-text--after" />
														<span className="contextual-menu-item__icon-container">
															{item.icon}
														</span>
													</span>
												</button>
											</li>
										</div>
									),
								)}
							</ul>
						</div>
					</div>,
					document.body,
				)}
		</span>
	);
};

export default AMPContextualMenuButton;
