import { getEquipment } from "../asset";
import { PossibleItem } from "../features/player/setsSlice";
import styles from "./EquipmentSprite.module.css";
import SpriteComponent from "./SpriteComponent";

type Props = {
	item: PossibleItem;
	size?: number;
	className?: string;
	showAccuracy?: boolean;
}

function EquipmentSprite({ item, size, className, showAccuracy }: Props) {
	if (item === undefined) return <div className={styles.spriteContainer} />

	const equipment = getEquipment(item.id);

	return (
		<div className={className} style={{position: "relative"}}>
			<SpriteComponent texture={equipment?.texture} size={size} />
			{showAccuracy && item.accuracy && (
				<div className={styles.accuracy}>{item.accuracy}%</div>
			)}
		</div>
	)
}

export default EquipmentSprite;