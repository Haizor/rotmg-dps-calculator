import { Line } from "react-chartjs-2";

//TODO: only register needed stuff
import { Chart, registerables, ChartData, ChartDataset, ChartOptions } from 'chart.js';
import { PlayerState } from "../features/player/setsSlice";
import DPSCalculator from "../dps/dps-calculator";
import { useAppSelector } from "../app/hooks";
import { useRef,  useEffect } from "react";
import objectHash from "object-hash";
Chart.register(...registerables);

type Data = ChartData<"line", number[]>

const hashOptions: objectHash.BaseOptions = {
	excludeKeys: (key) => key === "color"
}

const gridColor = "#666666"
const defenseRange = 100;

const options: ChartOptions<"line"> = {
	responsive: true,
	maintainAspectRatio: false,
	scales: {
		xAxes: {
			title: {
				display: true,
				text: "DEF"
			},
			grid: {
				display: false
			}
		},
		yAxes: {
			title: {
				display: true,
				text: "DPS"
			},
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

	return data;
}

function updateData(sets: PlayerState[], data: Data) {
	sets.forEach((state, index) => {
		if (data.datasets[index] === undefined) {
			data.datasets[index] = {data: [], label: state.id + "", borderColor: state.color } as any;
		}
		const hash = objectHash(state, hashOptions);
		if (hash !== (data.datasets[index] as any).hash) {
			const dps = new DPSCalculator(state);
			data.datasets[index].data = dps.getDPS();
			(data.datasets[index] as any).hash = hash;
		}

		data.datasets[index].borderColor = state.color;
	})

	if (data.datasets.length > sets.length) {
		data.datasets.splice(sets.length);
	}
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
			chart.current.data = data.current;
			chart.current.update();
		}
	}, [sets])

	return (
		<div style={{flex: "1 0 0", minWidth: "0", padding: "16px", overflow: "hidden"}}>
			<Line datasetIdKey="id" ref={chart} data={data.current} options={options} redraw={true}/>
		</div>

	)
}

export default DefenseGraph;