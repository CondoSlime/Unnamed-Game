import data from './loc.json';
export default function loc(keys, ...vars){
    if(typeof keys !== "object"){ keys = [keys]; };
    let result = data[keys[0]];
    if(!result){
        console.log("Error. Loc string", keys, "not found");
        return JSON.stringify(keys);
    }
    for(let i=1;i<keys.length;i++){
        result = result[keys[i]];
        if(!result){
            console.log("Error. Loc string", keys, "not found");
            return JSON.stringify(keys);
        }
    }
    for (let i=0; i<vars.length; i++){ //stolen from Evolve
        let re = new RegExp(`%${i}(?!\\d)`, "g");
        if(!re.exec(result)){
            console.error(`"%${i}" was not found in the string "${JSON.stringify(keys)}" to be replace by "${vars[i]}"`);
            continue;
        }
        result = result.replace(re, vars[i]);
    }
    let re = new RegExp("%\\d+(?!\\d)", 'g');
    const remainder = result.match(re);
    if(remainder){
        console.error(`${remainder} was found in the string "${JSON.stringify(keys)}", but there is no variables to make the replacement`);
    }
	return jsonEscape(result);
}

function jsonEscape(str)  {
    return str.replace(/\n/g, "<br>");
}