import { Context } from "../core/context";
import { ElementContainer, FLAGS } from "./element-container";
import { TextContainer } from "./text-container";
import { CSSParsedDeclaration } from "../css/index";


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
export const isTextareaElement = (element: Element): element is HTMLTextAreaElement => element.tagName === 'TEXTAREA';
export const isSVGElement = (element: Element): element is SVGElement => element.tagName === 'SVG';
export const isSelectElement = (element: Element): element is HTMLSelectElement => element.tagName === 'SELECT';

const LIST_OWNERS = ['OL', 'UL', 'MENU'];

export const createContainer = (context: Context, element: Element) => {
    // TODO: 各种类型元素容器创建
    return new ElementContainer(context, element);
}

const parseNodeTree = (context: Context, node: Node, parent: ElementContainer, root: ElementContainer) => {
    for (let childNode = node.firstChild, nextNode; childNode; childNode = nextNode) {
        nextNode = childNode.nextSibling;

        if (isTextNode(childNode) && childNode.data.trim().length > 0) {
            parent.textNodes.push(new TextContainer(context, childNode, parent.styles));
        } else if (isElementNode(childNode)) {
            if (isSlotElement(childNode) && childNode.assignedNodes) {
                childNode.assignedNodes().forEach((childNode) => parseNodeTree(context, childNode, parent, root));
            } else {
                const container = createContainer(context, childNode);
                if (container.styles.isVisible()) {
                    if (createsRealStackingContext(childNode, container, root)) {
                        container.flags |= FLAGS.CREATES_REAL_STACKING_CONTEXT;
                    } else if (createsStackingContext(container.styles)) {
                        container.flags |= FLAGS.CREATES_STACKING_CONTEXT;
                    }

                    if (LIST_OWNERS.indexOf(childNode.tagName) !== -1) {
                        container.flags |= FLAGS.IS_LIST_OWNER;
                    }

                    parent.elements.push(container);
                    childNode.slot;
                    if (childNode.shadowRoot) {
                        parseNodeTree(context, childNode.shadowRoot, container, root);
                    } else if (
                        !isTextareaElement(childNode) &&
                        !isSVGElement(childNode) &&
                        !isSelectElement(childNode)
                    ) {
                        parseNodeTree(context, childNode, container, root);
                    }
                }
            }
        }
    }
};

export const parseTree = (context: Context, element: Element) => {
    // bounds - 位置信息（宽/高、横/纵坐标）
    // elements - 子元素信息
    // flags - 用来决定如何渲染的标志
    // styles - 样式描述信息
    // textNodes - 文本节点信息
    const container = createContainer(context, element);
    const cloneContainer = window.structuredClone(container);
    console.log(cloneContainer, 'container  parseNodeTree之前');
    container.flags |= FLAGS.CREATES_REAL_STACKING_CONTEXT;
    // 处理textNodes
    parseNodeTree(context, element, container, container);
    console.log(container, 'container parseNodeTree之后');
    return container;
}

const createsRealStackingContext = (node: Element, container: ElementContainer, root: ElementContainer): boolean => {
    return (
        container.styles.isPositionedWithZIndex() ||
        container.styles.opacity < 1 ||
        container.styles.isTransformed() ||
        (isBodyElement(node) && root.styles.isTransparent())
    );
};

const createsStackingContext = (styles: CSSParsedDeclaration): boolean => styles.isPositioned() || styles.isFloating();
