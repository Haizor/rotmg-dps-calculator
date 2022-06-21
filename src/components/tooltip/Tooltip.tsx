
import React, { CSSProperties } from "react";
import { Activate, BulletNova, ConditionEffectAura, ConditionEffectSelf, Decoy, EffectBlast, Equipment, EquipmentSet, HealNova, IncrementStat, Item, PoisonGrenade, Projectile, StatBoostAura, StatNames, Stats, StatusEffectType, Trap, VampireBlast } from "@haizor/rotmg-utils";
import { isActivateCalculated } from "../../dps/dps-calculator";
import { getTextureForEffect } from "../../util";
import SpriteComponent from "../SpriteComponent"
import styles from "./Tooltip.module.css"

type Props = {
	item: Item;
	x: number;
	y: number;
	player?: Player;
}

type Player = {
	stats: Stats;
}

type State = {
	x: number;
	y: number;
	scale: number;
}

type StarLines = {
	[key: string]: boolean[]
}

type ActivateRendererTextType = "normal" | "value" | "wis" | "linebreak"
type ActivateRendererText = { text?: string, type: ActivateRendererTextType, noMarginLeft?: boolean, noMarginRight?: boolean } | string
type ActivateRenderer<T> = (activate: T, player: Player | undefined) => ActivateRendererText[]

export default class Tooltip extends React.Component<Props, State> {
	static activateRenderers: Map<string, ActivateRenderer<any>> = new Map();
	static starLines: StarLines = {};

	tooltipDiv: React.RefObject<HTMLDivElement>

	constructor(props: Props) {
		super(props);
		this.state = { x: 0, y: 0, scale: 1 }
		this.tooltipDiv = React.createRef();
	}

	getColor(): string {
		if (this.props.item.data.tier === "UT") {
			return "#B33CFE";
		} else if (this.props.item.data.tier === "ST") {
			return "#ce8e13"
		}
		return "white"
	}

	getBorderURL(): string {
		if (this.props.item.data.tier === "UT") {
			return "https://haizor.net/rotmg/static/img/tooltip/ut-border.png";
		} else if (this.props.item.data.tier === "ST") {
			return "https://haizor.net/rotmg/static/img/tooltip/st-border.png"
		}
		return "https://haizor.net/rotmg/static/img/tooltip/border.png"
	}

	getItemTierText(): string {
		const tier = this.getItemData().tier;
		return (typeof(tier) === "number" ? "T" : "") + tier;
	}

	getItemTierCSS(): CSSProperties {
		return {
			fontSize: "36px",
			color: this.getColor()
		}
	}

	hasProjectile(): boolean {
		return this.getItemData().hasProjectiles();
	}

	isSoulbound(): boolean {
		return this.getItemData().soulbound;
	}

	getItemData(): Equipment {
		return this.props.item.data;
	}

	getUsableClassText(): string {
		return "Wizard"
	}

	getDamageText(): string {
		const data = this.getItemData();
		if (data.subAttacks.length > 0) {
			const min = data.projectiles.reduce((prev, curr) => Math.min(prev, curr.minDamage ?? Number.MAX_SAFE_INTEGER), Number.MAX_SAFE_INTEGER);
			const max = data.projectiles.reduce((prev, curr) => Math.max(prev, curr.maxDamage ?? Number.MIN_SAFE_INTEGER), Number.MIN_SAFE_INTEGER);

			return min + "-" + max;
		}
		return data.projectiles[0].minDamage + "-" + data.projectiles[0].maxDamage;
	}

	getDamageTextStyle(): CSSProperties {
		return {
			color: "#FFFF8F",

		}
	}
	
	getWis() {
		return this.props.player?.stats.wis ?? 0;
	}

	renderSubAttacks() {
		const { subAttacks, projectiles } = this.getItemData();
		if (subAttacks.length <= 1) return null;

		return (
			<>
				{this.renderProperty(undefined, "Shoots multiple bullets")}
				{subAttacks.map((attack, index) => {
					const proj: Projectile = projectiles[attack.projectileId];
					return (
						<>
							{this.renderProperty(undefined, `Bullet ${index + 1} (${proj.minDamage}-${proj.maxDamage}):`)}
							{attack.numProjectiles > 1 && this.renderProperty("Shots", attack.numProjectiles)}
							{this.renderProperty("Range", proj.getRange())}
							{attack.rateOfFire !== 1 && this.renderProperty("Rate of Fire", `${(attack.rateOfFire * 100)}%`)}
							{proj.boomerang && this.renderProperty(undefined, "Shots boomerang")}
							{proj.multiHit && this.renderProperty(undefined, "Shots hit multple targets")}
							{proj.passesCover && this.renderProperty(undefined, "Shots pass through obstacles")}
							{proj.armorPiercing && this.renderProperty(undefined, "Ignores defense of target")}
						</>
					)
				})}
			</>
		)
	}

