import { useParams, useNavigate } from "react-router-dom";
import { Player } from "rotmg-utils";
import { useAppDispatch } from "../app/hooks";
import { AssetTypes, Manager } from "../asset";
import { Modal } from "../components/Modal";
import SpriteComponent from "../components/SpriteComponent";
import { setPlayer } from "../features/player/setsSlice";

import styles from "./SelectorPage.module.css";

function PlayerSelectorPage() {
	const params = useParams();
	const index = parseInt(params.index ?? "-1");

	const navigate = useNavigate();
	const dispatch = useAppDispatch();

	const players = Manager.getAll<Player>(AssetTypes.Players).map((player) => (
		<div key={player.type} className={"highlightHover"} onClick={e => {dispatch(setPlayer([index, player.type])); navigate(-1)}}>
			<SpriteComponent texture={player.texture} />
		</div>
	));

	return <Modal className={styles.container}>

		{players}

	</Modal>
}

export default PlayerSelectorPage;