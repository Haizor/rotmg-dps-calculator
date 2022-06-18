import { Activate, BulletCreate, BulletNova, ConditionEffect, ConditionEffectSelf, Equipment, EquipmentSet, PoisonGrenade, Proc, Projectile, Shoot, StatBoostSelf, Stats, StatusEffectType, Trap, VampireBlast } from "@haizor/rotmg-utils";
import { AssetTypes, Manager } from "../asset";
import { getEquipmentFromState, getPlayerFromState, hasStatusEffect, Item, PlayerState, PossibleItem } from "../features/player/setsSlice";
import { basicToFullStats } from "../util";

type StatsMap = {
	[key: string]: Stats
}

type ProcDatas = {
	[key: string]: {
		cooldown: number;
		count: number;
	}
}

type ProcNames = "onShootProcs" | "abilityProcs" | "onHitProcs";

type TimedBuff = {
	time: number;
	buff: Buff;
}

interface Buff {
	onApply(): void;
	onRemove(): void;
}

class TimedBuffs {
	buffs: {
		[key: string]: TimedBuff;
	} = {};

	addBuff(key: string, buff: Buff, time: number) {
		if (this.buffs[key]) {
			this.buffs[key].time = time;
			return;
		}

		this.buffs[key] = {
			buff, time
		};
		buff.onApply();
	}

	tick(elapsed: number) {
		for (const key of Object.keys(this.buffs)) {
			if ((this.buffs[key].time -= elapsed) < 0) {
				this.buffs[key].buff.onRemove();
				delete this.buffs[key];
			}
		}
	}
}

const mpHealToWis: any = {
    0: 0,
    1: 1.7,
    2: 1.8,
    3: 1.9,
    4: 2.1,
    5: 2.3,
    6: 2.3,
    7: 2.4,
    8: 2.5,
    9: 2.6,
    10: 2.7,
    11: 2.8,
    12: 2.9,
    13: 3.0,
    14: 3.1,
    15: 3.2,
    16: 3.2,
    17: 3.3,
    18: 3.4,
    19: 3.5,
    20: 7.1,
    21: 7.3,
    22: 7.4,
    23: 7.6,
    24: 7.7,
    25: 7.9,
    26: 8.0,
    27: 8.2,
    28: 12.6,
    29: 12.8,
    30: 13.1,
    31: 13.3,
    32: 13.6,
    33: 13.8,
    34: 18.8,
    35: 19.1,
    36: 19.4,
    37: 19.7,
    38: 20.0,
    39: 25.3,
    40: 25.7,
    41: 26.2,
    42: 26.6,
    43: 32.5,
    44: 33.1,
    45: 33.6,
    46: 40.1,
    47: 41.0,
    48: 41.9,
    49: 49.0,
    50: 50.2,
    51: 51.1,
    52: 58.6,
    53: 59.7,
    54: 60.9,
    55: 69.0,
    56: 70.2,
    57: 78.5,
    58: 79.8,
    59: 81.2,
    60: 90.1,
    61: 91.5,
    62: 100.7,
    63: 102.3,
    64: 112.0,
    65: 113.8,
    66: 123.1,
    67: 132.5,
    68: 133.7,
    69: 143.4,
    70: 144.7,
    71: 155.3,
    72: 166.1,
    73: 168.4,
    74: 179.7,
    75: 191.4,
    76: 196.1,
    77: 210.6,
    78: 225.6,
    79: 242.0,
    80: 248.6,
    81: 265.2,
    82: 282.6,
    83: 300.9,
    84: 320.1,
    85: 328.6,
    86: 340.4,
    87: 352.1,
    88: 363.8,
    89: 375.6,
    90: 387.3,
    91: 411.2,
    92: 436.6,
    93: 463.7,
    94: 505.9,
    95: 537.2,
    96: 570.8,
    97: 606.9,
    98: 645.8,
    99: 703.8,
    100: 750.0
}

function getStats(map: StatsMap) {
	return Object.values(map).reduce((prev, curr) => {
		return prev.add(curr);
	}, new Stats())
}

