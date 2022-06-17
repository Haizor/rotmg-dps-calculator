import { Line } from "react-chartjs-2";

//TODO: only register needed stuff
import { Chart, registerables, ChartData, ChartDataset, ChartOptions, TooltipOptions, TooltipModel } from 'chart.js';
import { PlayerState } from "../features/player/setsSlice";
import DPSCalculator from "../dps/dps-calculator";
import { useAppSelector } from "../app/hooks";
import { useRef,  useEffect, useState, RefObject, Component } from "react";
import objectHash from "object-hash";
import { createPortal } from "react-dom";

import styles from "./DefenseGraph.module.css";
import SpriteComponent from "./SpriteComponent";
import { getTextureForEffect } from "../util";
import { StatusEffectType } from "@haizor/rotmg-utils";

Chart.register(...registerables);

type Data = ChartData<"line", number[]>
type Dataset = ChartDataset<"line", number[]> & {
	hash: string;
	categories: {
		[key: string]: number
	}[]
}

const hashOptions: objectHash.BaseOptions = {
	excludeKeys: (key) => key === "color"
}

const gridColor = "#666666"
const defenseRange = 100;

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
			const dpsData = dps.getDPS();
			data.datasets[index].data = dpsData.map((data) => data.total);
			(data.datasets[index] as Dataset).categories = dpsData.map((data) => data.categorized);
			(data.datasets[index] as Dataset).hash = hash;
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

type TooltipData = {
	sets: {
		dataset: ChartDataset;
		def: number;
	}[];
	x: number;
	y: number;
}

function DefenseGraph() {
	const sets = useAppSelector(state => state.sets);
	const chart = useRef<Chart<"line">>(null);
	const data = useRef<Data>(getInitialData(sets));
	const tooltip = useRef<Tooltip>(null);

	// const [ tooltipData, setTooltipData ] = useState<TooltipData[] | undefined>(undefined);

	// const tooltip = tooltipData === undefined ? null : createPortal((
	// 	<>A</>
	// ), document.getElementById("tooltip") as Element);

	const external = (o: any) => {
		tooltip.current?.updateTooltip(o as any)
	}

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
			},
			tooltip: {
				enabled: false,
				external
			}
		},
		spanGaps: true
	}


	useEffect(() => {
		updateData(sets, data.current);
		if (chart.current !== null) {
			chart.current.data = data.current;
			chart.current.update();
		}
	}, [sets])

	return (
		<div style={{flex: "1 0 0", minWidth: "0", padding: "16px", overflow: "hidden"}}>
			<Line datasetIdKey="id" ref={chart} data={data.current} options={options} />
			<Tooltip ref={tooltip}/>
		</div>

	)
}


class Tooltip extends Component<any, {tooltipData: TooltipData | undefined}> {
	constructor(props: any) {
		super(props);
		this.state = {tooltipData: undefined};
	}

	updateTooltip({chart, tooltip}: {chart: Chart<"line">, tooltip: TooltipModel<"line">}) {
		if (tooltip.opacity === 0) {
			this.setState({tooltipData: undefined});
			return;
		}

		const tooltipData: TooltipData = {
			sets: tooltip.getActiveElements().map((element) => {
				return {dataset: chart.data.datasets[element.datasetIndex], def: element.index}
			}),
			x: tooltip.x,
			y: tooltip.y
		}

		this.setState({tooltipData});
	}

	render() {
		const { tooltipData } = this.state;

		const categoryMapper = (dataset: Dataset, def: number) => {
			return Object.entries(dataset.categories[def]).sort((a, b) => b[1] - a[1]).map(([name, value]) => (
				<div key={name}>
					{name}: {Math.floor(value)}
				</div>
			))
		}

		const tooltip = tooltipData === undefined ? null : createPortal((
			<div className={styles.tooltip} style={{left: tooltipData.x + "px", top: tooltipData.y + "px"}}>
				<div>
					{tooltipData.sets.map((set, i) => (
						<div key={i} className={styles.tooltipSet} style={{borderColor: set.dataset.borderColor as string}}>
							<div className={styles.tooltipDefense} style={{borderColor: set.dataset.borderColor as string}}>
								<SpriteComponent texture={getTextureForEffect(StatusEffectType.Armored)} size={14}/> {set.def}
							</div>

							{categoryMapper(set.dataset as Dataset, set.def)}
							Total: {Math.floor(set.dataset.data[set.def] as number)}
						</div>
					))}
				</div>
			</div>
		), document.getElementById("tooltip") as Element);

		return tooltip;
	}
}

export default DefenseGraph;