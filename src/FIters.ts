
import {parse} from "./FunctionParser";

const ALLOWED_VAR_CHARACTERS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_";

export const enum PURPOSES {
    FILTER,
    MAP,
    JOIN,
    CONSUME,
    FOREACH,
    COUNT,
    REDUCE
}

const RETURNS_VALUE = [PURPOSES.JOIN, PURPOSES.CONSUME, PURPOSES.COUNT, PURPOSES.REDUCE];

export interface Block {
    content: string,
    fn: string,
    purpose: PURPOSES
}

export interface Declaration {
    varname: string,
    initializor: string,
    purpose: PURPOSES
}

export class FIter<T> {
    private vars: Declaration[]
    private valName: string
    private inLoop: Block[]
    private returnVals: string[]
    constructor(valName?: string) {
        this.vars = [];
        this.inLoop = [];
        this.valName = valName || "_";
        this.returnVals = [];
    }

    filter(fn: ((item: T, index: number) => boolean) | string) : this {
        const strFn = parse(fn.toString(), [this.valName, "i"]);
        this.inLoop.push({content: `if(!(${strFn}))continue`, purpose: PURPOSES.FILTER, fn: strFn});
        return this;
    }

    map<R>(fn: ((item: T, index: number) => R) | string) : this {
        const strFn = parse(fn.toString(), [this.valName, "i"]);
        this.inLoop.push({content: `${this.valName}=${strFn}`, purpose: PURPOSES.MAP, fn: strFn});
        return this;
    }

    join(delimiter: string) : this {
        const varname = this.rngVarname();
        if (this.inLoop.length && this.inLoop[this.inLoop.length - 1].purpose === PURPOSES.MAP) {
            const varFn = (this.inLoop.pop() as Block).fn;
            this.inLoop.push({content: `${varname}+=(${this.valName}=${varFn})+(i===l-1?'':'${delimiter}')`, fn: varFn, purpose: PURPOSES.JOIN});
        } else this.inLoop.push({content: `${varname}+=${this.valName}+(i===l-1?'':'${delimiter}')`, fn: "", purpose: PURPOSES.JOIN});
        this.vars.push({varname, initializor: "''", purpose: PURPOSES.JOIN});
        this.returnVals.push(varname);
        return this;
    }

    consume() : this {
        const varname = this.rngVarname();
        this.vars.push({varname, initializor: "[]", purpose: PURPOSES.CONSUME});
        if (this.inLoop.length && this.inLoop[this.inLoop.length - 1].purpose === PURPOSES.MAP) { 
            const varFn = (this.inLoop.pop() as Block).fn;
            this.inLoop.push({content: `${varname}.push(${varFn})`, fn: "", purpose: PURPOSES.CONSUME});
        } else this.inLoop.push({content: `${varname}.push(${this.valName})`, fn: "", purpose: PURPOSES.CONSUME});
        this.returnVals.push(varname);
        return this;
    }

    forEach(fn: ((item: T, index: number) => void) | string) : this {
        const strFn = fn.toString();
        this.inLoop.push({content: `(${strFn})(${this.valName}, i)`, fn: strFn, purpose: PURPOSES.FOREACH});
        return this;
    }

    count() : this {
        const varname = this.rngVarname();
        this.vars.push({varname, initializor: "0", purpose: PURPOSES.COUNT});
        this.inLoop.push({content: `${varname}++`, fn: "", purpose: PURPOSES.COUNT});
        this.returnVals.push(varname);
        return this;
    }

    reduce(fn: ((acc: number, item: T) => number) | string, defaultAcc: number) {
        const varname = this.rngVarname();
        const strFn = parse(fn.toString(), [varname, this.valName]);
        this.vars.push({varname, initializor: defaultAcc.toString(), purpose: PURPOSES.REDUCE});
        this.inLoop.push({content: `${varname}=${strFn}`, fn: strFn, purpose: PURPOSES.REDUCE});
        this.returnVals.push(varname);
        return this;
    }

    compile<R>(...args: string[]) : (arr: T[], ...rest: unknown[]) => R {
        if (this.inLoop.length === 0) new Function() as (arr: T[], ...rest: unknown[]) => R; 
        return new Function("arr", ...args, `l=arr.length;${this.vars.map(v => `${v.varname}=${v.initializor}`).join(";")};for(i=0;i<l;i++){${this.valName}=arr[i];${this.inLoop.map(block => block.content).join(";")}};return ${this.returnVals.length === 1 ? this.returnVals[0]:`[${this.returnVals.join(",")}]`};`) as (arr: T[], ...rest: unknown[]) => R;
    }

    private rngVarname() : string {
        const charLen = ALLOWED_VAR_CHARACTERS.length - 1;
        let id = ALLOWED_VAR_CHARACTERS[rngBtw(0, charLen)] + ALLOWED_VAR_CHARACTERS[rngBtw(0, charLen)] + rngBtw(0, 9);
        while (this.vars.some(v => v.varname === id)) {
            id = ALLOWED_VAR_CHARACTERS[rngBtw(0, charLen)] + ALLOWED_VAR_CHARACTERS[rngBtw(0, charLen)] + rngBtw(0, 9);
        }
        return id;
    }

}

function rngBtw(start = 0, end = 1) : number {
    return Math.floor(Math.random() * (end - start + 1)) - start;
}