function getAverageDamage(statusEffects: StatusEffectType[], projectile: Projectile, stats: Stats, def: number) {
	let damage = 0;
	if (projectile.minDamage === undefined || projectile.maxDamage === undefined) return projectile.minDamage ?? projectile.maxDamage ?? 0;

	if (hasStatusEffect(statusEffects, StatusEffectType["Armor Broken"])) {
		def = 0;
	}

	if (hasStatusEffect(statusEffects, StatusEffectType.Exposed)) {
		def -= 20;
	}

	if (projectile.armorPiercing) {
		damage = (projectile.maxDamage + projectile.minDamage) / 2;
		if (hasStatusEffect(statusEffects, StatusEffectType.Curse)) {
			damage *= 1.25;
		}
		return damage
	} else {
		for (let i = projectile.minDamage; i < projectile.maxDamage; i++) {
			let base = stats.getAttackDamage(i);
			if (hasStatusEffect(statusEffects, StatusEffectType.Damaging)) {
				base *= 1.25;
			}
			let localDamage = Math.max(base - def, base * 0.10);
			if (hasStatusEffect(statusEffects, StatusEffectType.Curse)) {
				localDamage *= 1.25;
			}
			damage += localDamage;
		}
		
		return damage / (projectile.maxDamage - projectile.minDamage);
	}
}

function processProcs(key: ProcNames, data: ProcDatas, items: PossibleItem[], equipment: (Equipment | undefined)[], options: DPSProviderOptions) {
	for (let equipIndex in equipment) {
		const equip = equipment[equipIndex];
		if (equip === undefined) continue;
		for (let procIndex in equip[key]) {
			const proc = equip[key][procIndex] as (Proc & Activate);

			if (proc.requiredConditions !== StatusEffectType.Nothing) {
				if (options.statusEffects.indexOf(proc.requiredConditions) === -1) continue;
			}

			const localData = data[`${equipIndex},${procIndex}`] ?? {
				cooldown: 0,
				count: 0
			}

			if (localData.cooldown > 0) continue;

			localData.count += proc.proc;

			if (localData.count < 1) continue;

			const providerConstructor = ActivateProviders[proc.getName()];
			if (providerConstructor === undefined) continue;
			
			options.addProvider(new providerConstructor(items[equipIndex], equip, proc));
			localData.cooldown = proc.cooldown
			localData.count--;
		}
	}
}

type DPSData = {
	categorized: {
		[key: string]: number;
	}
	total: number;
}

export default class DPSCalculator {
	state: PlayerState;
	simulationTime: number = 20;
	simulationCount: number = 20;
	minDef: number = 0;
	maxDef: number = 100;

	constructor(state: PlayerState) {
		this.state = state;
	}

	getDPS(): DPSData[] {
		const player = getPlayerFromState(this.state);

		if (player === undefined) return [];
		let dps = [];

		for (let def = this.minDef; def <= this.maxDef; def += (this.maxDef - this.minDef) / this.simulationCount) {
			dps[def] = (this.simulate(def));
		}

		return dps;
	}

	getProviders(): DPSProvider[] {
		return [
			new WeaponDPSProvider(this.state),
			new AbilityDPSProvider(this.state)
		]
	}

	getStatsMap(): StatsMap {
		const equipment = getEquipmentFromState(this.state);

		return {
			base: equipment.reduce(((prev, curr) => {
				if (curr === undefined) {
					return prev;
				}
				return prev.add(curr.stats)
			}), basicToFullStats(this.state.stats)),
			set: EquipmentSet.getTotalStatsForSets(equipment)
		}
	}

	simulate(def: number): DPSData {
		let providers = this.getProviders();
		let loopProviders = providers;
		let statsMap = this.getStatsMap()

		let addQueue: DPSProvider[] = [];
		let timedBuffs: TimedBuffs = new TimedBuffs();
		let statusEffects: StatusEffectType[] = [];

		const addProvider = (provider: DPSProvider) => {
			addQueue.push(provider);
		}

		let data: DPSData = {
			total: 0,
			categorized: {}
		}

		const addToCategory = (name: string, value: number) => {
			if (!data.categorized[name]) {
				data.categorized[name] = 0;
			}

			data.categorized[name] += value / this.simulationTime;
		}

		for (let time = 0; time < this.simulationTime; time += 0.2) {
			loopProviders = loopProviders.filter((provider) => {
				if (!provider.simulate({
					elapsed: 0.2,
					def,
					addProvider,
					statsMap,
					timedBuffs,
					statusEffects
				})) {
					const result = provider.getResult();
					data.total += result;
					addToCategory(provider.getName(), result);
					return false;
				}
				return true;
			})

			timedBuffs.tick(0.2);

			loopProviders = [...loopProviders, ...addQueue];
			addQueue = [];
		}

		for (const provider of loopProviders) {
			const result = provider.getResult();
			data.total += result;
			addToCategory(provider.getName(), result);
		}

		data.total /= this.simulationTime;

		return data;
	}
}


export interface DPSProvider {
	simulate(data: DPSProviderOptions): boolean;
	getResult(): number;
	getName(): string;
}

type DPSProviderOptions = {
	elapsed: number;
	def: number;
	addProvider: (provider: DPSProvider) => void;
	statsMap: StatsMap;
	timedBuffs: TimedBuffs;
	statusEffects: StatusEffectType[];
}

