import { useState } from "react";
import { SketchPicker } from "react-color";
import styles from "./ColorPicker.module.css"

interface ColorPickerProps {
	color: string;
	onChange: (hex: string) => void
}

export function ColorPicker(props: ColorPickerProps) {
	const [ showPicker, setShowPicker ] = useState(false);

	const picker = showPicker ? (
		<SketchPicker color={props.color} onChange={(color) => {props.onChange(color.hex)}} onChangeComplete={(color) => setShowPicker(false)} />
	) : null

	return (
		<div className={styles.colorSwatch} style={{backgroundColor: props.color}} onClick={() => setShowPicker(!showPicker)}>{picker}</div>
	)
}