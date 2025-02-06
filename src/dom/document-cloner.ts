import { Context } from "../core/context";
import { isSVGElementNode, isTextNode, isElementNode, isHTMLElementNode, isVideoElement, isSlotElement, isScriptElement, isStyleElement } from "./node-parser";

export interface CloneOptions {
    ignoreElements?: (element: Element) => boolean;
    onclone?: (document: Document, element: HTMLElement) => void;
    allowTaint?: boolean;
}
const IGNORE_ATTRIBUTE = 'data-html2canvas-ignore';
// 克隆配置
export type CloneConfigurations = {
    inlineImages: boolean;
    copyStyles: boolean;
} & CloneOptions;
// 主要负责将 DOM 元素及其子元素进行深度克隆，以便后续进行截图渲染。
export class DocumentCloner {
    private readonly scrolledElements: [Element, number, number][]; // 有滚动条的元素
    private readonly referenceElement: HTMLElement;
    private readonly documentElement: HTMLElement;
    private quoteDepth:number;
    clonedReferenceElement: HTMLElement;
    
    constructor(private readonly context: Context, element: HTMLElement, private readonly options: CloneConfigurations){
        this.scrolledElements = [];
        this.referenceElement = element;
        this.quoteDepth = 0;

        if(!element.ownerDocument){
            throw new Error('Cloned element does not have an owner document');
        }
        this.documentElement = this.cloneNode(element.ownerDocument.documentElement, false) as HTMLElement;
    };
    createElementClone<T extends HTMLElement | SVGElement>(node: T): HTMLElement | SVGElement{
        // ? debugger
        // if(isDebugging())
        const clone = node.cloneNode(false) as T;
        return clone;
    };
    appendChildNode(clone: HTMLElement | SVGElement, child: Node, copyStyles:boolean):void{
        const elementNode = isElementNode(child); // 是否是element元素
        const scriptElement = elementNode && isScriptElement(child); // 是否是script元素
        const ignoreElement = elementNode && (!child.hasAttribute(IGNORE_ATTRIBUTE) &&
            (typeof this.options.ignoreElements !== 'function' || !this.options.ignoreElements(child))); // 是否是被忽略元素
        if(!elementNode || (!scriptElement || ignoreElement)){
            if (!this.options.copyStyles || !isElementNode(child) || !isStyleElement(child)) {
                clone.appendChild(this.cloneNode(child, copyStyles));
            }
        }
    };
    cloneChildNodes(node: Element, clone: HTMLElement | SVGElement, copyStyles:boolean):void{
        for(let child = node.shadowRoot ? node.shadowRoot.firstChild : node.firstChild; child; child = child.nextSibling){
            // 如果child是slot元素，并且有assignedNodes方法，则递归克隆assignedNodes
            if(isElementNode(child) && isSlotElement(child) && typeof child.assignedNodes === 'function'){
                // TODO: 插槽元素处理
            }else{
                this.appendChildNode(clone, child, copyStyles);
            }
        }
    };
    cloneNode(node:Node, copyStyles:boolean): Node{
        // node 首次是html
        if(isTextNode(node)){
            // TODO: 文本节点处理
        }

        // 文档节点的ownerDocument为null  cloneNode:https://developer.mozilla.org/zh-CN/docs/Web/API/Node/cloneNode
        if(!node.ownerDocument){
            // 只克隆节点本身
            return node.cloneNode(false);
        }

        const window = node.ownerDocument.defaultView;
        if(window && isElementNode(node) && (isHTMLElementNode(node) || isSVGElementNode(node))){
            const clone = this.createElementClone(node);
            clone.style.transitionProperty = 'none'; // 过渡属性设置为none

            // const style = window.getComputedStyle(node);
            // const styleBefore = window.getComputedStyle(node, ':before');
            // const styleAfter = window.getComputedStyle(node, ':after');

            if(!isVideoElement(node)){
                this.cloneChildNodes(node, clone, copyStyles);
            }
            return clone;
        }
        return node.cloneNode(false);
    }
}