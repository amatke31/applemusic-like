import { check } from "@tauri-apps/plugin-updater";
import chalk from "chalk";
import { atom } from "jotai";

import {
	isChechingUpdateAtom,
	updateInfoAtom,
} from "@applemusic-like-lyrics/states";

const LOG_TAG = chalk.bgHex("#FFAA00").hex("#FFFFFF")(" UPDATER ");

export const checkUpdateAtom = atom(null, async (get, set) => {
	set(isChechingUpdateAtom, true);
	const oldUpdateInfo = get(updateInfoAtom);
	if (oldUpdateInfo) {
		try {
			await oldUpdateInfo.close();
		} catch {}
	}
	set(updateInfoAtom, false);
	try {
		const update = await check();
		console.log(LOG_TAG, "检查更新返回结果", update);
		set(updateInfoAtom, update || false);
	} catch (e) {
		console.warn(LOG_TAG, "检查更新失败", e);
	} finally {
		set(isChechingUpdateAtom, false);
	}
});
