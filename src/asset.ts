import { AssetManager, AssetManagerConfig, Equipment, RotMGAssetLoader, RotMGCustomSpriteLoader, RotMGSpritesheetLoader } from "@haizor/rotmg-utils"
import { useAppSelector } from "./app/hooks";
import { RootState } from "./app/store";
import Sprite from "./components/SpriteComponent";
import DBHandler from "./DBHandler";

export const AssetTypes = {
	Players: "players",
	Equipment: "equipment"
}

async function getConfig() {
	const params = new URLSearchParams(window.location.search);
	const configUrl = params.get("config") ?? "./production.json";
	const json = await (await fetch(configUrl)).json();
	console.log(json)
	return json;
}

export const Manager = new AssetManager();
Manager.registerLoader("rotmg-loader", new RotMGAssetLoader());
Manager.registerLoader("sprite-loader", new RotMGSpritesheetLoader());
Manager.registerLoader("custom-sprite-loader", new RotMGCustomSpriteLoader());

Sprite.setAssetManager(Manager);

const db = new DBHandler(Manager);

async function load() {
	await Manager.load(await getConfig());
}

export const ManagerLoading = Promise.all([load(), db.load()]);

export type IDSelector = (state: RootState) => number | string | undefined;

export function useAssetSelector<T>(type: string, selector: IDSelector) {
	return useAppSelector((state) => Manager.get<T>(type, selector(state))?.value);
}

export function getEquipment(id: number | string): Equipment | undefined {
	return Manager.get<Equipment>(AssetTypes.Equipment, id)?.value;
}