import { Context } from "../core/context";
import { ElementContainer } from "./element-container";
export const isTextNode = (node:Node): node is Text => node.nodeType === Node.TEXT_NODE;
export const isElementNode = (node:Node): node is Element => node.nodeType === Node.ELEMENT_NODE;
export const isHTMLElementNode = (node:Node): node is HTMLElement => {
    return isElementNode(node) && typeof (node as HTMLElement).style !== 'undefined' && !isSVGElementNode(node);
}
export const isSVGElementNode = (element:Element):element is SVGAElement => {
    return typeof (element as SVGElement).className === 'object';
}

export const isVideoElement = (element:Element):element is HTMLVideoElement => element.tagName === 'VIDEO';
export const isSlotElement = (element:Element): element is HTMLSlotElement => element.tagName === 'SLOT';
export const isScriptElement = (element:Element): element is HTMLScriptElement => element.tagName === 'SCRIPT';
export const isStyleElement = (element:Element): element is HTMLStyleElement => element.tagName === 'STYLE';
export const isTemplateElement = (element:Element): element is HTMLTemplateElement => element.tagName === 'TEMPLATE';
export const isLinkElement = (element:Element): element is HTMLLinkElement => element.tagName === 'LINK';
export const isMetaElement = (element:Element): element is HTMLMetaElement => element.tagName === 'META';
export const isBaseElement = (element:Element): element is HTMLBaseElement => element.tagName === 'BASE';
export const isHeadElement = (element:Element): element is HTMLHeadElement => element.tagName === 'HEAD';
export const isBodyElement = (element:Element): element is HTMLBodyElement => element.tagName === 'BODY';
export const isHTMLElement = (element: Element): element is HTMLHtmlElement => element.tagName === 'HTML';

export const createContainer = (context: Context, element: Element) => {
    // TODO: 各种类型元素容器创建
    return new ElementContainer(context, element);
}

export const parseTree = (context: Context, element: Element) => {
    const container = createContainer(context, element);
}
