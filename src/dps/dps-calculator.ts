import { AbilityUseDiscount, Activate, BulletCreate, BulletNova, ConditionEffect, ConditionEffectSelf, Equipment, EquipmentSet, HealNova, Lightning, ObjectToss, PoisonGrenade, Proc, Projectile, Shoot, StatBoostSelf, Stats, StatusEffectType, Subattack, Trap, VampireBlast } from "@haizor/rotmg-utils";
import { AssetTypes, Manager } from "../asset";
import { getEquipmentFromState, getPlayerFromState, hasStatusEffect, Item, PlayerState, PossibleItem } from "../features/player/setsSlice";
import { SettingsState } from "../features/settingsSlice";
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

class StatusEffectManager {
	effects: Map<StatusEffectType, number> = new Map();

	addEffect(type: StatusEffectType, duration: number) {
		if (this.effects.has(type) && duration < (this.effects.get(type) as number)) return;
		this.effects.set(type, duration);
	}

	tick(elapsed: number) {
		this.effects.forEach((value, key) => {
			value -= elapsed;
			if (value < 0) {
				this.effects.delete(key);
			}
		});
	}

	getEffects(): StatusEffectType[] {
		return [...this.effects.values()]
	}

	hasEffect(type: StatusEffectType): boolean {
		return this.effects.has(type);
	}
}

const EmptyEffects = new StatusEffectManager();

const EnemyEffects = [
	StatusEffectType["Armor Broken"],
	StatusEffectType.Curse,
	StatusEffectType.Exposed
]

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

type DamageData = {
	minDamage?: number;
	maxDamage?: number;
	armorPiercing: boolean;
}

function getAverageDamage(playerEffects: StatusEffectManager, enemyEffects: StatusEffectManager, data: DamageData, stats: Stats, def: number) {
	let damage = 0;
	let weakened = playerEffects.hasEffect(StatusEffectType.Weak);
	
	if (data.minDamage === undefined || data.maxDamage === undefined) return data.minDamage ?? data.maxDamage ?? 0;
	if (data.minDamage === 0 && data.maxDamage === 0) return 0;

	if (weakened) {
		stats = stats.add(new Stats());
		stats.atk = 0;
	}

	if (enemyEffects.hasEffect(StatusEffectType["Armor Broken"])) {
		def = 0;
	}

	if (enemyEffects.hasEffect(StatusEffectType.Exposed)) {
		def -= 20;
	}

	if (data.armorPiercing) {
		damage = stats.getAttackDamage((data.minDamage + (data.maxDamage - 1)) / 2);
		if (!weakened && playerEffects.hasEffect(StatusEffectType.Damaging)) {
			damage *= 1.25;
		}
		if (enemyEffects.hasEffect(StatusEffectType.Curse)) {
			damage *= 1.25;
		}
		return damage
	} else {
		for (let i = data.minDamage; i < data.maxDamage - 1; i++) {
			let base = stats.getAttackDamage(i);
			if (!weakened && playerEffects.hasEffect(StatusEffectType.Damaging)) {
				base *= 1.25;
			}
			let localDamage = Math.max(base - def, base * 0.10);
			if (enemyEffects.hasEffect(StatusEffectType.Curse)) {
				localDamage *= 1.25;
			}
			damage += localDamage;
		}
		
		return damage / Math.max(((data.maxDamage - 1) - data.minDamage), 1);
	}
}

