import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { getChangelog } from "../changelog";
import { Modal } from "../components/Modal";

export function ChangelogPage() {
	const [ changelog, setChangelog ] = useState<string | undefined>(undefined);
	
	useEffect(() => {
		if (changelog === undefined) {
			getChangelog().then((log) => {
				setChangelog(log);
			})
		}
	})

	const element = changelog !== undefined ? (
		<ReactMarkdown children={changelog} />
	) : <>Loading...</>

	return <Modal>
		{element}
	</Modal>
}