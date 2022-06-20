import { Modal } from "../components/Modal";

export function HelpPage() {
	return <Modal style={{padding: "32px"}}>
		<h2>Custom Weapons?</h2>
		<p>Custom weapons are curretly supported through the <a href="https://www.haizor.net/rotmg/sandbox" target="_blank" rel="noreferrer">sandbox.</a>. Right click on any item in your inventory, then click Copy to edit it.</p>
		<h2>What are the stars in the tooltips of items?</h2>
		<p>The stars mean that the line that the star is on is currently supported for calculating DPS.</p>
		<h2>How do I enable/disable ability DPS?</h2>
		<p>Ability DPS is on by default. In order to not use it, you can always turn the accuracy below the equipment to 0%. Likewise, if you wanted to only show ability DPS, you could set the accuracy of your weapon to 0%</p>
	</Modal>
}