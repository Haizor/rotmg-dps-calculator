import { CSSProperties, ReactNode } from "react";
import { createPortal } from "react-dom";
import { Outlet, useNavigate } from "react-router-dom";
import { useSpring, useTransition, animated } from "@react-spring/web"

import styles from "./Modal.module.css";

export function Modal(props: { children: ReactNode, style?: CSSProperties, className?: string }) {
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

	return createPortal(<animated.div className={styles.modalContainer} style={style} onClick={(e) => {e.stopPropagation(); navigate(-1)}}>
		<div className={props.className + " " + styles.modalInner} style={props.style} onClick={(e) => e.stopPropagation()}>
			{props.children}
		</div>
	</animated.div>, document.querySelector("#modal") as Element)
}