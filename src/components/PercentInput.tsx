import { ChangeEvent, WheelEvent, CSSProperties } from "react"

type Props = {
	style?: CSSProperties;
	className?: string;
	onChange?: (value: number) => void;
	min?: number;
	max?: number;
	value?: number;
}

function PercentInput({ style, className, min, max, value, onChange }: Props) {
	const textValue = (value ?? 100) + "%";

	const updateInput = (event: ChangeEvent<HTMLInputElement>) => {
		const num = parseInt(event.target.value.replaceAll(/[^\d]+/g, ""));

		if (onChange !== undefined) onChange(Math.min(max ?? 100, Math.max(min ?? 0, num)))
	}

	const onScroll = (event: WheelEvent) => {
		const amount = event.deltaY < 0 ? 1 : -1;
		const num = (value ?? 100) + amount;

		if (onChange !== undefined) onChange(Math.min(max ?? 100, Math.max(min ?? 0, num)))
	}
	
	return <input type="text" style={style} className={className} value={textValue} onChange={updateInput} onWheel={onScroll}/>
}

export default PercentInput;