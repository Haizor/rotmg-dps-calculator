import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Equipment, Player, Stats, StatusEffectType } from "@haizor/rotmg-utils";
import { AssetTypes, getEquipment, Manager } from '../../asset';
import { BasicStats, fullToBasicStats } from '../../util';
import * as _ from "lodash";

let idCount = 0;

export interface PlayerState {
	equipment: [PossibleItem, PossibleItem, PossibleItem, PossibleItem];
	player: number;
	stats: BasicStats;
	color: string;
	statusEffects: StatusEffectType[];
	petMagicHeal: number;
	id: number;
}

export interface Item {
	id: string;
	accuracy?: number;
}

export type Indexed<T> = [number, T]

export type DoubleIndexed<T> = [number, number, T];

export type PossibleItem = Item | undefined;

function getInitialState(): PlayerState[] {
	const player = Manager.get<Player>(AssetTypes.Players, 0x0307)?.value;
	if (player === undefined)
	return [
		{
			player: 0x0307,
			equipment: [undefined, undefined, undefined, undefined],
			stats: fullToBasicStats(new Stats()),
			color: "#FFF",
			statusEffects: [],
			id: idCount++,
			petMagicHeal: 70
		}
	]

	const state: PlayerState = {
		player: player.type,
		equipment: [undefined, undefined, undefined, undefined],
		stats: fullToBasicStats(player.maxStats),
		color: "#FFF",
		statusEffects: [],
		id: idCount++,
		petMagicHeal: 70
	}

	for (let i = 0; i < 4; i++) {
		const equipment = getEquipment(player.equipment[i]);

		if (equipment === undefined) continue;

		state.equipment[i] = {
			id: equipment.id,
			accuracy: 0
		};
	}

	return [
		state
	]
}


const playerSlice = createSlice({
	name: "sets",
	initialState: getInitialState(),
	reducers: {
		addSet: (state: PlayerState[], action: PayloadAction<PlayerState | undefined>) => {
			if (action.payload === undefined) {
				const set = state.length > 0 ? _.cloneDeep(state[state.length  - 1]) : getInitialState()[0];
				set.id = idCount++;
				state.push(set);
				return;
			}
			state.push(action.payload);
		},
		removeSet: (state: PlayerState[], action: PayloadAction<number>) => {
			state.splice(action.payload, 1)
		},
		setPlayer: (state: PlayerState[], action: PayloadAction<Indexed<number>>) => {
			const set = state[action.payload[0]];
			set.player = action.payload[1];

			const player = getPlayerFromState(set);
			if (player === undefined) return;

			for (let i = 0; i < 4; i++) {
				const equipment = getEquipment(player.equipment[i]);
				const currEquip = getEquipment(state[action.payload[0]].equipment[i]?.id ?? "");

				if (currEquip !== undefined) {
					if (currEquip.slotType === player.slotTypes[i]) {
						continue;
					}
					set.equipment[i] = undefined;
				}

				if (equipment === undefined) continue;

				state[action.payload[0]].equipment[i] = {
					id: equipment.id,
					accuracy: i === 0 ? 100 : 0
				};
			}

			state[action.payload[0]].stats = fullToBasicStats(player.maxStats);
		},
		setEquipment: (state: PlayerState[], action: PayloadAction<DoubleIndexed<PossibleItem>>) => {
			let equip = state[action.payload[0]].equipment[action.payload[1]];

			if (action.payload[2] !== undefined) {
				equip = Object.assign(equip ?? {}, action.payload[2]);
			} else {
				equip = undefined;
			}

			state[action.payload[0]].equipment[action.payload[1]] = equip;
		},
		setColor: (state: PlayerState[], action: PayloadAction<Indexed<string>>) => {
			state[action.payload[0]].color = action.payload[1];
		},
		setStats: (state: PlayerState[], action: PayloadAction<Indexed<BasicStats>>) => {
			state[action.payload[0]].stats = action.payload[1];
		},
		setPetMagicHeal: (state: PlayerState[], action: PayloadAction<Indexed<number>>) => {
			state[action.payload[0]].petMagicHeal = action.payload[1];
		},
		enableStatusEffect: (state: PlayerState[], action: PayloadAction<Indexed<StatusEffectType>>) => {
			const set = state[action.payload[0]];
			if (!set.statusEffects.includes(action.payload[1]))
				set.statusEffects.push(action.payload[1]);
			set.statusEffects.sort((a, b) => a - b);

		},
		disableStatusEffect: (state: PlayerState[], action: PayloadAction<Indexed<StatusEffectType>>) => {
			const set = state[action.payload[0]];
			set.statusEffects = set.statusEffects.filter((type) => type !== action.payload[1]);
		},
		setAccuracy: (state: PlayerState[], action: PayloadAction<DoubleIndexed<number>>) => {
			const set = state[action.payload[0]];
			const item = set.equipment[action.payload[1]];
			const accuracy = action.payload[2];

			if (item !== undefined) item.accuracy = accuracy;
		}
	}
})

export function getPlayerFromState(state: PlayerState) {
	return Manager.get<Player>(AssetTypes.Players, state.player)?.value;
}

export function getEquipmentFromState(state: PlayerState): (Equipment | undefined)[] {
	return state.equipment.map((item) => {
		if (item === undefined) return undefined;
		return Manager.get<Equipment>(AssetTypes.Equipment, item.id)?.value;
	})
}

export function hasStatusEffect(statusEffects: StatusEffectType[], type: StatusEffectType) {
	return statusEffects.includes(type);
}

export const { 
	addSet, 
	setPlayer, 
	setEquipment, 
	setStats, 
	removeSet, 
	setColor, 
	setPetMagicHeal, 
	setAccuracy,
	enableStatusEffect, 
	disableStatusEffect,
} = playerSlice.actions;
export default playerSlice.reducer;