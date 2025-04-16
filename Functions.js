export function deepClone(obj){
    return JSON.parse(JSON.stringify(obj));
}

export function format(num, dec, type) { //TODO: can't handle negative numbers;
    if(type.includes("eng")){
        if(num === 0){
            return num;
        }
        const log = Math.floor(Math.log10(num));
        const eng = (log % 3);
        if(Math.abs(log) < 4){
            const log = Math.max(0, Math.floor(Math.log10(num)));
            const mult = 10**Math.max(0, (dec-log-1));
            return (Math.round(num * mult) / mult);
        }
        return (num / 10 ** (log-Math.abs(eng))).toFixed(dec-Math.abs(eng)-1) + 'e' + (log-eng);
    }
}

export function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}

export function mergeDeep(target, ...sources) {
    if (!sources.length) return target;
    const source = sources.shift();
    
    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key]) Object.assign(target, { [key]: {} });
                mergeDeep(target[key], source[key]);
            } else {
                Object.assign(target, { [key]: source[key] });
            }
        }
    }

    return mergeDeep(target, ...sources);
}

export const splitmix32 = (a) => {
	return function() {
        a |= 0;
        a = a + 0x9e3779b9 | 0;
        let t = b ^ (b >>> 16);
        t = Math.imul(t, 0x21f0aaad);
        t = t ^ (t >>> 15);
        t = Math.imul(t, 0x735a2d97);
        return ((t = t ^ (t >>> 15)) >>> 0) / 4294967296;
    }
}