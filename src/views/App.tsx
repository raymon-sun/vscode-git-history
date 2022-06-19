import { useContext, useEffect, useState } from "react";

import CommitsTable from "./components/CommitsTable";

import { ChannelContext } from "./data/channel";

import "@vscode/codicons/dist/codicon.css";

export default function App() {
	const channel = useContext(ChannelContext)!;

	const [isRepoInitialized, setIsRepoInitialized] = useState(false);

	useEffect(() => {
		channel.getDefaultRepository().then((defaultRepo) => {
			console.log(defaultRepo);
			setIsRepoInitialized(!!defaultRepo);
		});

		channel.onReposChange((repos) => {
			setIsRepoInitialized(!!repos?.length);
		});
	}, [channel]);

	return isRepoInitialized ? <CommitsTable /> : null;
}
