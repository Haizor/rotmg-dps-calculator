import { useNavigate, useParams } from "react-router-dom";
import { Equipment, Item } from "@haizor/rotmg-utils";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { AssetTypes, Manager } from "../asset";
import { Modal } from "../components/Modal";
import SpriteComponent from "../components/SpriteComponent";
import TooltipProvider from "../components/tooltip/TooltipProvider";
import { getPlayerFromState, setEquipment } from "../features/player/setsSlice";

import styles from "./SelectorPage.module.css";

function EquipSelectorPage() {
	const params = useParams();
	const index = parseInt(params.index ?? "-1");
	const equipIndex = parseInt(params.equipIndex ?? "-1");
	const navigate = useNavigate();
	const dispatch = useAppDispatch();

	const set = useAppSelector(state => state.sets[index]);

	if (set === undefined) {
		navigate(-1);
		return null;
	}

	const player = getPlayerFromState(set);
	if (player === undefined) {
		navigate(-1);
		return null;
	}

	const equips = [(
		<div key={"none"} className={styles.remove + " highlightHover"} onClick={() => {dispatch(setEquipment([index, equipIndex, undefined])); navigate(-1)}}>
			❌
		</div>
	), ...Manager.getAll<Equipment>(AssetTypes.Equipment).filter((eq => eq.slotType === player.slotTypes[equipIndex])).map((eq) => 
		<div key={eq.id} className={"highlightHover"} onClick={() => {dispatch(setEquipment([index, equipIndex, { id: eq.id }])); navigate(-1)}}>
			<TooltipProvider item={new Item(eq)}>
				<SpriteComponent texture={eq.texture} />
			</TooltipProvider>
		</div>
	)];

	return <Modal className={styles.container}>

		{equips}

	</Modal>
}

export default EquipSelectorPage;