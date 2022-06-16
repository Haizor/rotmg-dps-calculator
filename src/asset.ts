import { AssetManager, AssetManagerConfig, Equipment, RotMGAssetLoader, RotMGCustomSpriteLoader, RotMGSpritesheetLoader } from "@haizor/rotmg-utils"
import { useAppSelector } from "./app/hooks";
import { RootState } from "./app/store";
import Sprite from "./components/SpriteComponent";
import DBHandler from "./DBHandler";

export const AssetTypes = {
	Players: "players",
	Equipment: "equipment"
}

const config: AssetManagerConfig = {
	name: "main",
	default: true,
	containers: [
		{
			loader: "rotmg-loader",
			type: AssetTypes.Players,
			sourceLoader: "url-to-text",
			settings: {
				readOnly: true,
				type: "object"
			},
			sources: [
				"https://www.haizor.net/rotmg/assets/production/xml/players.xml"
			]
		},
		{
			loader: "rotmg-loader",
			type: AssetTypes.Equipment,
			sourceLoader: "url-to-text",
			settings: {
				readOnly: true,
				type: "object"
			},
			sources: [
				"https://www.haizor.net/rotmg/assets/production/xml/equip.xml",
				"https://www.haizor.net/rotmg/assets/production/xml/equipmentsets.xml"
			]
		},
		{
			type: "sprites",
			loader: "sprite-loader",
			sourceLoader: "url-to-text",
			sources: [
				"https://www.haizor.net/rotmg/assets/production/atlases/spritesheet.json"
			]
		}
	]
}

export const Manager = new AssetManager();
Manager.registerLoader("rotmg-loader", new RotMGAssetLoader());
Manager.registerLoader("sprite-loader", new RotMGSpritesheetLoader());
Manager.registerLoader("custom-sprite-loader", new RotMGCustomSpriteLoader());

Sprite.setAssetManager(Manager);

const db = new DBHandler(Manager);

export const ManagerLoading = Promise.all([Manager.load(config),  db.load()]);

export type IDSelector = (state: RootState) => number | string | undefined;

export function useAssetSelector<T>(type: string, selector: IDSelector) {
	return useAppSelector((state) => Manager.get<T>(type, selector(state))?.value);
}

export function getEquipment(id: number | string): Equipment | undefined {
	return Manager.get<Equipment>(AssetTypes.Equipment, id)?.value;
}