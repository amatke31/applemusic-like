import {
	Box,
	Button,
	type ButtonProps,
	Flex,
	Separator,
	Tooltip,
} from "@radix-ui/themes";
import { atom, useAtom, useAtomValue } from "jotai";
import { type FC, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { PageContainer } from "../../components/PageContainer/index.tsx";
import { loadedExtensionAtom } from "../../states/extension.ts";
import AMLLPlayerSettingIcon from "./amll-player-setting.svg?react";
import ExtensionManageIcon from "./extension-manage.svg?react";
import { ExtensionTab } from "./extension.tsx";
import styles from "./index.module.css";
import { PlayerSettingsTab } from "./player.tsx";

const currentPageAtom = atom("amll-player");

const TabButton: FC<ButtonProps> = ({ children, content, ...props }) => {
	return (
		<Tooltip content={content}>
			<Button mb="2" className={styles.tabButton} {...props}>
				{children}
			</Button>
		</Tooltip>
	);
};

const loadedExtensionsWithSettingsAtom = atom((get) => {
	const loadedExtensions = get(loadedExtensionAtom);
	return loadedExtensions.filter(
		(v) => v.context.registeredInjectPointComponent.settings,
	);
});

export const Component: FC = () => {
	const [currentPage, setCurrentPage] = useAtom(currentPageAtom);
	const loadedExtensions = useAtomValue(loadedExtensionsWithSettingsAtom);
	const { t } = useTranslation();

	return (
		<>
			<PageContainer>
				<div className={styles.container}>
					<Flex direction="row" gap="4" height="100%">
						<Box mt="7">
							<TabButton
								content={t("settings.player.tab", "AMLL Player 设置")}
								color={currentPage === "amll-player" ? "red" : "gray"}
								onClick={() => setCurrentPage("amll-player")}
							>
								<AMLLPlayerSettingIcon />
							</TabButton>
							<TabButton
								content={t("settings.extension.tab", "扩展程序管理")}
								color={currentPage === "extension" ? "indigo" : "gray"}
								onClick={() => setCurrentPage("extension")}
							>
								<ExtensionManageIcon />
							</TabButton>
							<Separator size="4" my="2" />
							{loadedExtensions.map((extension) => {
								const id = extension.extensionMeta.id;
								return (
									<TabButton
										content={t("name", id, { ns: id })}
										key={id}
										color={
											currentPage === `extension.${id}` ? "indigo" : "gray"
										}
										onClick={() => setCurrentPage(`extension.${id}`)}
									>
										<img src={String(extension.context.extensionMeta.icon)} />
									</TabButton>
								);
							})}
						</Box>
						<Box flexGrow="1" minWidth="0" overflowY="auto" minHeight="0">
							{currentPage === "amll-player" && <PlayerSettingsTab />}
							{currentPage === "extension" && (
								<Suspense>
									<ExtensionTab />
								</Suspense>
							)}
							{loadedExtensions.map((extension) => {
								const id = extension.extensionMeta.id;
								const ExtensionComponent =
									extension.context.registeredInjectPointComponent.settings;
								return (
									currentPage === `extension.${id}` &&
									ExtensionComponent && <ExtensionComponent key={id} />
								);
							})}
						</Box>
					</Flex>
				</div>
			</PageContainer>
		</>
	);
};

Component.displayName = "SettingsPage";

export default Component;
