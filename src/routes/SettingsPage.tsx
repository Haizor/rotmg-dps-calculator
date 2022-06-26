import { useAppDispatch, useAppSelector } from "../app/hooks";
import { Modal } from "../components/Modal";
import { setSimulationCount, setSimulationStep, setSimulationTime } from "../features/settingsSlice";

export function SettingsPage() {
	const dispatch = useAppDispatch();
	const settings = useAppSelector(state => state.settings);

	const updateValue = (action: any, min: number, max: number, value: number) => {
		dispatch(action(Math.max(min, Math.min(max, value))));
	}

	return <Modal style={{padding: "32px", display: "flex", alignItems: "center"}}>
		<div style={{display: "grid", gridTemplateColumns: "auto auto", textAlign: "center", width: "fit-content"}}>
			<div style={{paddingRight: "4px"}}>Simulation Count: </div>
			<input type="number" value={settings.simulationCount} min="10" max="100" step="5" className="numberInput" onChange={(e) => updateValue(setSimulationCount, 10, 100, e.target.valueAsNumber)} />

			<div>Simulation Time:</div>
			<input type="number" value={settings.simulationTime} min="5" max="30" step="0.5" className="numberInput" onChange={(e) => updateValue(setSimulationTime, 5, 30, e.target.valueAsNumber)}/>

			<div>Simulation Step:</div>
			<input type="number" value={settings.simulationStep} min="0.1" max="2" step="0.1" className="numberInput" onChange={(e) => updateValue(setSimulationStep, 0.1, 2, e.target.valueAsNumber)}/>
		</div>


		<div>
			<h3>Explanation</h3>
			<div>Simulation Count is the amount of times DPS is calculated, split between DEF values of 0-100</div>
			<div>Simulation Time is the amount of time the simulation is ran for.</div>
			<div>Simulation Step is the rate at which the simulation runs.</div>
			<div>There isn't any need to change this stuff unless you want really accurate numbers or are having performance issues.</div>
		</div>
	</Modal>
}