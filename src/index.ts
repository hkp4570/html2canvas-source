import { Bounds } from "./css/layout/bounds";
import { Context } from "./core/context";

export type Options = {
	backgroundColor: string | null;
	foreignObjectRendering: boolean;
	removeContainer?: boolean;
	allowTaint: boolean,
	imageTimeout: number,
	proxy: string,
	useCORS: boolean,
	windowWidth: number,
	windowHeight: number,
	scrollX: number,
	scrollY: number,
	logging: boolean,
	cache: boolean,
}

const html2canvas = (element: HTMLElement, options : Partial<Options> = {}) => {
	return renderElement(element, options);
}
export default html2canvas;

const renderElement = (element: HTMLElement, opts:Partial<Options>) => {
	if(!element || typeof element !== 'object'){
		return Promise.reject('Invalid element provided as first argument');
	}
	const ownerDocument = element.ownerDocument;
	if(!ownerDocument){
		throw new Error('Element is not attached to a Document');
	}
	const defaultView = ownerDocument.defaultView;
	if(!defaultView){
		throw new Error('Document is not attached to a Window');
	}
	// 以上判断element是否是一个dom元素
	const resourceOptions = {
		allowTaint: opts.allowTaint ?? false, // 是否允许跨源图像
		imageTimeout: opts.imageTimeout ?? 15000, // 加载图像超时时间
		proxy: opts.proxy, // 用于加载跨源图像的代理 URL。如果留空，则不会加载跨源图像
		useCORS: opts.useCORS ?? false, // 是否尝试使用 CORS 从服务器加载图像
	}
	console.log(resourceOptions, 'resourceOptions')
	const contextOptions = {
		logging: opts.logging ?? true,
		cache: opts.cache,
		...resourceOptions,
	}
	const windowOptions = {
		windowWidth: opts.windowWidth ?? defaultView.innerWidth, // 渲染元素时使用的窗口宽度，这可能会影响媒体查询等内容
		windowHeight: opts.windowHeight ?? defaultView.innerHeight, // 渲染元素时使用的窗口高度，这可能会影响媒体查询等内容
		scrollX: opts.scrollX ?? defaultView.pageXOffset, // 渲染元素时使用的 x 滚动位置（例如，如果元素使用 position: fixed）
		scrollY: opts.scrollY ?? defaultView.pageYOffset, // 渲染元素时使用的 y 滚动位置（例如，如果元素使用 position: fixed）
	}
	const windowBounds = new Bounds(
		windowOptions.scrollX,
		windowOptions.scrollY,
		windowOptions.windowWidth,
		windowOptions.windowHeight,
	)
	const context = new Context(contextOptions, windowBounds);
	// 如果浏览器支持，是否使用 ForeignObject 渲染
	// const foreignObjectRendering = opts.foreignObjectRendering ?? false;

	context.logger.debug( `Starting document clone with size ${windowBounds.width}x${
		windowBounds.height
	} scrolled to ${-windowBounds.left},${-windowBounds.top}`);
	return 'renderElement';
}