import { Context } from "../core/context";
import { CSSParsedDeclaration } from "../css/index";
import { isHTMLElementNode } from "./node-parser";
import { Bounds, parseBounds } from "../css/layout/bounds";
import { TextContainer } from "./text-container";

// 如果ElementContainer的flags为CREATES_STACKING_CONTEXT，则表示该元素创建了一个堆叠上下文
// 如果ElementContainer的flags为CREATES_REAL_STACKING_CONTEXT，则表示该元素创建了一个真实的堆叠上下文
// 如果ElementContainer的flags为IS_LIST_OWNER，则表示该元素是一个列表的拥有者
// 如果ElementContainer的flags为DEBUG_RENDER，则表示该元素是一个调试渲染的元素
export const enum FLAGS {
    CREATES_STACKING_CONTEXT = 1 << 1,
    CREATES_REAL_STACKING_CONTEXT = 1 << 2,
    IS_LIST_OWNER = 1 << 3,
    DEBUG_RENDER = 1 << 4
}

export class ElementContainer {
    readonly styles: CSSParsedDeclaration;
    readonly elements: ElementContainer[] = [];
    readonly textNodes: TextContainer[] = [];
    bounds: Bounds;
    flags = 0;

    constructor(protected readonly context: Context, element: Element){
        this.styles = new CSSParsedDeclaration(context, window.getComputedStyle(element, null));

        if(isHTMLElementNode(element)){
            if(this.styles.animationDuration.some(duration => duration > 0)){
                element.style.animationDuration = '0s';
            }

            if(this.styles.transform !== null){
                element.style.transform = 'none';
            }
        }

        this.bounds = parseBounds(this.context, element);
    }
}