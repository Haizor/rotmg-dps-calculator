import { Activate, BulletCreate, Equipment, Proc, Projectile, Stats, StatusEffectType } from "rotmg-utils";
import { AssetTypes, Manager } from "../asset";
import { getEquipmentFromState, getPlayerFromState, hasStatusEffect, PlayerState } from "../features/player/setsSlice";
import { basicToFullStats } from "../util";

type StatsMap = {
	[key: string]: Stats
}

function getStats(base: Stats, map: StatsMap) {
	return Object.values(map).reduce((prev, curr) => {
		return prev.add(curr);
	}, base)
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

export default class DPSCalculator {
	state: PlayerState;
	simulationTime: number = 20;
	simulationCount: number = 20;
	minDef: number = 0;
	maxDef: number = 100;

	providers: DPSProvider[] = [];
	stats: StatsMap = {};

	constructor(state: PlayerState) {
		this.state = state;
	}

	getDPS() {
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
			new WeaponDPSProvider(this.state)
		]
	}

	simulate(def: number): number {
		let providers = this.getProviders();
		let loopProviders = providers;

		let addQueue: DPSProvider[] = [];

		const addProvider = (provider: DPSProvider) => {
			addQueue.push(provider);
		}

		let dps = 0; 

		for (let time = 0; time < this.simulationTime; time += 0.2) {
			loopProviders = loopProviders.filter((provider) => {
				if (!provider.simulate({
					elapsed: 0.2,
					def,
					addProvider,
					statsMap: this.stats
				})) {
					dps += provider.getResult();
					return false;
				}
				return true;
			})

			loopProviders = [...loopProviders, ...addQueue];
			addQueue = [];
		}

		return loopProviders.reduce((prev, curr) => prev + curr.getResult(), dps) / this.simulationTime;
	}
}


interface DPSProvider {
	simulate(data: DPSProviderOptions): boolean;
	getResult(): number;
}

type DPSProviderOptions = {
	elapsed: number;
	def: number;
	addProvider: (provider: DPSProvider) => void;
	statsMap: StatsMap
}

class WeaponDPSProvider implements DPSProvider {
	state: PlayerState;
	dps: number = 0;
	baseStats: Stats;
	equipment: (Equipment | undefined)[];
	attackCountBuffer: number = 0;
	attackCount: number = 0;

	procCooldowns: {
		[key: string]: number;
	} = {}

	constructor(state: PlayerState) {
		this.state = state;
		this.equipment = getEquipmentFromState(state);
		this.baseStats = this.equipment.reduce(((prev, curr) => {
			if (curr === undefined) {
				return prev;
			}
			return prev.add(curr.stats)
		}), basicToFullStats(this.state.stats));
	}

	simulate(options: DPSProviderOptions): boolean {
		const { elapsed, def, statsMap } = options;
		const weapon = this.equipment[0];
		const stats = getStats(this.baseStats, statsMap);
		const attacksPerSecond = hasStatusEffect(this.state.statusEffects, StatusEffectType.Dazed) ? 1.5 : stats.getAttacksPerSecond() * (hasStatusEffect(this.state.statusEffects, StatusEffectType.Berserk) ? 1.25 : 1);
		this.attackCountBuffer += elapsed * attacksPerSecond;
		if (weapon === undefined || !(weapon.hasProjectiles())) return false;
		
		const attacks = weapon.subAttacks.length <= 0 ? [ {...weapon, projectileId: 0 } ] : weapon.subAttacks;

		while (this.attackCountBuffer >= 1) {
			this.processProcs(options);
			for (let attack of attacks) {
				const projectile = weapon.projectiles[attack.projectileId];
				const damage = getAverageDamage(this.state.statusEffects, projectile, stats, def);
				this.dps += damage * attack.numProjectiles ?? weapon.numProjectiles ?? 1;
			}
			this.attackCountBuffer--;
			this.attackCount++;
		}

		return true;
	}

	processProcs(options: DPSProviderOptions) {
		for (let equipIndex in this.equipment) {
			const equip = this.equipment[equipIndex];
			if (equip === undefined) continue;
			for (let procIndex in equip.onShootProcs) {
				const proc = equip.onShootProcs[procIndex] as (Proc & Activate);
				const cooldown = this.procCooldowns[`${equipIndex},${procIndex}`];

				if ((cooldown !== undefined && cooldown > 0)) continue;

				const providerConstructor = ActivateProviders[proc.getName()];
				if (providerConstructor === undefined) continue;
				
				options.addProvider(new providerConstructor(equip, proc));
				this.procCooldowns[`${equipIndex},${procIndex}`] = proc.cooldown
			}
		}
	}

	getResult(): number {
		return this.dps;
	}
}

const NormalStats: Stats = new Stats();
NormalStats.atk = 50;

class BulletCreateProvider implements DPSProvider {
	proc: BulletCreate;
	proj: Projectile | undefined;
	dps: number = 0;

	constructor(equip: Equipment, proc: BulletCreate) {
		if (proc.type !== undefined) {
			const procEquip = Manager.get<Equipment>(AssetTypes.Equipment, proc.type)?.value;
			if (procEquip !== undefined) {
				this.proj = procEquip?.projectiles[0];
			}
		} else this.proj = equip.projectiles[0];
		this.proc = proc;
	}

	simulate(data: DPSProviderOptions): boolean {
		if (this.proj === undefined) return false;

		this.dps += getAverageDamage([], this.proj, NormalStats, data.def)

		return false;
	}
	
	getResult(): number {
		return this.dps;
	}

}

const ActivateProviders: {[key: string]: new (equip: Equipment, proc: any) => DPSProvider} = {
	"BulletCreate": BulletCreateProvider
}