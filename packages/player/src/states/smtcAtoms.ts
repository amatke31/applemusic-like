import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { invoke } from "@tauri-apps/api/core";
import { musicPlayingPositionAtom } from "@applemusic-like-lyrics/react-full";
import { musicContextModeAtom, MusicContextMode } from "./appAtoms";

// ==================================================================
//                            类型定义
// ==================================================================

/**
 * 定义了 SMTC 会话的结构。
 */
export interface SmtcSession {
	sessionId: string;
	displayName: string;
}

/**
 * 定义了文本转换模式的枚举，用于处理不同地区的字符集。
 */
export enum TextConversionMode {
	Off = "off",
	TraditionalToSimplified = "traditionalToSimplified",
	SimplifiedToTraditional = "simplifiedToTraditional",
	SimplifiedToTaiwan = "simplifiedToTaiwan",
	TaiwanToSimplified = "taiwanToSimplified",
	SimplifiedToHongKong = "simplifiedToHongKong",
	HongKongToSimplified = "hongKongToSimplified",
}

/**
 * 定义了播放器的重复模式枚举。
 */
export enum RepeatMode {
	Off = "off",
	One = "one",
	All = "all",
}

// ==================================================================
//                        SMTC 状态与配置
// ==================================================================

/**
 * 存储当前可用的所有 SMTC 会话列表。
 */
export const smtcSessionsAtom = atom<SmtcSession[]>([]);

/**
 * 用户选择的 SMTC 会话 ID。
 * `null` 代表自动选择。
 */
export const smtcSelectedSessionIdAtom = atomWithStorage<string | null>(
	"amll-player.smtcSelectedSessionId",
	null,
);

/**
 * 控制音质详情对话框是否打开。
 */
export const audioQualityDialogOpenedAtom = atom(false);

/**
 * 当前 SMTC 会话中曲目的唯一标识符。
 */
export const smtcTrackIdAtom = atom<string>("");

/**
 * SMTC 歌词文本的转换模式设置。
 */
export const smtcTextConversionModeAtom = atomWithStorage(
	"amll-player.smtcTextConversionMode",
	TextConversionMode.Off,
);

/**
 * SMTC 会话中的随机播放状态。
 */
export const smtcShuffleStateAtom = atom<boolean>(false);

/**
 * SMTC 会话中的重复播放模式。
 */
export const smtcRepeatModeAtom = atom<RepeatMode>(RepeatMode.Off);

/**
 * 用于手动校准 SMTC 播放时间的偏移量，单位毫秒。
 */
export const smtcTimeOffsetAtom = atomWithStorage(
	"amll-player.smtcTimeOffset",
	0,
);

// ==================================================================
//                        SMTC 控制能力
// ==================================================================

/**
 * SMTC 控制能力：是否可以开始播放。
 */
export const smtcCanPlayAtom = atom<boolean>(true);

/**
 * SMTC 控制能力：是否可以暂停播放。
 */
export const smtcCanPauseAtom = atom<boolean>(true);

/**
 * SMTC 控制能力：是否可以跳到下一首。
 */
export const smtcCanSkipNextAtom = atom<boolean>(true);

/**
 * SMTC 控制能力：是否可以跳到上一首。
 */
export const smtcCanSkipPreviousAtom = atom<boolean>(true);

// ==================================================================
//                        SMTC 派生/写入状态
// ==================================================================

/**
 * 一个只写 Atom，用于触发切换随机播放状态的命令。
 */
export const onClickSmtcShuffleAtom = atom(null, (get) => {
	const currentShuffle = get(smtcShuffleStateAtom);
	invoke("control_external_media", {
		payload: { type: "setShuffle", is_active: !currentShuffle },
	}).catch(console.error);
});

/**
 * 一个只写 Atom，用于触发切换重复播放模式的命令。
 */
export const onClickSmtcRepeatAtom = atom(null, (get) => {
	const currentMode = get(smtcRepeatModeAtom);
	const nextMode =
		currentMode === RepeatMode.Off
			? RepeatMode.All
			: currentMode === RepeatMode.All
				? RepeatMode.One
				: RepeatMode.Off;
	invoke("control_external_media", {
		payload: { type: "setRepeatMode", mode: nextMode },
	}).catch(console.error);
});

/**
 * 一个派生 Atom，用于获取经过时间偏移校准后的播放进度。
 * 它会根据当前的播放模式，决定是否应用偏移量。
 */
export const correctedMusicPlayingPositionAtom = atom((get) => {
	const originalPosition = get(musicPlayingPositionAtom);
	const mode = get(musicContextModeAtom);

	if (mode === MusicContextMode.SystemListener) {
		const offset = get(smtcTimeOffsetAtom);
		const correctedPosition = originalPosition - offset;
		return Math.max(0, correctedPosition);
	}

	return originalPosition;
});
