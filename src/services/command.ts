import { spawn } from "child_process";

export async function executeCommand(
	binPath: string,
	args: string[],
	workspacePath: string
) {
	spawn(binPath, args, { cwd: workspacePath });
}