	renderActivate(activate: Activate): React.ReactNode {
		const renderer = Tooltip.activateRenderers.get(activate.getName());
		if (renderer !== undefined) {
			return <div className={styles.propertyLine}>
				{renderer(activate, this.props.player).map((text) => {
					if (typeof(text) === "string") {
						if (text !== "") return <div className={styles.propertyName}>{text}</div>
					} else {
						if (text.type === "linebreak") return <div className={styles.break}></div>
						const style: CSSProperties = {
							marginLeft: text.noMarginLeft ? "0px" : "",
							marginRight: text.noMarginRight ? "0px" : "",
						}
						let className = "";
						switch(text.type) {
							case "value":
								className += styles.propertyValue;
								break;
							case "wis":
								className += styles.propertyWis;
								break;
							default: 
								className += styles.propertyName;
								break;
						}
						return <div style={style} className={className}>{text.text}</div>
					}
					return null;
				})}
				{isActivateCalculated(activate.getName()) && <SpriteComponent size={16} texture={getTextureForEffect(StatusEffectType.Stunned)}/>}
			</div>
		}
		return null;
	}

	renderSet() {
		const data = this.getItemData();
		if (data.set === undefined) return null;

		const renderActivates = (activate: Activate[], name: string) => {
			if (activate.length === 0) return null;

			return (
				<div className={styles.setStats}>
					<div className={styles.smallDarkText} style={{color: this.getColor()}}>{name}</div>
					{this.renderStats(EquipmentSet.statsFromActivates(activate))}
				</div>
			)
		}

		return <>
			<div className={styles.splitter} style={{backgroundColor: this.getColor()}} />
			<div className={styles.propertyName} style={{color: this.getColor()}}>{data.set.id}</div>
			<div className={styles.setStatsContainer}>
				{renderActivates(data.set.activateOnEquip2, "2 Pieces")}
				{renderActivates(data.set.activateOnEquip3, "3 Pieces")}
				{renderActivates(data.set.activateOnEquipAll, "Full Set")}
			</div>
		</>
	}

	renderDescription() {
		const description = this.getItemData().description;
		if (description === undefined) return null;
		
		return description.split("\\n").map((line) => {
			return <>{line}<br/></>
		})
	}

	renderProperty(name: string | undefined, value: any, star: boolean = false) {
		if (value === undefined) return;

		return <div className={styles.propertyLine}>
			{name !== undefined && name !== "" && 
				<>
					<div className={styles.propertyName}>
						{name}:
					</div>
					{star && <SpriteComponent size={16} texture={getTextureForEffect(StatusEffectType.Stunned)}/>}
				</>

			}


			<div className={styles.propertyValue}>
				{value}
				{star && name === undefined && <SpriteComponent size={16} texture={getTextureForEffect(StatusEffectType.Stunned)}/>}
			</div>

		</div>
	}

	renderStats(stats: Stats, onEquipText: boolean = false) {
		if (stats.isZero()) return;
		return <div className={styles.statContainer}>
			{onEquipText && <div className={styles.propertyName} style={{margin: "0px 0px"}}>
				On Equip:
			</div>}
			{stats.hp !== 0 && <div className={styles.stat}>{`${this.formatNumber(stats.hp)} Max HP`}</div>}
			{stats.mp !== 0 && <div className={styles.stat}>{`${this.formatNumber(stats.mp)} Max MP`}</div>}
			{stats.atk !== 0 && <div className={styles.stat}>{`${this.formatNumber(stats.atk)} Attack`}</div>}
			{stats.def !== 0 && <div className={styles.stat}>{`${this.formatNumber(stats.def)} Defense`}</div>}
			{stats.spd !== 0 && <div className={styles.stat}>{`${this.formatNumber(stats.spd)} Speed`}</div>}
			{stats.dex !== 0 && <div className={styles.stat}>{`${this.formatNumber(stats.dex)} Dexterity`}</div>}
			{stats.vit !== 0 && <div className={styles.stat}>{`${this.formatNumber(stats.vit)} Vitality`}</div>}
			{stats.wis !== 0 && <div className={styles.stat}>{`${this.formatNumber(stats.wis)} Wisdom`}</div>}
		</div>
	}

