import { addSet, getEquipmentFromState, getPlayerFromState, PlayerState, removeSet } from "../features/player/setsSlice";
import SpriteComponent from "./SpriteComponent";
import styles from "./SetsDisplay.module.css"
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { useNavigate } from "react-router-dom";
import { getTextureForEffect } from "../util";
import EquipmentSprite from "./EquipmentSprite";
import { MouseEvent, useState } from "react";
import ReactDOM from "react-dom";
import { getStatsFromState } from "../dps/dps-calculator";

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
	const settings = useAppSelector(state => state.settings);
	const items = set.equipment;
	const navigate = useNavigate();
	const [ hovering, setHovering ] = useState(false);
	const [ pos, setPos ] = useState([0, 0]);

	const remove = (e: React.MouseEvent) => {
		dispatch(removeSet(index))
		e.stopPropagation();
	}

	const updateStatsTooltip = (e: MouseEvent, enable?: boolean) => {
		if (enable !==  undefined)
			setHovering(enable);
		setPos([e.clientX, e.clientY])
	}

	const statsTooltip = (hovering) ? ReactDOM.createPortal(<StatsDisplay set={set} x={pos[0]} y={pos[1]}/>, document.getElementById("modal") as HTMLElement) : null;

	return <>
		{statsTooltip}
		<div className={styles.setDisplay + " highlightHover"} 
			style={{border: "2px solid " + set.color}} 
			onClick={() => navigate(`/set/${index}`)} 
			onMouseEnter={(e) => updateStatsTooltip(e, true)}
			onMouseLeave={(e) => updateStatsTooltip(e, false)}
			onMouseMove={(e) => updateStatsTooltip(e)}
		>
			<div className={styles.row}>
				<SpriteComponent texture={player?.texture} size={32}></SpriteComponent>
				{items.map(((item, equipIndex) => <EquipmentSprite item={item} size={32} key={equipIndex} showAccuracy/>))}
				<button className={styles.button} onClick={remove}>X</button>
			</div>
			<StatusEffectsDisplay set={set}/>
		</div>
	</>
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


function StatsDisplay({set, x, y}: {
	set: PlayerState,
	x: number,
	y: number
}) {
	const stats = getStatsFromState(set);

	return (
		<div className={styles.statsDisplay} style={{left: `${x}px`, top: `${y}px`}}>
			<span style={{color: "var(--hp)"}}>{stats.hp}</span>
			<span style={{color: "var(--mp)"}}>{stats.mp}</span>
			<span style={{color: "var(--atk)"}}>{stats.atk}</span>
			<span style={{color: "var(--def)"}}>{stats.def}</span>
			<span style={{color: "var(--spd)"}}>{stats.spd}</span>
			<span style={{color: "var(--dex)"}}>{stats.dex}</span>
			<span style={{color: "var(--vit)"}}>{stats.vit}</span>
			<span style={{color: "var(--wis)"}}>{stats.wis}</span>
		</div>
	)
}

export default SetsDisplay;