import { Context } from "../core/context";
import { CSSParsedDeclaration } from "../css/index";
import { isHTMLElementNode } from "./node-parser";
import { Bounds, parseBounds } from "../css/layout/bounds";
import { TextContainer } from "./text-container";
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