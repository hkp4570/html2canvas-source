export interface loggerOptions {
    id: string,
    enabled: boolean,
}

export class Logger {
    // 保存该类的实例
    static instances: { [key: string]: Logger } = {};

    private readonly id: string;
    private readonly enabled: boolean;
    private readonly start: number;

    constructor({id, enabled}: loggerOptions) {
        this.id = id;
        this.enabled = enabled;
        this.start = Date.now();
    }
    debug(...args:unknown[]):void{
       
        if(this.enabled){
            if(typeof window !== 'undefined' && window.console && typeof console.debug === 'function'){
                console.debug(this.id, `${this.getTime()}ms`, ...args);
             }else{
                console.info(...args);
             }
        }
    };
    getTime():number{
        return Date.now() - this.start;
    }
}