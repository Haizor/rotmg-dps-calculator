import { Link } from "react-router-dom";
import { Equipment } from "rotmg-utils";
import { AssetTypes, useAssetSelector } from "../asset";
import styles from "./EquipmentSlot.module.css";
import SpriteComponent from "./SpriteComponent";

export interface EquipmentSlotProps {
	setIndex: number;
	equipIndex: number;
}

export const EquipmentSlot = ({setIndex, equipIndex}: EquipmentSlotProps) => {
	const equip = useAssetSelector<Equipment>(AssetTypes.Equipment, (state) => state.sets[setIndex].equipment[equipIndex]?.id);

	return (
		<Link className={styles.slot} to={`/set/${setIndex}/equipment/${equipIndex}`}>
			{equip !== undefined && 
				<SpriteComponent size={32} texture={equip.texture} />
			}
		</Link>
	)
}