class WeaponDPSProvider implements DPSProvider {
	state: PlayerState;
	dps: number = 0;
	equipment: (Equipment | undefined)[];
	attackCountBuffer: number = 0;
	attackCount: number = 0;

	procDatas: ProcDatas = {};

	constructor(state: PlayerState) {
		this.state = state;
		this.equipment = getEquipmentFromState(state);
	}

	simulate(options: DPSProviderOptions): boolean {
		const { elapsed, def, statsMap } = options;
		const weapon = this.equipment[0];

		if (weapon === undefined || !(weapon.hasProjectiles())) return false;

		const stats = getStats(statsMap);
		let attacksPerSecond = this.getAttacksPerSecond(weapon, stats);
		
		this.attackCountBuffer += elapsed * attacksPerSecond;
		
		const attacks = weapon.subAttacks.length <= 0 ? [ {...weapon, projectileId: 0 } ] : weapon.subAttacks;

		while (this.attackCountBuffer >= 1) {
			processProcs("onShootProcs", this.procDatas, this.state.equipment, this.equipment, options);
			for (let attack of attacks) {
				const projectile = weapon.projectiles[attack.projectileId];
				const damage = getAverageDamage(this.state.statusEffects, projectile, stats, def);
				this.dps += damage * (attack.numProjectiles ?? weapon.numProjectiles ?? 1) * (this.state.equipment[0]?.accuracy ?? 100) / 100;
			}
			this.attackCountBuffer--;
			this.attackCount++;
		}

		return true;
	}

	getAttacksPerSecond(weapon: Equipment, stats: Stats): number {
		let aps = 0;
		if (hasStatusEffect(this.state.statusEffects, StatusEffectType.Dazed)) aps = 1.5;
		aps = stats.getAttacksPerSecond() * (hasStatusEffect(this.state.statusEffects, StatusEffectType.Berserk) ? 1.25 : 1) * weapon.rateOfFire;

		if (weapon.burstCount === undefined || weapon.burstDelay === undefined || weapon.burstMinDelay === undefined) return aps;

		const currBurstDelay = Math.min(Math.max(weapon.burstDelay - ((weapon.burstDelay - weapon.burstMinDelay) / 100 * stats.dex), weapon.burstMinDelay), weapon.burstDelay);

		return (weapon.burstCount / currBurstDelay)

	}

	getResult(): number {
		return this.dps;
	}

	getName(): string {
		return this.equipment[0]?.getDisplayName() ?? "Weapon"
	}
}

const mpRatio = 0.012;

class AbilityDPSProvider implements DPSProvider {
	mana: number = -1;
	state: PlayerState;
	equipment: (Equipment | undefined)[];
	procCooldowns: ProcDatas = {};
	abilityUses: number = 0;

	constructor(state: PlayerState) {
		this.state = state;
		this.equipment = getEquipmentFromState(state);
	}

	simulate(data: DPSProviderOptions): boolean {
		const { statsMap, elapsed } = data;
		const ability = this.equipment[1];

		if (ability === undefined) return false;
		this.abilityUses += (elapsed / ability.cooldown);
		
		const stats = getStats(statsMap);

		if (this.mana === -1) {
			this.mana = stats.mp;
		}

		const mpCost = ability.mpEndCost ?? ability.mpCost;
		
		this.mana = Math.min(stats.mp, this.mana + ((stats.wis + mpHealToWis[this.state.petMagicHeal]) * mpRatio));

		while (this.abilityUses > 0 && this.mana > mpCost) {
			this.useAbility(data, ability);
			processProcs("abilityProcs", this.procCooldowns, this.state.equipment, this.equipment, data);
			this.abilityUses--;
			this.mana -= mpCost;
		}

		return true;
	}

	useAbility(data: DPSProviderOptions, ability: Equipment) {
		for (let activate of ability.activates) {
			const providerConstructor = ActivateProviders[activate.getName()];
			if (providerConstructor === undefined) continue;

			data.addProvider(new providerConstructor(this.state.equipment[1] as Item, ability, activate));
		}
	}

	getResult(): number {
		return 0;
	}

	getName(): string {
		return this.equipment[1]?.getDisplayName() ?? "Ability";
	}
}

const NormalStats: Stats = new Stats();
NormalStats.atk = 50;

export abstract class ActivateProvider<T> implements DPSProvider {
	activate: T;
	item: PossibleItem;
	equip: Equipment;
	dps: number = 0;

	constructor(item: PossibleItem, equip: Equipment, activate: T) {
		this.item = item; 
		this.equip = equip;
		this.activate = activate;
	}

	abstract simulate(data: DPSProviderOptions): boolean;