	formatNumber(num: number) {
		return `${num > 0 ? "+" : ""}${num}`
	}

	getBorderStyle(): CSSProperties {
		return {
			borderImage: `url(${this.getBorderURL()}) 12 / 1 / 0 stretch`,
		}
	}

	componentDidMount() {
		this.updateOffset();
	}

	componentDidUpdate(prevProps: Props, prevState: State) {
		if (prevProps.x !== this.props.x || prevProps.y !== this.props.y) {
			this.updateOffset();
		}
	}

	updateOffset() {
		let { x, y } = this.props;
		let scaleX = this.state.scale, scaleY = this.state.scale;

		const div = this.tooltipDiv.current;
		if (div !== null) {
			const rect = div.getBoundingClientRect();

			if (x + rect.width > window.innerWidth) {
				x -= rect.width;
			}

			if (y + rect.height > window.innerHeight) {
				y += (window.innerHeight - (y + rect.height));
			}

			if (rect.width > window.innerWidth) {
				scaleX = window.innerWidth / rect.width;
			}

			if (rect.height > window.innerHeight) {
				scaleY = window.innerHeight / rect.height;
			}
		}

		this.setState({x, y, scale: Math.min(scaleX, scaleY)});
	}

	render() {
		let { x, y, scale } = this.state;

		const style: CSSProperties = {
			left: x + "px", 
			top: y + "px",
			transform: `scale(${Math.floor(scale * 100)}%)`
		}

		return (
			<div ref={this.tooltipDiv} className={styles.tooltipBack} style={style}>
				<div className={styles.tooltipBorder} style={this.getBorderStyle()} />
				<div className={styles.tooltipTop}>
					<div className={styles.topItemInfo}>
						<div className={styles.itemIcon}>
							<SpriteComponent texture={this.props.item.data.texture} />
						</div>
						<div className={styles.itemTitle}>
							{this.props.item.data.getDisplayName()}
						</div>
						<div style={this.getItemTierCSS()}>
							{this.getItemTierText()}
						</div>
					</div>
					<div className={styles.usableClassText}>
						{this.getUsableClassText()}
					</div>
				</div>
				<div className={styles.tooltipMiddle}>
					{this.hasProjectile() && (
						<div>
							<div className={styles.smallDarkText}>
								Damage
								{isProjectileAbility(this.getItemData()) && <SpriteComponent size={16} texture={getTextureForEffect(StatusEffectType.Stunned)}/>}
							</div>
							<div className={styles.largeText} style={this.getDamageTextStyle()}>
								{this.getDamageText()}
							</div>
						</div>
					)}
					{this.isSoulbound() && (
						<div className={styles.soulboundText}>
							Soulbound
						</div>
					)}
					<div className={styles.descriptionText}>
						{this.renderDescription()}
					</div>
					<div className={styles.splitter} style={{backgroundColor: this.getColor()}} />
					{this.renderSubAttacks()}
					<div>
						{this.getItemData().extraTooltipData.map((info, index) => (
							<div key={index}>
								{this.renderProperty(info.name, info.description, Tooltip.starLines[this.getItemData().id] !== undefined && Tooltip.starLines[this.getItemData().id][index])}
							</div>
						))}
					</div>
					<div>
						{this.getItemData().activates.map((activate, index) => <div key={index}>{this.renderActivate(activate)}</div>)}
					</div>
					{this.getItemData().subAttacks.length <= 1 && 
						<>
							{this.getItemData().numProjectiles !== 1 && this.renderProperty("Shots", this.getItemData().numProjectiles)}
							{this.renderProperty("Range", this.getItemData().getRange())}
							{this.renderProperty("Rate of Fire", this.getItemData().getROF())}
							{this.getItemData().projectiles[0]?.boomerang && this.renderProperty(undefined, "Shots boomerang")}
							{this.getItemData().projectiles[0]?.multiHit && this.renderProperty(undefined, "Shots hit multple targets")}
							{this.getItemData().projectiles[0]?.passesCover && this.renderProperty(undefined, "Shots pass through obstacles")}
							{this.getItemData().projectiles[0]?.armorPiercing && this.renderProperty(undefined, "Ignores defense of target")}
						</>
					}

					{this.renderStats(this.getItemData().stats, true)}
					{this.getItemData().mpCost !== 0 && this.renderProperty("MP Cost", this.getItemData().mpCost)}
					{this.getItemData().xpBonus && this.renderProperty("XP Bonus", this.getItemData().xpBonus + "%")}
					{this.renderSet()}
				</div>
				<div className={styles.tooltipBottom}>
					{this.getItemData().feedPower && <div className={styles.feedPower}>Feed Power: {this.getItemData().feedPower}</div>}
				</div>
			</div>
		)
	}
}

