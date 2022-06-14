import { useEffect, useRef, useState } from "react";
import { SketchPicker } from "react-color";
import styles from "./ColorPicker.module.css"

interface ColorPickerProps {
	color: string;
	onChange: (hex: string) => void
}

export function ColorPicker(props: ColorPickerProps) {
	const [ showPicker, setShowPicker ] = useState(false);
	const pickerDiv = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (pickerDiv.current !== null)  {
			pickerDiv.current.focus();
		}
	})

	const picker = showPicker ? (
		<div ref={pickerDiv} onBlur={() => setShowPicker(false)} tabIndex={1}>
			<SketchPicker className={styles.colorPicker} color={props.color} onChange={(color) => {props.onChange(color.hex)}} />
		</div>

	) : null

	return (
		<div className={styles.colorSwatch} style={{backgroundColor: props.color}} onClick={() => setShowPicker(true)}>{picker}</div>
	)
}