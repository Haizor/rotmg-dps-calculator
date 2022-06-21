import { Link } from "react-router-dom";
import { Item } from "@haizor/rotmg-utils";
import { getEquipment } from "../asset";
import styles from "./EquipmentSlot.module.css";
import TooltipProvider from "./tooltip/TooltipProvider";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import EquipmentSprite from "./EquipmentSprite";
import { setAccuracy } from "../features/player/setsSlice";
import PercentInput from "./PercentInput";
import { getStatsFromState } from "../dps/dps-calculator";

export interface EquipmentSlotProps {
	setIndex: number;
	equipIndex: number;
	className: string;
}

export const EquipmentSlot = ({setIndex, equipIndex, className}: EquipmentSlotProps) => {
	const set = useAppSelector(state => state.sets[setIndex]);
	const item = set.equipment[equipIndex];
	const equip = getEquipment(item?.id ?? "");
	const dispatch = useAppDispatch();

	const stats = getStatsFromState(set);

	const accuracyChange = (accuracy: number) => {
		dispatch(setAccuracy([setIndex, equipIndex, accuracy]))
	}

	return (
		<div className={styles.slotContainer}>
			<Link className={styles.slot + " highlightHover"} to={`/set/${setIndex}/equipment/${equipIndex}`}>
			{equip !== undefined && 
				<TooltipProvider item={new Item(equip)} player={{stats}}>
					<EquipmentSprite item={item} size={32}/>
				</TooltipProvider>
			}
			</Link>
			{equip !== undefined && (equip.isAbility() || equip.isWeapon()) && (
				<div className={styles.accuracyContainer}>
					<PercentInput className={styles.accuracySpinner} value={item?.accuracy ?? 100} onChange={accuracyChange}/>
				</div>
			)}
		</div>
	)
}