Tooltip.activateRenderers.set("BulletNova", (activate: BulletNova) => [
	"Spell: ", { text: `${activate.numShots} Shots`, type: "value"}
])

Tooltip.activateRenderers.set("ConditionEffectSelf", (activate: ConditionEffectSelf, player: Player | undefined) => {
	const wis = player?.stats.wis ?? 0;
	const bonusDuration = activate.getBonusDuration(wis);
	return [
		"Effect on Self:",
		{text: `${StatusEffectType[activate.effect]}`, type: "value"},
		"for",
		{text: `${activate.getDuration(wis)}`, type: "value"},
		bonusDuration !== 0 ? {text: `(+${bonusDuration})`, type: "wis"} : "",
		"seconds"
	]
})

Tooltip.activateRenderers.set("ConditionEffectAura", (activate: ConditionEffectAura, player: Player | undefined) => {
	const wis = player?.stats.wis ?? 0;
	const bonusDuration = activate.getBonusDuration(wis);
	const bonusRange = activate.getBonusRange(wis);
	return [
		"Party Effect: Within", 
		{text: `${activate.getRange(wis)} sqrs`, type: "value"},
		bonusRange !== 0 ? {text: `(+${bonusRange})`, type: "wis"} : "",
		{text: `${StatusEffectType[activate.effect]}`, type: "value"},
		"for",
		{text: `${activate.getDuration(wis)}`, type: "value"},
		bonusDuration !== 0 ? {text: `(+${bonusDuration})`, type: "wis"} : "",
		"seconds"
	]
})

Tooltip.activateRenderers.set("Decoy", (activate: Decoy) => [
	"Decoy:",
	{text: `${activate.duration} seconds`, type: "value"},
	{type: "linebreak"},
	{text: `${activate.distance} squares`, type: "value"},
	"in",
	{text: "??? seconds", type: "value"}
])

Tooltip.activateRenderers.set("EffectBlast", (activate: EffectBlast, player: Player | undefined) => {
	const wis = player?.stats.wis ?? 0;
	const bonusRadius = activate.getBonusRadius(wis);
	const bonusDuration = activate.getBonusDuration(wis);
	return [
		"Effect on Enemy:",
		{type: "linebreak"},
		{text: `${StatusEffectType[activate.condEffect]}`, type: "value"},
		"for",
		{text: `${activate.getDuration(wis)}`, type: "value"},
		bonusDuration !== 0 ? {text: `(+${bonusDuration})`, type: "wis"} : "",
		"seconds within",
		{text: `${activate.getRadius(wis)}`, type: "value"},
		bonusRadius !== 0 ? {text: `(+${bonusRadius})`, type: "wis"} : "",
		"squares"
	]
})

Tooltip.activateRenderers.set("HealNova", (activate: HealNova, player: Player | undefined) => {
	const wis = player?.stats.wis ?? 0;
	const bonusAmount = activate.getBonusHealAmount(wis);
	const bonusRange = activate.getBonusRange(wis);
	return [
		"Party Heal:",
		{text: `${activate.getHealAmount(wis)}`, type: "value"},
		bonusAmount !== 0 ? {text: `(+${bonusAmount})`, type: "wis"} : "",
		"within",
		{text: `${activate.getRange(wis)}`, type: "value"},
		bonusRange !== 0 ? {text: `(+${bonusRange})`, type: "wis"} : "",
		"squares"
	]
})

Tooltip.activateRenderers.set("IncrementStat", (activate: IncrementStat) => activate.stats.map((name, value) => {
	if (value === 0) return ""
	
	return {text: `+${value} ${name}`, type: "value"}
}))

Tooltip.activateRenderers.set("PoisonGrenade", (activate: PoisonGrenade, player: Player | undefined) => {
	return [
		"Poison:",
		{text: `${activate.totalDamage}`, type: "value"},
		{text: "damage (", type: "normal", noMarginRight: true},
		{text: `${activate.impactDamage}`, type: "value", noMarginLeft: true},
		"on impact) within",
		{text: `${activate.radius} squares`, type: "value"},
		{type: "linebreak"},
		{text: `${activate.throwTime} second`, type: "value"},
		"to throw and lasts",
		{text: `${activate.duration} seconds`, type: "value"}
	]
})

