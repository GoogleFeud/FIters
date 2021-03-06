
import {parse} from "./FunctionParser";

const ALLOWED_VAR_CHARACTERS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_";

export const enum PURPOSES {
    FILTER,
    MAP,
    JOIN,
    CONSUME,
    FOREACH,
    COUNT,
    REDUCE,
    FIRST,
    MAX,
    MIN,
    GROUP_BY
}

export interface Block {
    content: string,
    fn: string,
    purpose: PURPOSES
}

export interface Declaration {
    varname: string,
    initializor: string,
    type: "let"|"const"|"",
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

    map<R>(fn: ((item: T, index: number) => R) | string) : FIter<R> {
        const strFn = parse(fn.toString(), [this.valName, "i"]);
        this.inLoop.push({content: `${this.valName}=${strFn}`, purpose: PURPOSES.MAP, fn: strFn});
        return this as unknown as FIter<R>;
    }

    join(delimiter: string) : this {
        const raw = delimiter.replace(/\n/, "\\n");
        const varname = this.rngVarname();
        if (this.inLoop.length && this.inLoop[this.inLoop.length - 1].purpose === PURPOSES.MAP) {
            const varFn = (this.inLoop.pop() as Block).fn + `+'${raw}'`;
            this.inLoop.push({content: `${varname}+=${varFn}`, fn: varFn, purpose: PURPOSES.MAP});
        } else this.inLoop.push({content: `${varname}+=${this.valName}+'${raw}'`, fn: "", purpose: PURPOSES.JOIN});
        this.vars.push({varname, initializor: "''", purpose: PURPOSES.JOIN, type:"let"});
        this.returnVals.push(`${varname}.slice(0, ${varname}.length-${delimiter.length})`);
        return this;
    }

    consume() : this {
        const varname = this.rngVarname();
        this.vars.push({varname, initializor: "[]", purpose: PURPOSES.CONSUME, type:"const"});
        if (this.inLoop.length && this.inLoop[this.inLoop.length - 1].purpose === PURPOSES.MAP) { 
            const varFn = (this.inLoop.pop() as Block).fn;
            this.inLoop.push({content: `${varname}.push(${varFn})`, fn: "", purpose: PURPOSES.CONSUME});
        } else this.inLoop.push({content: `${varname}.push(${this.valName})`, fn: "", purpose: PURPOSES.CONSUME});
        this.returnVals.push(varname);
        return this;
    }


    forEach(fn: ((item: T, index: number) => void) | string) : this {
        const strFn = parse(fn.toString(), [this.valName, "i"]);
        this.inLoop.push({content: strFn, fn: strFn, purpose: PURPOSES.FOREACH});
        return this;
    }

    count() : this {
        const varname = this.rngVarname();
        this.vars.push({varname, initializor: "0", purpose: PURPOSES.COUNT, type: "let"});
        this.inLoop.push({content: `${varname}++`, fn: "", purpose: PURPOSES.COUNT});
        this.returnVals.push(varname);
        return this;
    }

    reduce(fn: ((acc: number, item: T) => number) | string, defaultAcc: number) : this {
        const varname = this.rngVarname();
        const strFn = parse(fn.toString(), [varname, this.valName]);
        this.vars.push({varname, initializor: defaultAcc.toString(), purpose: PURPOSES.REDUCE, type: "let"});
        this.inLoop.push({content: `${varname}=${strFn}`, fn: strFn, purpose: PURPOSES.REDUCE});
        this.returnVals.push(varname);
        return this;
    }
    
    first(immediate = true) : this {
        if (immediate) this.inLoop.push({content: `return ${this.valName}`, fn: "", purpose: PURPOSES.FIRST});
        else {
            const varname = this.rngVarname();
            this.vars.push({varname, initializor: "this", purpose: PURPOSES.FIRST, type: "let"});
            this.inLoop.push({content: `if (${varname}===this)${varname}=${this.valName}`, fn: "", purpose: PURPOSES.FIRST});
            this.returnVals.push(varname);
        }
        return this;
    }

    max() : this {
        const varname = this.rngVarname();
        this.vars.push({varname, initializor: "0", purpose: PURPOSES.MAX, type: "let"});
        this.inLoop.push({content: `if(${this.valName}>${varname}) ${varname}=${this.valName}`, fn: "", purpose: PURPOSES.MAX});
        this.returnVals.push(varname);
        return this;
    }

    min() : this {
        const varname = this.rngVarname();
        this.vars.push({varname, initializor: "Infinity", purpose: PURPOSES.MIN, type: "let"});
        this.inLoop.push({content: `if(${this.valName}<${varname}) ${varname}=${this.valName}`, fn: "", purpose: PURPOSES.MAX});
        this.returnVals.push(varname);
        return this;
    }

    groupBy(fn: ((item: T, index: number) => void) | string) : this {
        const fnstr = parse(fn.toString(), [this.valName, "i"]);
        const varname = this.rngVarname();
        this.vars.push({varname, initializor: "{}", purpose: PURPOSES.GROUP_BY, type: "const"});
        this.inLoop.push({content: `${varname}[${fnstr}]?${varname}[${fnstr}].push(${this.valName}):${varname}[${fnstr}]=[${this.valName}]`, fn: "", purpose: PURPOSES.GROUP_BY});
        this.returnVals.push(varname);
        return this;
    }

    compile<T, R>(...args: string[]) : (arr: T[], ...rest: unknown[]) => R {
        if (this.inLoop.length === 0) new Function() as (arr: T[], ...rest: unknown[]) => R; 
        if (this.inLoop.length === 2 && this.inLoop[0].purpose === PURPOSES.FILTER) {
            const other = this.inLoop.pop() as Block;
            const filter = this.inLoop.pop() as Block;
            this.inLoop.push({content: `if (${filter.fn}) ${other.content}`, fn: "", purpose: PURPOSES.FILTER});
        }
        return new Function("arr", ...args, `let l=arr.length;${this.vars.map(v => `${v.type} ${v.varname}=${v.initializor}`).join(";")};for(let i=0;i<l;i++){let ${this.valName}=arr[i];${this.inLoop.map(block => block.content).join(";")}};return ${this.returnVals.length === 1 ? this.returnVals[0]:`[${this.returnVals.join(",")}]`};`) as (arr: T[], ...rest: unknown[]) => R;
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
