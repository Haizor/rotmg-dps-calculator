import { useEffect, useState } from "react";
import { ManagerLoading } from "./asset";

import { useAppDispatch } from './app/hooks';
import {
	setPlayer
} from './features/player/setsSlice';
import DefenseGraph from "./components/DefenseGraph";
import styles from "./App.module.css";
import SetsDisplay from "./components/SetsDisplay";
import { Outlet, useNavigate } from "react-router-dom";
import "./App.css"
import { TopBar } from "./components/TopBar";
import { tryDisplayChangelog } from "./changelog";

const graphs = [
	<DefenseGraph />
]

function App() {
	const [ loaded, setLoaded ] = useState(false);
	const [ graphIndex, setGraphIndex ] = useState(0);
	const navigate = useNavigate();

	const dispatch = useAppDispatch();

	useEffect(() => {
		ManagerLoading.then(() => {
			dispatch(setPlayer([0, 0x0307]));
			setLoaded(true);
			tryDisplayChangelog(navigate);
		});
	}, [ dispatch ])

	if (!loaded) return <div>loading...</div>

	return (
		<div className={styles.app}>
			<TopBar />
			<div className={styles.main}>
				{graphs[graphIndex]}
				<SetsDisplay />
				<Outlet />
			</div>

		</div>
	);
}
	
export default App;