function processProcs(key: ProcNames, data: ProcDatas, items: PossibleItem[], equipment: (Equipment | undefined)[], options: DPSProviderOptions) {
	for (let equipIndex in equipment) {
		const equip = equipment[equipIndex];
		if (equip === undefined) continue;
		for (let procIndex in equip[key]) {
			const proc = equip[key][procIndex] as (Proc & Activate);

			if (proc.requiredConditions !== StatusEffectType.Nothing) {
				if (options.playerEffects.hasEffect(proc.requiredConditions)) continue;
			}

			if (proc.mustNotWear !== undefined) {
				for (const equip of equipment) {
					if (equip !== undefined && equip.type === proc.mustNotWear) {
						continue;
					}
				}
			}

			if (proc.mustWear !== undefined) {
				let equipped = false;
				for (const equip of equipment) {
					if (equip !== undefined && equip.type === proc.mustWear) {
						equipped = true;
						break;
					}
				}
				if (!equipped) continue;
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

			data[`${equipIndex},${procIndex}`] = localData;
		}
	}
}

export function getStatsFromState(state: PlayerState) {
	const equipment = getEquipmentFromState(state);
	const base = equipment.reduce(((prev, curr) => {
		if (curr === undefined) {
			return prev;
		}
		return prev.add(curr.stats)
	}), basicToFullStats(state.stats));
	const set = EquipmentSet.getTotalStatsForSets(equipment)

	return base.add(set);
}

type DPSData = {
	categorized: {
		[key: string]: number;
	}
	total: number;
}

export default class DPSCalculator {
	state: PlayerState;
	simulationTime: number = 10;
	simulationCount: number = 20;
	simulationStep: number = 0.2;
	minDef: number = 0;
	maxDef: number = 100;

	constructor(state: PlayerState, settings: SettingsState) {
		this.state = state;

		this.simulationCount = settings.simulationCount;
		this.simulationTime = settings.simulationTime;
		this.simulationStep = settings.simulationStep;
	}

	getDPS(): DPSData[] {
		const player = getPlayerFromState(this.state);

		if (player === undefined) return [];
		let dps = [];

		for (let def = this.minDef; def <= this.maxDef; def += Math.floor((this.maxDef - this.minDef) / this.simulationCount)) {
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
		return {
			base: getStatsFromState(this.state)
		}
	}

	simulate(def: number): DPSData {
		let providers = this.getProviders();
		let loopProviders = providers;
		let statsMap = this.getStatsMap()

		let addQueue: DPSProvider[] = [];
		let timedBuffs: TimedBuffs = new TimedBuffs();
		let playerEffects = new StatusEffectManager();
		let enemyEffects = new StatusEffectManager();

		for (const effect of this.state.statusEffects) {
			if (EnemyEffects.includes(effect)) {
				enemyEffects.addEffect(effect, 10000);
			} else {
				playerEffects.addEffect(effect, 10000);
			}
		}

		let procDatas: ProcDatas = {};

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

		for (let time = 0; time < this.simulationTime; time += this.simulationStep) {
			loopProviders = loopProviders.filter((provider) => {
				if (!provider.simulate({
					elapsed: this.simulationStep,
					def,
					addProvider,
					statsMap,
					timedBuffs,
					playerEffects,
					enemyEffects,
					procDatas
				})) {
					const result = provider.getResult();
					data.total += result;
					addToCategory(provider.getName(), result);
					return false;
				}
				return true;
			})

			for (const key of Object.keys(procDatas)) {
				procDatas[key].cooldown -= this.simulationStep;
			}
			timedBuffs.tick(this.simulationStep);

			playerEffects.tick(this.simulationStep);
			enemyEffects.tick(this.simulationStep);

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
	playerEffects: StatusEffectManager;
	enemyEffects: StatusEffectManager;
	procDatas: ProcDatas;
}

type WeaponAttack = Equipment | Subattack;

class WeaponDPSProvider implements DPSProvider {
	state: PlayerState;
	dps: number = 0;
	equipment: (Equipment | undefined)[];

	attackCount: number = 0;
	attackCountsBuffer: number[] = [];

	constructor(state: PlayerState) {
		this.state = state;
		this.equipment = getEquipmentFromState(state);
	}

	simulate(options: DPSProviderOptions): boolean {
		if (this.state.equipment[0] === undefined || this.state.equipment[0].accuracy === 0) return false;

		const weapon = this.equipment[0];

		if (weapon === undefined || !(weapon.hasProjectiles())) return false;

		const { elapsed, def, statsMap, procDatas, addProvider, playerEffects, enemyEffects } = options;

		const stats = getStats(statsMap);
		
		const attacks = weapon.subAttacks.length <= 0 ? [ {...weapon, projectileId: 0 } ] : weapon.subAttacks;

		if (!options.playerEffects.hasEffect(StatusEffectType.Stunned))
			for (const i in attacks) {
				let attack = attacks[i];
				let aps = this.getAttacksPerSecond(attack, stats, playerEffects);
				if (this.attackCountsBuffer[i] === undefined) this.attackCountsBuffer[i] = 0;
				this.attackCountsBuffer[i] += elapsed * aps;

				while (this.attackCountsBuffer[i] >= 1) {
					processProcs("onShootProcs", procDatas, this.state.equipment, this.equipment, options);

					const projectile = weapon.projectiles[attack.projectileId];
					const damage = getAverageDamage(playerEffects, enemyEffects, projectile, stats, def);
	
					this.dps += damage * (attack.numProjectiles ?? weapon.numProjectiles ?? 1) * (this.state.equipment[0]?.accuracy ?? 100) / 100;
					if (projectile.conditionEffect !== undefined) {
						playerEffects.addEffect(projectile.conditionEffect.type, projectile.conditionEffect.duration);
					}
	
					if (projectile.conditionEffect !== undefined && projectile.conditionEffect.type === StatusEffectType.Bleeding) {
						addProvider(new BleedEffectProvider(this.state.equipment[0] as Item, 3, 100))
					}
					
					this.attackCountsBuffer[i]--;
					this.attackCount++;
				}
			}

		//Old calc damage for shortbow: 14 - main, 3 - side
		
		

		return true;
	}

	getAttacksPerSecond(weapon: WeaponAttack, stats: Stats, effects: StatusEffectManager): number {
		let aps = 0;
	
		aps = stats.getAttacksPerSecond() * (effects.hasEffect(StatusEffectType.Berserk) ? 1.25 : 1);
		if (effects.hasEffect(StatusEffectType.Dazed)) aps = 1.5;
		aps *= weapon.rateOfFire;

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
	abilityUses: number = 0;
	mpCost: number = 0;

	constructor(state: PlayerState) {
		this.state = state;
		this.equipment = getEquipmentFromState(state);
		this.mpCost = this.getMpCost();
	}

	getMpCost() {
		const ability = this.equipment[1];
		if (ability === undefined) return 0;
		let mpCost = ability.mpEndCost ?? ability.mpCost;
		for (const equip of this.equipment) {
			if (equip === undefined) continue;
			for (const activate of equip.activateOnEquips) {
				if (activate instanceof AbilityUseDiscount) {
					mpCost *= activate.multiplier;
				}
			}
		}
		return mpCost;
	}

	simulate(data: DPSProviderOptions): boolean {
		if (this.state.equipment[1] === undefined || this.state.equipment[1].accuracy === 0) return false;

		const { statsMap, elapsed, procDatas } = data;
		const ability = this.equipment[1];

		if (ability === undefined) return false;
		this.abilityUses += (elapsed / ability.cooldown);
		
		const stats = getStats(statsMap);

		if (this.mana === -1) {
			this.mana = stats.mp;
		}
		
		this.mana = Math.min(stats.mp, this.mana + ((stats.wis + mpHealToWis[this.state.petMagicHeal]) * mpRatio));

		while (this.abilityUses > 0 && this.mana > this.mpCost) {
			this.useAbility(data, ability);
			processProcs("abilityProcs", procDatas, this.state.equipment, this.equipment, data);
			this.abilityUses--;
			this.mana -= this.mpCost;
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
NormalStats.atk = 25;

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

export abstract class TimedActivateProvider<T> extends ActivateProvider<T> {
	uses: number = 0;
	totalTime: number = 0;
	
	simulate(data: DPSProviderOptions): boolean {
		const { elapsed } = data;

		this.uses += (1 / this.getInterval()) * elapsed;

		while (this.uses >= 1) {
			this.run(data);
			this.uses--;
		}
		
		this.totalTime += elapsed;
	
		if (this.totalTime > this.getDuration()) {
			return false;
		}

		return true;
	}
	
	abstract run(data: DPSProviderOptions): void;

	abstract getDuration(): number;
	abstract getInterval(): number;
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
		const projectile = this.equip.projectiles[0];
		for (let i = 0; i < this.equip.numProjectiles; i++) {
			this.dps += getAverageDamage(EmptyEffects, data.enemyEffects, projectile, NormalStats, data.def);
			if (projectile.conditionEffect !== undefined) {
				data.enemyEffects.addEffect(projectile.conditionEffect.type, projectile.conditionEffect.duration);
			}
		}
	}
}

class BulletNovaProvider extends OneTimeActivateProvider<BulletNova> {
	run(data: DPSProviderOptions): void {
		for (let i = 0; i < this.activate.numShots; i++) {
			this.dps += getAverageDamage(EmptyEffects, data.enemyEffects, this.equip.projectiles[0], NormalStats, data.def);
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
		this.dps += getAverageDamage(EmptyEffects, data.enemyEffects, this.proj, NormalStats, data.def);
		if (this.proj.conditionEffect !== undefined) {
			data.enemyEffects.addEffect(this.proj.conditionEffect.type, this.proj.conditionEffect.duration);
		}
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
		this.dps += getAverageDamage(EmptyEffects, data.enemyEffects, {
			armorPiercing: false,
			maxDamage: this.activate.totalDamage,
			minDamage: this.activate.totalDamage
		}, NormalStats, data.def);
		data.enemyEffects.addEffect(this.activate.condEffect, this.activate.condDuration)
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
		const stats = getStats(data.statsMap);
		data.playerEffects.addEffect(this.activate.effect, this.activate.getDuration(stats.wis));
	}
}

class BleedEffectProvider implements DPSProvider {
	duration: number;
	damage: number;
	item: Item;

	constructor(item: Item, duration: number, damage: number) {
		this.item = item;
		this.duration = duration;
		this.damage = damage;
	}

	simulate(data: DPSProviderOptions): boolean {
		return false;
	}

	getResult(): number {
		return Math.floor(this.damage * ((this.item.accuracy ?? 100) / 100));
	}

	getName(): string {
		return "Bleed";
	}
}

class LightningProvider extends OneTimeActivateProvider<Lightning> {
	run(data: DPSProviderOptions): void {
		const stats = getStats(data.statsMap);
		const damage = this.activate.getDamage(stats.wis)
		
		this.dps += getAverageDamage(EmptyEffects, data.enemyEffects, {
			armorPiercing: false,
			minDamage: damage,
			maxDamage: damage
		}, NormalStats, data.def);
	}
}

class HealNovaProvider extends OneTimeActivateProvider<HealNova> {
	run(data: DPSProviderOptions): void {
		if (this.activate.damage === undefined) return;

		this.dps += getAverageDamage(EmptyEffects, data.enemyEffects, {
			armorPiercing: false,
			minDamage: this.activate.damage,
			maxDamage: this.activate.damage
		}, NormalStats, data.def);
	}
}

class ObjectTossProvider extends OneTimeActivateProvider<ObjectToss> {
	run(data: DPSProviderOptions): void {
		const provider = ObjectTossProviders[this.activate.objectId];
		if (provider !== undefined) {
			data.addProvider(new provider(this.item, this.equip, this.activate));
		}
	}
}

class DivinityProvider extends OneTimeActivateProvider<ObjectToss> {
	private static DATA: DamageData = {
		armorPiercing: true,
		minDamage: 600,
		maxDamage: 800
	}

	run(data: DPSProviderOptions): void {
		const stats = getStats(data.statsMap);
		this.dps += getAverageDamage(data.playerEffects, data.enemyEffects, DivinityProvider.DATA, stats, data.def);
	}
}

class EscutcheonProvider extends OneTimeActivateProvider<ObjectToss> {
	private static DATA: DamageData = {
		armorPiercing: true,
		minDamage: 1000,
		maxDamage: 1200
	}

	run(data: DPSProviderOptions): void {
		this.dps += getAverageDamage(EmptyEffects, data.enemyEffects, EscutcheonProvider.DATA, NormalStats, data.def);
	}
}

class SporousSprayProvider extends TimedActivateProvider<ObjectToss> {
	private static DATA: DamageData = {
		armorPiercing: false,
		minDamage: 1000,
		maxDamage: 1000
	}

	run(data: DPSProviderOptions): void {
		this.dps += getAverageDamage(EmptyEffects, data.enemyEffects, SporousSprayProvider.DATA, NormalStats, data.def);
	}

	getDuration(): number {
		return 4.8;
	}

	getInterval(): number {
		return 1.2;
	}
}

class GenesisSpellProvider extends TimedActivateProvider<ObjectToss> {
	private static DATA: DamageData = {
		armorPiercing: false,
		minDamage: 250,
		maxDamage: 250
	}

	run(data: DPSProviderOptions): void {
		this.dps += getAverageDamage(EmptyEffects, data.enemyEffects, GenesisSpellProvider.DATA, NormalStats, data.def);
	}

	getDuration(): number {
		return 4;
	}

	getInterval(): number {
		return 0.4;
	}

}

class ChaoticScriptureProvider extends OneTimeActivateProvider<ObjectToss> {
	private static DATA: DamageData = {
		armorPiercing: true,
		minDamage: 1800,
		maxDamage: 2200
	}

	run(data: DPSProviderOptions): void {
		this.dps += getAverageDamage(EmptyEffects, data.enemyEffects, ChaoticScriptureProvider.DATA, NormalStats, data.def);
	}
}

const ObjectTossProviders: {[key: string]: new (item: PossibleItem, equip: Equipment, proc: any) => ActivateProvider<ObjectToss>} = {
	"Divinity Effect": DivinityProvider,
	"Oryx's Escutcheon Effect 1": EscutcheonProvider,
	"Killer Shroom": SporousSprayProvider,
	"Genesis Spell Portal 1": GenesisSpellProvider,
	"Genesis Spell Portal 2": GenesisSpellProvider,
	"Genesis Spell Portal 3": GenesisSpellProvider,
	"Genesis Spell Portal 4": GenesisSpellProvider,
	"Chaotic Scripture Effect": ChaoticScriptureProvider
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
	"ConditionEffectAura": ConditionEffectProvider,
	"ObjectToss": ObjectTossProvider,
	"Lightning": LightningProvider,
	"HealNova": HealNovaProvider
}

export function isActivateCalculated(key: string) {
	return ActivateProviders[key] !== undefined;
}