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
	
	const focusInCurrentTarget = ({ relatedTarget, currentTarget }: any) => {
		if (relatedTarget === null) return false;
		
		var node = relatedTarget.parentNode;
		
		while (node !== null) {
			if (node === currentTarget) return true;
			node = node.parentNode;
		}
		
		return false;
	}
	
	const onBlur = (e: React.FocusEvent<HTMLDivElement, Element>) => {
		if (!focusInCurrentTarget(e)) {
			setShowPicker(false);
		}
	}
	
	
	const picker = showPicker ? (
		<div className={styles.colorPickerContainer} ref={pickerDiv} onBlur={onBlur} tabIndex={1}>
		<SketchPicker className={styles.colorPicker} color={props.color} onChangeComplete={(color) => {props.onChange(color.hex)}} onChange={(color) => {props.onChange(color.hex)}} />
		</div>
		
		) : null
		
		return (
			<div className={styles.colorSwatch} style={{backgroundColor: props.color}} onClick={() => setShowPicker(true)}>{picker}</div>
			)
		}