	getResult(): number {
		return Math.floor(this.dps * (this.item?.accuracy ?? 100) / 100);
	}

	getName(): string {
		return this.equip.getDisplayName();
	}
}

export abstract class OneTimeActivateProvider<T> extends ActivateProvider<T> {
	abstract run(data: DPSProviderOptions): void;

	simulate(data: DPSProviderOptions): boolean {
		this.run(data);
		return false;
	}
}

class ShootProvider extends OneTimeActivateProvider<Shoot> {
	run(data: DPSProviderOptions): void {
		for (let i = 0; i < this.equip.numProjectiles; i++) {
			this.dps += getAverageDamage([], this.equip.projectiles[0], NormalStats, data.def);
		}
	}
}

class BulletNovaProvider extends OneTimeActivateProvider<BulletNova> {
	run(data: DPSProviderOptions): void {
		for (let i = 0; i < this.activate.numShots; i++) {
			this.dps += getAverageDamage([], this.equip.projectiles[0], NormalStats, data.def);
		}
	}
}

class BulletCreateProvider extends OneTimeActivateProvider<BulletCreate> {
	proj: Projectile | undefined;

	constructor(item: PossibleItem, equip: Equipment, activate: BulletCreate) {
		super(item, equip, activate);
		if (activate.type !== undefined) {
			const procEquip = Manager.get<Equipment>(AssetTypes.Equipment, activate.type)?.value;
			if (procEquip !== undefined) {
				this.proj = procEquip?.projectiles[0];
			}
		} else this.proj = equip.projectiles[0];
	}

	run(data: DPSProviderOptions): void {
		if (this.proj === undefined) return;

		this.dps += getAverageDamage([], this.proj, NormalStats, data.def);
	}
}

class PoisonGrenadeProvider extends ActivateProvider<PoisonGrenade> {
	time: number = 0;

	simulate(data: DPSProviderOptions): boolean {
		if (this.time === 0) {
			this.dps += this.activate.impactDamage;
		}

		this.dps += ((this.activate.totalDamage / this.activate.duration) * data.elapsed);

		this.time += data.elapsed;

		return this.time < this.activate.duration;
	}
}

class TrapProvider extends OneTimeActivateProvider<Trap> {
	run(data: DPSProviderOptions): void {
		this.dps += this.activate.totalDamage;
	}
}

class VampireBlastProvider extends OneTimeActivateProvider<VampireBlast> {
	run(data: DPSProviderOptions): void {
		const stats = getStats(data.statsMap);

		const damage = this.activate.getDamage(stats.wis);

		this.dps += Math.max(damage - (data.def - this.activate.ignoreDef), damage * 0.1);
	}
}

class StatBoostProvider extends OneTimeActivateProvider<StatBoostSelf> {
	run(data: DPSProviderOptions): void {
		const {  statsMap, timedBuffs } = data;

		const baseStats = getStats(statsMap);
		const stats = new Stats();
		stats[Stats.convertStatName(this.activate.stat)] = this.activate.getAmount(baseStats.wis);
		const duration = this.activate.getDuration(baseStats.wis)

		timedBuffs.addBuff(this.getStatKey(), {
			onApply: () => {statsMap[this.getStatKey()] = stats},
			onRemove: () => {delete statsMap[this.getStatKey()]}
		}, duration);
	}

	getStatKey(): string {
		return this.equip.type + "+" + Stats.convertStatName(this.activate.stat);
	}

	getResult(): number {
		return 0;
	}
}

class ConditionEffectProvider extends OneTimeActivateProvider<ConditionEffectSelf> {
	run(data: DPSProviderOptions): void {
		data.timedBuffs.addBuff(this.activate.effect.toString(), {
			onApply: () => data.statusEffects.push(this.activate.effect),
			onRemove: () => {
				const index = data.statusEffects.indexOf(this.activate.effect);
				if (index !== -1) delete data.statusEffects[index]
			}
		}, this.activate.duration)
	}
}


const ActivateProviders: {[key: string]: new (item: PossibleItem, equip: Equipment, proc: any) => DPSProvider} = {
	"Shoot": ShootProvider,
	"ShurikenAbility": ShootProvider,
	"BulletCreate": BulletCreateProvider,
	"BulletNova": BulletNovaProvider,
	"PoisonGrenade": PoisonGrenadeProvider,
	"StatBoostSelf": StatBoostProvider,
	"StatBoostAura": StatBoostProvider,
	"VampireBlast": VampireBlastProvider,
	"Trap": TrapProvider,
	"ConditionEffectSelf": ConditionEffectProvider,
	"ConditionEffectAura": ConditionEffectProvider
}

export function isActivateCalculated(key: string) {
	return ActivateProviders[key] !== undefined;
}