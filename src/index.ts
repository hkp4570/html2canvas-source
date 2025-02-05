const html2canvas = (element: HTMLElement, options : {} = {}) => {
	return renderElement(element, options);
}
export default html2canvas;

const renderElement = (element: HTMLElement, opts:any) => {
	console.log(element, opts);
	return 'renderElement';
}