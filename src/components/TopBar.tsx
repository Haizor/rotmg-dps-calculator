import { useNavigate } from "react-router-dom";
import styles from "./TopBar.module.css";

export function TopBar() {
	const navigate = useNavigate();
	return <div className={styles.topBar}>
		<a href="https://discord.com/invite/HFfu6sZ" target="_blank" rel="noreferrer">
			<img className={styles.icon} src="discord_logo.svg" alt="Discord link" />
		</a>
		
		<a href="https://github.com/Haizor/rotmg-dps-calculator" target="_blank" rel="noreferrer">
			<img className={`${styles.icon} ${styles.github}`} src="github_icon.svg" alt="Github link" />
		</a>

		<div onClick={() => navigate("changelog")}>
			<img className={`${styles.icon} ${styles.invert}`} src="changelog_icon.svg" alt="Changelog" />
		</div>

		<div className={styles.title}>
			Haizor.net
		</div>
	</div>
}