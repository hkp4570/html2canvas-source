import { Context } from "../core/context";
import { 
    isSVGElementNode, 
    isTextNode, 
    isElementNode, 
    isHTMLElementNode, 
    isVideoElement, 
    isSlotElement, 
    isScriptElement, 
    isStyleElement,
    isBodyElement,
} from "./node-parser";
import { Bounds } from "../css/layout/bounds";

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
    clonedReferenceElement?: HTMLElement;
    
    constructor(private readonly context: Context, element: HTMLElement, private readonly options: CloneConfigurations){
        this.scrolledElements = [];
        this.referenceElement = element;
        this.quoteDepth = 0;

        if(!element.ownerDocument){
            throw new Error('Cloned element does not have an owner document');
        }
        this.documentElement = this.cloneNode(element.ownerDocument.documentElement, false) as HTMLElement;
    };
    toIFrame(ownerDocument: Document, windowSize: Bounds){
        const iframe:HTMLIFrameElement = createIFrameContainer(ownerDocument, windowSize);

        // 如果iframe.contentWindow为null，则说明iframe未加载完成 获取iframe的window对象
        if(!iframe.contentWindow){
            return Promise.reject(`Unable to find iframe window`);
        }

        const scrollX = (ownerDocument.defaultView || window).scrollX;
        const scrollY = (ownerDocument.defaultView || window).scrollY;

        const cloneWindow = iframe.contentWindow;
        const documentClone: Document = cloneWindow.document;

        const iframeLoad = iframeLoader(iframe).then(async () => {
            if(cloneWindow){
                cloneWindow.scrollTo(windowSize.left, windowSize.top);
            }

            const onclone = this.options.onclone;
            const referenceElement = this.clonedReferenceElement;

            if (typeof referenceElement === 'undefined') {
                return Promise.reject(`Error finding the ${this.referenceElement.nodeName} in the cloned document`);
            }

            // 等待网页中所有字体都加载完成
            if (documentClone.fonts && documentClone.fonts.ready) {
                await documentClone.fonts.ready;
            }

            // 等待所有图片加载完成
            if(/(AppleWebKit)/g.test(navigator.userAgent)){
                await imagesReady(documentClone);
            }

            if(typeof onclone === 'function'){
                return Promise.resolve()
                .then(() => onclone(documentClone, referenceElement))
                .then(() => iframe)
            }
            return iframe;
        })

        // * 将要克隆的html结构写入到iframe的document中
        documentClone.open();
        documentClone.write(`${serializeDoctype(document.doctype)}<html></html>`);
        // ？可能需要处理克隆文档时父文档的滚动
        documentClone.replaceChild(documentClone.adoptNode(this.documentElement),documentClone.documentElement);
        documentClone.close();

        return iframeLoad;
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
            // node.data 是文本内容
            return document.createTextNode(node.data);
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
            
            if(this.referenceElement === node && isHTMLElementNode(node)){
                this.clonedReferenceElement = clone;
            }
            if(isBodyElement(node)){
                // TODO: 处理body元素
                console.log('body', node);
            }

            if(!isVideoElement(node)){
                this.cloneChildNodes(node, clone, copyStyles);
            }
            return clone;
        }
        return node.cloneNode(false);
    }
}

const createIFrameContainer = (ownerDocument: Document, bounds: Bounds) => {
    const cloneIframeContainer = ownerDocument.createElement('iframe');

    cloneIframeContainer.className = 'html2canvas-container';
    cloneIframeContainer.style.visibility = 'hidden';
    cloneIframeContainer.style.position = 'fixed';
    cloneIframeContainer.style.left = '-10000px';
    cloneIframeContainer.style.top = '0px';
    cloneIframeContainer.style.border = '0';
    cloneIframeContainer.width = bounds.width.toString();
    cloneIframeContainer.height = bounds.height.toString();
    cloneIframeContainer.scrolling = 'no'; // ios won't scroll without it
    cloneIframeContainer.setAttribute(IGNORE_ATTRIBUTE, 'true');
    ownerDocument.body.appendChild(cloneIframeContainer);

    return cloneIframeContainer;
}

// https://developer.mozilla.org/zh-CN/docs/Web/API/DocumentType
const serializeDoctype = (doctype?: DocumentType | null):string => {
    let str = '';
    if(doctype){
        str += '<!DOCTYPE ';
        if(doctype.name){
            str += doctype.name;
        }
        if (doctype.internalSubset) {
            str += doctype.internalSubset;
        }
        if(doctype.publicId){
            str += `"${doctype.publicId}"`;
        }
        if(doctype.systemId){
            str += `"${doctype.systemId}"`;
        }
        str += '>';
    }
    return str;
}
const iframeLoader = (iframe: HTMLIFrameElement):Promise<HTMLIFrameElement> => {
    return new Promise((resolve, reject) => {
        const cloneWindow = iframe.contentWindow;
        if(!cloneWindow){
            return reject('No window assigned for iframe');
        }
        const documentClone: Document = cloneWindow.document;
        
        cloneWindow.onload = iframe.onload = () => {
            cloneWindow.onload = iframe.onload = null;
            const interval = setInterval(() => {
                if (documentClone.body.childNodes.length > 0 && documentClone.readyState === 'complete') {
                    clearInterval(interval);
                    resolve(iframe);
                }
            }, 50)
        }
    })
}
const imageReady = (img:HTMLImageElement):Promise<Event | void | string> => {
    return new Promise((resolve) => {
        if(img.complete){
            resolve();
            return;
        }
        if(!img.src){
            resolve();
            return;
        }
        img.onload = resolve;
        img.onerror = resolve;
    })
}
const imagesReady = (document:Document):Promise<unknown[]> => {
    const images = [].slice.call(document.images,0);
    const imagesMap = images.map(imageReady);
    return Promise.all(imagesMap);
}