import { BasicTexture, Stats, StatusEffectType } from "rotmg-utils";

const IndexMapper: any = {
	[StatusEffectType.Armored]: 16,
	[StatusEffectType.Berserk]: 50,
	[StatusEffectType.Damaging]: 49,
	[StatusEffectType.Energized]: 60,
	[StatusEffectType.Healing]: 47,
	[StatusEffectType.Inspired]: 62,
	[StatusEffectType.Invulnerable]: 17,
	[StatusEffectType.Speedy]: 0,

	[StatusEffectType["Armor Broken"]]: 55,
	[StatusEffectType.Bleeding]: 46,
	[StatusEffectType.Blind]: 41,
	[StatusEffectType.Confused]: 2,
	[StatusEffectType.Curse]: 58,
	[StatusEffectType.Darkness]: 57,
	[StatusEffectType.Dazed]: 44,
	[StatusEffectType.Drunk]: 43,
	[StatusEffectType.Exposed]: 59,
	[StatusEffectType.Hallucinating]: 42,
	[StatusEffectType.Hexed]: 42,
	[StatusEffectType.Paralyzed]: 53,
	[StatusEffectType.Quiet]: 32,
	[StatusEffectType.Sick]: 39,
	[StatusEffectType.Silenced]: 33,
	[StatusEffectType.Slowed]: 1,
	[StatusEffectType.Stunned]: 45,
	[StatusEffectType.Unstable]: 56,
	[StatusEffectType.Weak]: 34,
}

const BigIndexMapper: any = {
	[StatusEffectType["Pet Stasis"]]: 27
}

export function getTextureForEffect(effect: StatusEffectType) {
	const index = IndexMapper[effect];
	if (index !== -1 && index !== undefined) {
		return new BasicTexture("lofiInterface2", index, false);
	}

	const bigIndex = BigIndexMapper[effect];
	if (bigIndex !== -1 && bigIndex !== undefined) {
		return new BasicTexture("lofiInterfaceBig", bigIndex, false);
	}
	return undefined;
}

const playerStatusEffects = [
	StatusEffectType.Berserk,
	StatusEffectType.Damaging,
	StatusEffectType.Weak,
	StatusEffectType.Dazed
]

export function stripPlayerEffects(effects: StatusEffectType[]) {
	return effects.filter((value) => !playerStatusEffects.includes(value));
}

export function fullToBasicStats(stats: Stats): BasicStats {
	return {
		...stats
	}
}

export function basicToFullStats(object: BasicStats): Stats {
	let stats = new Stats();
	stats = stats.add(object as Stats)
	return stats;
}

export interface BasicStats {
	hp: number;
	mp: number;
	atk: number;
	def: number;
	spd: number;
	dex: number;
	vit: number;
	wis: number;
}