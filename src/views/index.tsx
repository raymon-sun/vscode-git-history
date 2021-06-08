import { StrictMode } from "react";
import ReactDOM from "react-dom";
import { Commit } from "../types";
import App from "./App";
import "./index.scss";

function render(event: MessageEvent<Commit[]>) {
	const commits = event.data;
	ReactDOM.render(
		<StrictMode>
			<App commits={commits} />
		</StrictMode>,
		document.getElementById("root")
	);
}

window.addEventListener("message", render);
