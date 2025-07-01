declare class RestrictionTarget {
	static fromElement(element: Element): Promise<RestrictionTarget>;
}

declare interface MediaStreamTrack {
	restrictTo(target: RestrictionTarget | null): Promise<void>;
}

declare interface MediaTrackConstraints {
	cursor?: "always" | "motion" | "never";
}

declare class ImageCapture {
	constructor(videoTrack: MediaStreamTrack);
	grabFrame(): Promise<ImageBitmap>;
	getPhotoCapabilities(): Promise<any>;
	getPhotoSettings(): Promise<any>;
	takePhoto(photoSettings?: any): Promise<Blob>;
	readonly track: MediaStreamTrack;
}
declare interface NavList {
	label: string;
	items: NavItem[];
}


declare interface NavItem {
	label: string;
	icon?: ReactNode;
	to: string;
}