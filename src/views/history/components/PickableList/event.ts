import { useCallback, useEffect, useRef, useState } from "react";

export function useIsKeyPressed() {
	const [heldKeys, _setHeldKeys] = useState<string[]>([]);
	const heldKeysRef = useRef(heldKeys);
	const setHeldKeys = (keys: string[]) => {
		heldKeysRef.current = keys;
		_setHeldKeys(keys);
	};

	const checkKeyIsPressed = useCallback(
		(key: string) => heldKeys?.includes(key),
		[heldKeys]
	);

	useEffect(() => {
		function keydownEventHandler(e: KeyboardEvent) {
			const currentHeldKeys = heldKeysRef.current;
			if (currentHeldKeys.includes(e.key)) {
				return;
			}
			setHeldKeys([...currentHeldKeys, e.key]);
		}
		function keyupEventHandler(e: KeyboardEvent) {
			const currentHeldKeys = heldKeysRef.current;
			if (currentHeldKeys.includes(e.key)) {
				const index = currentHeldKeys.indexOf(e.key);
				currentHeldKeys.splice(index, 1);
				setHeldKeys([...currentHeldKeys]);
			}
		}
		document.addEventListener("keydown", keydownEventHandler);
		document.addEventListener("keyup", keyupEventHandler);
		return () => {
			document.removeEventListener("keydown", keydownEventHandler);
			document.removeEventListener("keyup", keyupEventHandler);
		};
	}, []);

	return { checkKeyIsPressed };
}
