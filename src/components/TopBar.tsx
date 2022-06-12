import styles from "./TopBar.module.css";

export function TopBar() {
	return <div className={styles.topBar}>
		<a href="https://discord.com/invite/HFfu6sZ" target="_blank" rel="noreferrer">
			<img className={styles.icon} src="discord_logo.svg" alt="Discord link" />
		</a>
		
		<a href="https://github.com/Haizor/rotmg-skin-viewer" target="_blank" rel="noreferrer">
			<img className={`${styles.icon} ${styles.github}`} src="github_icon.svg" alt="Github link" />
		</a>
		<div className={styles.title}>
			Haizor.net
		</div>
	</div>
}