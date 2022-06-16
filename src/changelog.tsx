import { NavigateFunction } from "react-router-dom";

export const currVersion = "0.2.2";
export const prevVersionKey = "prevVersion"

export async function getChangelog(): Promise<string> {
	const data = await (await fetch("./changelog.md")).text();
	return data;
}

export function getLastVersion(): string | null {
	return window.localStorage.getItem(prevVersionKey);
}

export function isVersionLower(a: string, b: string) {
	const aNumbers = a.split(".").map(s => parseInt(s));
	const bNumbers = b.split(".").map(s => parseInt(s));

	for (let i = 0; i < aNumbers.length; i++) {
		const aNum = aNumbers[i] ?? 0;
		const bNum = bNumbers[i] ?? 0;
		if (bNum < aNum) {
			return true;
		}
	}

	return false;
}

export function tryDisplayChangelog(navigate: NavigateFunction) {
	const lastVersion = getLastVersion();

	if (lastVersion === null) {
		navigate("changelog");
		window.localStorage.setItem(prevVersionKey, currVersion);
		return;
	}

	if (isVersionLower(currVersion, lastVersion)) {
		navigate("changelog");
		window.localStorage.setItem(prevVersionKey, currVersion);
	}
}