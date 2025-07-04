import { atom, type Atom } from "jotai";
import { musicPlayingPositionAtom } from "./dataAtoms";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "react-toastify";

/**
 * 定义了通用的重复播放模式枚举。
 */
export enum RepeatMode {
	Off = "off",
	One = "one",
	All = "all",
}

// ==================================================================
//                        抽象的媒体控制状态
// ==================================================================

export const isShuffleActiveAtom = atom<boolean>(false);
export const repeatModeAtom = atom<RepeatMode>(RepeatMode.Off);
export const isShuffleEnabledAtom = atom<boolean>(false);
export const isRepeatEnabledAtom = atom<boolean>(false);

// ==================================================================
//                        依赖注入模式实现
// ==================================================================

/**
 * 切换随机播放的动作。
 */
export const toggleShuffleActionAtom = atom(null, (get) => {
	const currentShuffleState = get(isShuffleActiveAtom);
	const newShuffleState = !currentShuffleState;

	invoke("control_external_media", {
		payload: { type: "setShuffle", is_active: newShuffleState },
	}).catch((err) => {
		console.error("设置随机播放失败:", err);
		toast.error("设置随机播放失败");
	});
});

/**
 * 切换重复模式的动作。
 */
export const cycleRepeatModeActionAtom = atom(null, (get) => {
	const currentRepeatMode = get(repeatModeAtom);
	const nextMode =
		currentRepeatMode === RepeatMode.Off
			? RepeatMode.All
			: currentRepeatMode === RepeatMode.All
				? RepeatMode.One
				: RepeatMode.Off;

	invoke("control_external_media", {
		payload: { type: "setRepeatMode", mode: nextMode },
	}).catch((err) => {
		console.error("设置循环模式失败:", err);
		toast.error("设置循环模式失败");
	});
});

/**
 * 存储用于计算播放时间的源 Atom。
 * @internal
 */
export const positionSourceAtom = atom<Atom<number>>(musicPlayingPositionAtom);

/**
 * UI组件读取的、经过校准的播放时间。
 */
export const correctedMusicPlayingPositionAtom = atom((get) =>
	get(get(positionSourceAtom)),
);
