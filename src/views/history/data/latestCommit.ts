import { createContext } from "react";

/** hash of the newest commit currently shown at the top of the list */
export const LatestCommitContext = createContext<string | undefined>(undefined);
