import { Line } from "react-chartjs-2";

//TODO: only register needed stuff
import { Chart, registerables, ChartData, ChartDataset, ChartOptions } from 'chart.js';
import { PlayerState } from "../features/player/setsSlice";
import DPSCalculator from "../dps/dps-calculator";
import { useAppSelector } from "../app/hooks";
Chart.register(...registerables);

const gridColor = "#666666"
const defenseRange = 100;

const options: ChartOptions<"line"> = {
	responsive: true,
	maintainAspectRatio: false,
	scales: {
		xAxes: {
			grid: {
				display: false
			}
		},
		yAxes: {
			grid: {
				color: gridColor,
				tickColor: gridColor,
				borderColor: gridColor
			}
		}
	},
	plugins: {
		legend: {
			display: false
		}
	},
	spanGaps: true
}

function getDataFromSets(sets: PlayerState[]): ChartData<"line", number[]> {
	const datasets: ChartDataset<"line", number[]>[] = [];
	const labels: number[] = [];

	for (let i = 0; i <= defenseRange; i++) {
		labels.push(i);
	}

	sets.forEach((state) => {
		const dps = new DPSCalculator(state);

		datasets.push({
			label: "xd",
			data: dps.getDPS(),
			borderColor: state.color
		});
	})

	return {
		datasets,
		labels
	}
}

function DefenseGraph() {
	const sets = useAppSelector(state => state.sets);

	const data: ChartData<"line", number[]> = getDataFromSets(sets);

	return (
		<div style={{flex: "1 0 0", minWidth: "0"}}>
			<Line data={data} options={options}/>
		</div>

	)
}

export default DefenseGraph;