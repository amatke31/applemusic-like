import { useSetAtom } from "jotai";
import { useLayoutEffect } from "react";
import { hideNowPlayingBarAtom } from "@applemusic-like-lyrics/states";

export const useHideNowPlayingBar = () => {
	const setHideNowPlayingBar = useSetAtom(hideNowPlayingBarAtom);
	useLayoutEffect(() => {
		setHideNowPlayingBar(true);
		return () => {
			setHideNowPlayingBar(false);
		};
	}, [setHideNowPlayingBar]);
};
