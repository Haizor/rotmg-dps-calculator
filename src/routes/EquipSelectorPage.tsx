import { useNavigate, useParams } from "react-router-dom";
import { Equipment } from "rotmg-utils";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { AssetTypes, Manager } from "../asset";
import { Modal } from "../components/Modal";
import SpriteComponent from "../components/SpriteComponent";
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

	const equips = Manager.getAll<Equipment>(AssetTypes.Equipment).filter((eq => eq.slotType === player.slotTypes[equipIndex])).map((eq) => 
		<div key={eq.id} onClick={() => {dispatch(setEquipment([index, equipIndex, { id: eq.id }])); navigate(-1)}}>
			<SpriteComponent texture={eq.texture} />
		</div>
	);

	return <Modal>
		<div className={styles.container} onClick={e => e.stopPropagation()}>
			{equips}
		</div>
	</Modal>
}

export default EquipSelectorPage;