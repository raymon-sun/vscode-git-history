import { useEffect, useState } from "react";
import { Commit } from "../types";

function App() {
	const [commits, setCommits] = useState<Commit[]>([]);

	useEffect(() => {
		window.addEventListener("message", (event) => {
			console.log(event.data);
			setCommits(event.data);
		});
	}, []);

	return (
		<div>
			<p>Commits:</p>
			{commits.map((commit) => (
				<p>{commit.message}</p>
			))}
		</div>
	);
}

export default App;
