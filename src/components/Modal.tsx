import { CSSProperties, ReactNode } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useSpring, useTransition, animated } from "@react-spring/web"

import styles from "./Modal.module.css";

export function Modal(props: { children: ReactNode, style?: CSSProperties }) {
	const navigate = useNavigate();

	const style = useSpring({
		to: {
			opacity: 1
		},
		from: {
			opacity: 0
		},
		config: {
			duration: 100
		}
	})

	return createPortal(<animated.div className={styles.modalContainer} style={{...props.style, ...style}} onClick={(e) => {e.stopPropagation(); navigate(-1)}}>
		{props.children}
	</animated.div>, document.querySelector("#modal") as Element)
}