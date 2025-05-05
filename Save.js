import {saveValues, values, study, statValues, updateStage, initRefValues, skillables, skillablesOrder, updateEffects} from './Values.js';
import {deepClone, mergeDeep} from './Functions.js';
import {ref} from 'vue';
import * as lzString from 'lz-string';


export const save = ref({});

export function saveGame(){
	window.localStorage.setItem("unnamed-project", compressSave(save.value));
}
export function loadGame(result=false, reset=false){
    let decoded = false;
    if(result){
        decoded = result;
    }
    else{
        const localStorage = window.localStorage.getItem("unnamed-project");
        if(localStorage){
            decoded = JSON.parse(lzString.decompressFromBase64(localStorage));
        }
    }
    if(decoded){
        save.value = mergeDeep(deepClone(saveValues), reset ? {} : deepClone(decoded));
    }
    else{
        //console.warn('something went wrong loading the save file!');
    }
}
export function initSave(){
    //save.value.res = deepClone(saveValues.res);
    /*for(let [index, entry] of Object.entries(saveValues.stats)){
        save.value.stats[index] = entry;
    }*/
    /*save.value.timers = deepClone(saveValues.timers);
    save.value.rivals = deepClone(saveValues.rivals);
    save.value.study = deepClone(saveValues.study);
    save.value.settings = deepClone(saveValues.settings);*/
    //for(let [index, entry] of rivals){
    //}
}
export function initGame(saveString=false, reset=false){
    save.value = deepClone(saveValues);
    statValues.value.initialize(values.stats, skillables.value.skills, skillables.value.structures);
    if(!reset){
        loadGame(saveString, reset);
    }
    initRefValues();
    const studyTypes = deepClone(Object.keys(skillablesOrder.value));
    for(let i=0;i<studyTypes.length; i++){
        let which = studyTypes[i];
        for(let [index, entry] of Object.entries(skillables.value[which])){
            const item = save.value[which][index] || {};
            skillables.value[which][index].level = item.level || 0;
            skillables.value[which][index].exp = item.exp || 0;
            skillables.value[which][index].unlocked = item.unlocked || false;
        }
    }
    updateStage(); //updateEffects happens in here already.
    //updateEffects(true); //update stats immediately on page load.
}
export function resetGame(){
    initGame(false, true);
}
export function exportGame(){
    const elem = document.getElementById("saveArea");
    if(elem){
        elem.value = window.localStorage.getItem("unnamed-project");
    }
}
export function compressSave(save){
    return lzString.compressToBase64(JSON.stringify(save));
}
export function importGame(){
    const elem = document.getElementById("saveArea");
    const result = lzString.decompressFromBase64(elem.value);
    if(result){
        initGame(JSON.parse(result), false);
        elem.value = "";
    }
    else if(elem){
        elem.value = "Error: Invalid save";
        console.error('Imported invalid save file!');
    }
}