Tooltip.activateRenderers.set("StatBoostAura", (activate: StatBoostAura, player: Player | undefined) => {
	const wis = player?.stats.wis ?? 0;
	const bonusDuration = activate.getBonusDuration(wis);
	const bonusRange = activate.getBonusRange(wis);
	const bonusAmount = activate.getBonusAmount(wis);
	const amount = activate.getAmount(wis);
	return [
		"Party Effect: Within", 
		{text: `${activate.getRange(wis)} sqrs`, type: "value"},
		bonusRange !== 0 ? {text: `(+${bonusRange})`, type: "wis"} : "",
		activate.amount < 0 ? "decrease": "increase",
		{text: `${StatNames[activate.stat] ?? activate.stat}`, type: "value"},
		"by",
		{text: `${amount}`, type: "value"},
		bonusAmount !== 0 ? {text: `(+${bonusAmount})`, type: "wis"} : "",
		"for",
		{text: `${activate.getDuration(wis)}`, type: "value"},
		bonusDuration !== 0 ? {text: `(+${bonusDuration})`, type: "wis"} : "",
		"seconds"
	]
})

Tooltip.activateRenderers.set("Teleport", () => [
	{text: "Teleport to Target", type: "value"}
])

Tooltip.activateRenderers.set("Trap", (activate: Trap) => {
	const statusEffectText: ActivateRendererText[] = activate.condEffect !== StatusEffectType.Nothing ? [
		"Inflicts",
		{text: `${StatusEffectType[activate.condEffect]}`, type: "value"},
		"for",
		{text: `${activate.condDuration}`, type: "value"},
		"seconds",
		{type: "linebreak"}
	] : []

	return [
		"Trap:",
		{text: `${activate.totalDamage}`, type: "value"},
		"damage within",
		{text: `${activate.radius}`, type: "value"},
		"squares",
		{type: "linebreak"},
		...statusEffectText,
		{text: `${activate.throwTime} second`, type: "value"},
		"to arm for",
		{text: `${activate.duration} seconds`, type: "value"},
		{type: "linebreak"},
		"Triggers within",
		{text: `${activate.radius * activate.sensitivity}`, type: "value"},
		"squares"
	]
})

Tooltip.activateRenderers.set("VampireBlast", (activate: VampireBlast, player: Player | undefined) => {
	const wis = player?.stats.wis ?? 0;
	const bonusDamage = activate.getBonusDamage(wis);
	const bonusHealRadius = activate.getBonusHealRadius(wis);
	return [
		"Skull:",
		{text: `${activate.getDamage(wis)}`, type: "value"},
		bonusDamage !== 0 ? {text: `(+${bonusDamage})`, type: "wis"} : "",
		"damage",
		{type: "linebreak"},
		"Within",
		{text: `${activate.radius}`, type: "value"},
		"squares",
		{type: "linebreak"},
		"Steals",
		{text: `${activate.heal}`, type: "value"},
		"HP and ignores",
		{text: `${activate.ignoreDef}`, type: "value"},
		"defense",
		{type: "linebreak"},
		"Heals allies within",
		{text: `${activate.getHealRadius(wis)}`, type: "value"},
		bonusHealRadius !== 0 ? {text: `(+${bonusHealRadius})`, type: "wis"} : "",
		"squares"
	]
})

function isProjectileAbility(data: Equipment) {
	return data.activates.findIndex(a => a.getName() === "Shoot" || a.getName() === "BulletCreate" || a.getName() === "ShurikenAbility") !== -1;
}

Tooltip.starLines = {
	"Oryx's Escutcheon": [ true ],
	"Divinity": [ true ],
	"Exalted God's Horn": [ true ],
	"Vesture of Duality": [ true ],
	"Primal Arcana": [ true ],
	"Elemental Equilibrium": [ true ],
	"Collector's Monocle": [ true ],
	"2ArcherST1": [ true ],
	"2RogueST0": [ true ],
	"Sporous Spray Spell": [ true ],
	"Genesis Spell": [ true ],
	"Chaotic Scripture": [ true ],
	"The Twilight Gemstone": [ true ],
	"Robe of the Mad Scientist": [ true ]
}