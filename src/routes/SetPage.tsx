import { Link, Outlet, useParams } from "react-router-dom";
import { StatusEffectType } from "rotmg-utils";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { ColorPicker } from "../components/ColorPicker";
import { EquipmentSlot } from "../components/EquipmentSlot";
import { Modal } from "../components/Modal";
import SpriteComponent from "../components/SpriteComponent";
import { disableStatusEffect, enableStatusEffect, getEquipmentFromState, getPlayerFromState, setColor, setStats } from "../features/player/setsSlice";
import { BasicStats, getTextureForEffect } from "../util";

import styles from "./SetPage.module.css";

const useableEffects = [
	StatusEffectType.Berserk,
	StatusEffectType.Damaging,
	StatusEffectType["Armor Broken"],
	StatusEffectType.Curse,
	StatusEffectType.Exposed,
	StatusEffectType.Weak,
	StatusEffectType.Dazed
].sort((a, b) => a - b)

function StatusEffectToggle() {
	const params = useParams();
	const index = parseInt(params.index ?? "-1");
	const set = useAppSelector(state => state.sets[index]);
	const dispatch = useAppDispatch();

	const effects = [];
	for (let effect of useableEffects) {
		if (typeof(effect) === "string") continue;
		const toggled = set.statusEffects.includes(effect);
		const className = toggled ? "" : styles.disabled
		const onClick = () => {
			if (toggled) {
				dispatch(disableStatusEffect([index, effect]))
			} else {
				dispatch(enableStatusEffect([index, effect]))
			}
		}

		effects.push(
			<SpriteComponent key={effect} className={className} size={16} texture={getTextureForEffect(effect)} onClick={onClick}/>
		)
	}

	return <div className={styles.statusEffectRow}>{effects}</div>;
}



function StatField({stat}: {stat: keyof(BasicStats)}) {
	const params = useParams();
	const index = parseInt(params.index ?? "-1");
	const dispatch = useAppDispatch();
	const stats = useAppSelector((state) => state.sets[index].stats);

	return <input style={{borderColor: `var(--${stat})`}} className={styles.statInput} type="number" value={stats[stat]} onChange={(e) => dispatch(setStats([index, {...stats, [stat]: parseInt(e.target.value)}]))}/>
}

function Stats() {
	return <>
		<div className={styles.statsRow}>
			<StatField stat={"hp"} />
			<StatField stat={"mp"} />
			<StatField stat={"atk"} />
			<StatField stat={"dex"} />
		</div>
		<div className={styles.statsRow}>
			<StatField stat={"def"} />
			<StatField stat={"spd"} />
			<StatField stat={"vit"} />
			<StatField stat={"wis"} />
		</div>
	</>
}

export function SetPage() {
	const params = useParams();
	const index = parseInt(params.index ?? "-1");
	const set = useAppSelector(state => state.sets[index]);
	const dispatch = useAppDispatch();

	if (set === undefined || index < 0) {
		return <Modal>
			whoops i fucked up
		</Modal>
	}

	const player = getPlayerFromState(set);
	const equipment = getEquipmentFromState(set);

	return <Modal>
		<div className={styles.container} onClick={e => e.stopPropagation()}>
			<div className={styles.equipmentRow}>
				<div className={styles.player + " highlightHover"}>
					<Link to="player">
						<SpriteComponent texture={player?.texture} size={32}></SpriteComponent>
					</Link>
				</div>


				{equipment.map(((equipment, equipIndex) => <EquipmentSlot className={"highlightHover"} setIndex={index} equipIndex={equipIndex} key={equipIndex}/>))}
				<ColorPicker color={set.color} onChange={(color) => dispatch(setColor([index, color]))}/>
			</div>
			<StatusEffectToggle />
			<Stats />
		</div>
		<Outlet  />
	</Modal>
}

export default SetPage;