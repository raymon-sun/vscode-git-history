/** characters `git check-ref-format` forbids inside a ref name */
const FORBIDDEN_CHARS = [" ", "~", "^", ":", "?", "*", "[", "\\"];

/**
 * Validate a user-supplied name so it can be used as a branch or tag name.
 * Mirrors the rules enforced by `git check-ref-format`.
 *
 * @returns an error message, or `undefined` when the name is valid
 */
export function validateRefName(name: string): string | undefined {
	const value = name.trim();

	if (!value) {
		return "Name is required.";
	}

	if (value === "@") {
		return "Name cannot be '@'.";
	}

	if (value.startsWith("-")) {
		return "Name cannot start with a hyphen.";
	}

	if (value.includes("@{") || value.includes("..") || value.includes("//")) {
		return "Name cannot contain '@{', '..' or '//'.";
	}

	if (FORBIDDEN_CHARS.some((char) => value.includes(char))) {
		return "Name cannot contain spaces or any of ~ ^ : ? * [ \\";
	}

	// eslint-disable-next-line no-control-regex
	if (/[\u0000-\u001f\u007f]/.test(value)) {
		return "Name cannot contain control characters.";
	}

	if (value.startsWith("/") || value.endsWith("/")) {
		return "Name cannot start or end with '/'.";
	}

	if (value.endsWith(".")) {
		return "Name cannot end with '.'.";
	}

	if (value.endsWith(".lock")) {
		return "Name cannot end with '.lock'.";
	}

	if (value.split("/").some((component) => component.startsWith("."))) {
		return "No part of the name can start with '.'.";
	}

	return undefined;
}

export function isValidRefName(name: string) {
	return validateRefName(name) === undefined;
}
