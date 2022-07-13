import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type SettingsState = {
	simulationTime: number;
	simulationCount: number;
	simulationStep: number;
}

const settingsSlice = createSlice({
	name: "settings",
	initialState: {
		simulationTime: 10,
		simulationCount: 20,
		simulationStep: 0.2
	},
	reducers: {
		setSimulationTime: (state: SettingsState, action: PayloadAction<number>) => {
			state.simulationTime = action.payload;
		},
		setSimulationCount: (state: SettingsState, action: PayloadAction<number>) => {
			state.simulationCount = action.payload;
		},
		setSimulationStep: (state: SettingsState, action: PayloadAction<number>) => {
			state.simulationStep = action.payload;
		}
	}
})

export const {
	setSimulationCount,
	setSimulationStep,
	setSimulationTime
} = settingsSlice.actions

export default settingsSlice.reducer;