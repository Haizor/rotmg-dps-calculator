import { Line } from "react-chartjs-2";

//TODO: only register needed stuff
import { Chart, registerables, ChartData, ChartDataset, ChartOptions } from 'chart.js';
import { PlayerState } from "../features/player/setsSlice";
import DPSCalculator from "../dps/dps-calculator";
import { useAppSelector } from "../app/hooks";
import { useRef,  useEffect } from "react";
Chart.register(...registerables);

type Data = ChartData<"line", number[]>

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

function getInitialData(sets: PlayerState[]): Data {
	const labels: number[] = [];

	for (let i = 0; i <= defenseRange; i++) {
		labels.push(i);
	}

	const data = {
		datasets: [],
		labels
	}

	updateData(sets, data);

	console.log(data);

	return data;
}

function updateData(sets: PlayerState[], data: Data) {
	sets.forEach((state, index) => {
		const dps = new DPSCalculator(state);
		if (data.datasets[index] === undefined) {
			data.datasets[index] = {data: [], label: state.id + "", borderColor: state.color };
		}
		data.datasets[index].data = dps.getDPS();
		data.datasets[index].borderColor = state.color;
	})
}

function getDataFromSets(sets: PlayerState[]): Data {
	const datasets: ChartDataset<"line", number[]>[] = [];
	const labels: number[] = [];

	for (let i = 0; i <= defenseRange; i++) {
		labels.push(i);
	}

	sets.forEach((state) => {
		const dps = new DPSCalculator(state);

		datasets.push({
			id: state.id,
			label: state.id,
			data: dps.getDPS(),
			borderColor: state.color
		} as any);
	})

	return {
		datasets,
		labels
	}
}

function DefenseGraph() {
	const sets = useAppSelector(state => state.sets);
	const chart = useRef<Chart<"line">>(null);
	const data = useRef<Data>(getInitialData(sets));

	useEffect(() => {

		updateData(sets, data.current);
		if (chart.current !== null) {
			// console.log(data.current)

			chart.current.data = data.current;
			chart.current.update();
		}
	}, [sets])

	return (
		<div style={{flex: "1 0 0", minWidth: "0"}}>
			<Line datasetIdKey="id" ref={chart} data={data.current} options={options} redraw={true}/>
		</div>

	)
}

export default DefenseGraph;