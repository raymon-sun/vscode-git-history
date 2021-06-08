import { Commit } from "../types";
import style from "./App.module.scss";

type Props = {
	commits: Commit[];
};

function App(props: Props) {
	const { commits } = props;

	return (
		<div className={style.container}>
			<div className={style["code-container"]}>Code Area</div>
			<div className={style["commits-container"]}>
				<p>Commits:</p>
				{commits.map((commit) => (
					<p>{commit.message}</p>
				))}
			</div>
		</div>
	);
}

export default App;
