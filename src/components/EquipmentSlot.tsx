import { Link } from "react-router-dom";
import { Equipment, Item } from "rotmg-utils";
import { AssetTypes, useAssetSelector } from "../asset";
import styles from "./EquipmentSlot.module.css";
import SpriteComponent from "./SpriteComponent";
import TooltipProvider from "./tooltip/TooltipProvider";

export interface EquipmentSlotProps {
	setIndex: number;
	equipIndex: number;
	className: string;
}

export const EquipmentSlot = ({setIndex, equipIndex, className}: EquipmentSlotProps) => {
	const equip = useAssetSelector<Equipment>(AssetTypes.Equipment, (state) => state.sets[setIndex].equipment[equipIndex]?.id);

	return (
		<Link className={styles.slot + " highlightHover"} to={`/set/${setIndex}/equipment/${equipIndex}`}>
			{equip !== undefined && 
				<TooltipProvider item={new Item(equip)}>
					<SpriteComponent size={32} texture={equip.texture} />
				</TooltipProvider>
			}
		</Link>
	)
}