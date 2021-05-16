
export const enum PARSE_STATE {
    PARAMS,
    EXP
}


// What this algorithm does:
// - Accepts a function string, returns the expressions inside the function, replacing the function args with the values inside "parseMap"
// - Removes any uneeded characters (empty spaces, new lines)
// - Only works for arrow functions
export function parse(fn: string, parseMap: string[]) : string {
    if (fn.startsWith("function")) return `(${fn})(${parseMap.join(",")})`;
    fn += " ";
    const fnLen = fn.length;
    let res = "";
    // The current token
    let current = "";
    // If the parser is currently in a string
    let in_str = false;
    // The state the parser is in - whether it's reading parameters or the expresion itself
    let state = PARSE_STATE.PARAMS;
    // The function params
    const params: string[] = [];

    let isPrevArrow = false;
    for (let i=0; i < fnLen + 1; i++) {
        const char = fn[i];

        // If the next token is => and the state is params, transition to the other state
        if (char === "=" && fn[i + 1] === ">" && state === PARSE_STATE.PARAMS) {
            state = PARSE_STATE.EXP;
            isPrevArrow = true;
            // Skip over the =>
            i++;
            continue;
        }

        // Cancel the optimization if the function has multiple expressions
        if (isPrevArrow && char === "{") return `(${fn})(${parseMap.join(",")})`;

        // Toggle string mode
        if (char === "\"") in_str = !in_str;

        // If the current character is valid in an identifier, add it to the current identifier
        if (/[a-zA-Z0-9_]/.test(char)) {
            current += char;
            continue;
        }

        // If not...
        if (state === PARSE_STATE.PARAMS && current) params.push(current);
        else {
            const param = params.indexOf(current);
            if (param !== -1) res += parseMap[param];
            else res += current;
        }
        current = "";

        if (char) {
        if (in_str) res += char;
        else {
            if (state !== PARSE_STATE.PARAMS && (char !== " " && char !== "\n" && char !== ";")) {
            res += char;
            isPrevArrow = false;
            }
        }
        }

    }
    return res;
}