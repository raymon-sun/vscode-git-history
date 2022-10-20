export function checkScrollBarVisible(element: HTMLElement) {
	return element.scrollHeight > element.getBoundingClientRect().width;
}
