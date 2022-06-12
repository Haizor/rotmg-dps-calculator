import { addSet, getEquipmentFromState, getPlayerFromState, PlayerState, removeSet } from "../features/player/setsSlice";
import SpriteComponent from "./SpriteComponent";
import styles from "./SetsDisplay.module.css"
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { useNavigate } from "react-router-dom";
import { getTextureForEffect } from "../util";

function SetsDisplay() {
	const dispatch = useAppDispatch();
	const sets = useAppSelector<PlayerState[]>((state) => state.sets);

	return <div className={styles.setsDisplay}>
		{sets.map((set, index) => <SetDisplay key={index} set={set} index={index} />)}
		<button className={styles.button} onClick={() => {
			dispatch(addSet())
		}}>+</button>
	</div>
}

function SetDisplay({set, index}: {set: PlayerState, index: number}) {
	const dispatch = useAppDispatch();
	const player = getPlayerFromState(set);
	const equipment = getEquipmentFromState(set);
	const navigate = useNavigate();

	const remove = (e: React.MouseEvent) => {
		dispatch(removeSet(index))
		e.stopPropagation();
	}

	return (
		<div className={styles.setDisplay} style={{border: "2px solid " + set.color}} onClick={() => navigate(`/set/${index}`)}>
			<div className={styles.row}>
				<SpriteComponent texture={player?.texture} size={32}></SpriteComponent>
				{equipment.map(((equipment, equipIndex) => <SpriteComponent texture={equipment?.texture} size={32} key={equipIndex}/>))}
				<button className={styles.button} onClick={remove}>X</button>
			</div>
			<StatusEffectsDisplay set={set}/>
		</div>
	)
}

function StatusEffectsDisplay({set}: {set: PlayerState}) {
	const effects = set.statusEffects.map((effect) => (
		<SpriteComponent key={effect} texture={getTextureForEffect(effect)} size={16} />
	))

	return (
		<div className={styles.row}>
			{effects}
		</div>
	);
}

export default SetsDisplay;