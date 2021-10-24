import { ThemeIcon } from "vscode";
import OriginalSelect from "react-select";
import styleVars from "./index.scss";

const { SELECT_HOST } = styleVars;

const Select: OriginalSelect = (props) => (
	<OriginalSelect
		className={SELECT_HOST}
		classNamePrefix={SELECT_HOST}
		{...props}
	></OriginalSelect>
);

export default Select;
