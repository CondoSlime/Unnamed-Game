import data from './loc.json';
const warnings = [];
export default function loc(key, ...vars){
    let result = data[key];
    if(!result){
        if(!warnings.includes(key)){
            warnings.push(key);
            console.warn("Error. Loc string", key, "not found");
        }
        return JSON.stringify(key);
    }
    for (let i=0; i<vars.length; i++){ //stolen from Evolve
        let re = new RegExp(`%${i}(?!\\d)`, "g");
        if(!re.exec(result)){
            console.error(`"%${i}" was not found in the string "${JSON.stringify(key)}" to be replace by "${vars[i]}"`);
            continue;
        }
        result = result.replace(re, vars[i]);
    }
    let re = new RegExp("%\\d+(?!\\d)", 'g');
    const remainder = result.match(re);
    if(remainder){
        console.error(`${remainder} was found in the string "${JSON.stringify(key)}", but there is no variables to make the replacement`);
    }
	return jsonEscape(result);
}

export function checkLoc(key, ...vars){ //returns false if loc doesn't exist instead of throwing a warning
    if(!data[key]){
        return false
    }
    return loc(key, vars);
}

function jsonEscape(str)  {
    return str.replace(/\n/g, "<br>");
}