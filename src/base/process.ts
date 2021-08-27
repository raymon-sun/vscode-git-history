import { ChildProcess } from "child_process";

export interface IExecutionResult<T extends string | Buffer> {
	exitCode: number;
	stdout: T;
	stderr: string;
}

export async function exec(
	child: ChildProcess
): Promise<IExecutionResult<Buffer>> {
	let result = Promise.all<any>([
		new Promise<number>((c) => {
			child.once("exit", c);
		}),
		new Promise<Buffer>((c) => {
			const buffers: Buffer[] = [];
			child.stdout?.on("data", (b: Buffer) => buffers.push(b));
			child.stdout?.once("close", () => c(Buffer.concat(buffers)));
		}),
		new Promise<string>((c) => {
			const buffers: Buffer[] = [];
			child.stderr?.once("data", (b: Buffer) => buffers.push(b));
			child.stdout?.once("close", () =>
				c(Buffer.concat(buffers).toString("utf8"))
			);
		}),
	]) as Promise<[number, Buffer, string]>;

	const [exitCode, stdout, stderr] = await result;
	return { exitCode, stdout, stderr };
}
