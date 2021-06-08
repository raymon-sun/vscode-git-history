import { Commit } from "../types";
import style from "./App.module.scss";

type Props = {
	commits: Commit[];
};

function App(props: Props) {
	const { commits } = props;

	return (
		<div className={style.container}>
			<div className={style["operations-bar"]}>
				<div className={style["filter-container"]}>
					<div>Branch:master</div>
					<div>User:All</div>
					<div>Date:All</div>
				</div>
				<div className={style["search-container"]}>
					<input />
				</div>
			</div>
			<div className={style["commits-container"]}>
				{commits.map(({ hash, message, authorName, commitDate }) => (
					<div className={style.commit}>
						<span className={style.hash}>{hash.slice(0, 6)}</span>
						<span className={style.message}>{message}</span>
						<span className={style["author-name"]}>
							{authorName}
						</span>
						<span className={style["commit-date"]}>
							{commitDate}
						</span>
					</div>
				))}
			</div>
		</div>
	);
}

export default App;
