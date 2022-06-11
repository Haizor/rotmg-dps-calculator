import { CSSProperties, ReactNode } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";

import styles from "./Modal.module.css";

export function Modal(props: { children: ReactNode, style?: CSSProperties }) {
	const navigate = useNavigate();

	return createPortal(<div className={styles.modalContainer} style={props.style} onClick={(e) => {e.stopPropagation(); navigate(-1)}}>
		{props.children}
	</div>, document.querySelector("#modal") as Element)
}