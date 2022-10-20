import { StrictMode } from "react";
import ReactDOM from "react-dom";

import App from "./App";
import { ChannelContext, initializeChannel } from "./data/channel";
import "./index.scss";

async function render() {
	const channel = await initializeChannel();

	ReactDOM.render(
		<StrictMode>
			<ChannelContext.Provider value={channel}>
				<App />
			</ChannelContext.Provider>
		</StrictMode>,
		document.getElementById("root")
	);
}

render();
