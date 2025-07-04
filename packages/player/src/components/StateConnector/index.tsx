import { useAtom, useSetAtom } from "jotai";
import { useEffect } from "react";

import {
	isShuffleActiveAtom,
	repeatModeAtom,
	RepeatMode,
	isShuffleEnabledAtom,
	isRepeatEnabledAtom,
	positionSourceAtom,
	musicPlayingPositionAtom,
} from "@applemusic-like-lyrics/react-full";

import { musicContextModeAtom, MusicContextMode } from "../../states/appAtoms";
import {
	smtcShuffleStateAtom,
	smtcRepeatModeAtom,
	correctedMusicPlayingPositionAtom as smtcCorrectedPositionAtom,
} from "../../states/smtcAtoms";

export const StateConnector = () => {
	const [mode] = useAtom(musicContextModeAtom);
	const [isSmtcShuffleOn] = useAtom(smtcShuffleStateAtom);
	const [smtcRepeat] = useAtom(smtcRepeatModeAtom);

	const setUiIsShuffleActive = useSetAtom(isShuffleActiveAtom);
	const setUiRepeatMode = useSetAtom(repeatModeAtom);
	const setUiShuffleEnabled = useSetAtom(isShuffleEnabledAtom);
	const setUiRepeatEnabled = useSetAtom(isRepeatEnabledAtom);

	useEffect(() => {
		const isSmtcMode = mode === MusicContextMode.SystemListener;

		if (isSmtcMode) {
			setUiIsShuffleActive(isSmtcShuffleOn);
			setUiRepeatMode(smtcRepeat);
		} else {
			setUiIsShuffleActive(false);
			setUiRepeatMode(RepeatMode.Off);
		}

		setUiShuffleEnabled(isSmtcMode);
		setUiRepeatEnabled(isSmtcMode);
	}, [
		mode,
		isSmtcShuffleOn,
		smtcRepeat,
		setUiIsShuffleActive,
		setUiRepeatMode,
		setUiShuffleEnabled,
		setUiRepeatEnabled,
	]);

	const setPositionSource = useSetAtom(positionSourceAtom);

	useEffect(() => {
		if (mode === MusicContextMode.SystemListener) {
			setPositionSource(smtcCorrectedPositionAtom);
		} else {
			setPositionSource(musicPlayingPositionAtom);
		}
	}, [mode, setPositionSource]);

	return null;
};
