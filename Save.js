import {saveValues, values, study, statValues, updateStage, initRefValues, skills, structures, updateSkills, skillsOrder} from './Values.js';
import {deepClone, mergeDeep} from './Functions.js';
import {ref} from 'vue';
import * as lzString from 'lz-string';


export const save = ref({
  res:{

  },
  skills:{

  },
  timers:{

  },
  misc:{

  },
  rivals:{

  },
  study:{

  },
  settings:{

  }
});
let saveTemplate = {};

export function saveGame(){
	window.localStorage.setItem("unnamed-project", lzString.compressToBase64(JSON.stringify(save.value)));
}
export function loadGame(result=false){
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
        save.value = mergeDeep(deepClone(saveValues), deepClone(decoded));
        /*for(let [index, entry] of Object.entries(skills.value)){
            if(!save.value.skills[index]){
                save.value.skills[index] = {exp:0, level:0, unlocked:false, enabled:false};
            }
        }*/
        /*for(let [index, entry] of Object.entries(values.stats)){
            console.log(index);
            if(!save.value.skills[index]){
                save.value.skills[index] = decoded.stats[index];
            }
        }*/
        /*save.value.rivals = deepClone(decoded.rivals);
        save.value.study = deepClone(decoded.study);
        save.value.settings = deepClone(decoded.settings);*/
        for(let [index, entry] of Object.entries(save.value.skills)){
            if(skills.value[index]){
                skills.value[index].level = entry.level;
                skills.value[index].exp = entry.exp;
                skills.value[index].unlocked = entry.unlocked;
            }
        }
        for(let i=0;i<save.value.study.skillOrder.length; i++){
            const id = save.value.study.skillOrder[i];
            if(!skills.value[id] || !skills.value[id].unlocked){
                study.value.switchSkill(id);
            }
        }
    }
    else{
        //console.warn('something went wrong loading the save file!');
    }
}
export function initSave(){
    //save.value.res = deepClone(saveValues.res);
    save.value = deepClone(saveValues);
    save.value.skills = {};
    /*for(let [index, entry] of Object.entries(saveValues.stats)){
        save.value.stats[index] = entry;
    }*/
    /*save.value.timers = deepClone(saveValues.timers);
    save.value.rivals = deepClone(saveValues.rivals);
    save.value.study = deepClone(saveValues.study);
    save.value.settings = deepClone(saveValues.settings);*/
    saveTemplate = deepClone(save.value);
    //for(let [index, entry] of rivals){
    //}
}
export function initGame(reset=false){
    initSave();
    statValues.value.initialize(values.stats, skills.value, structures.value);
    if(!reset){
        loadGame();
    }
    initRefValues();
    updateStage();
    updateSkills(true); //update stats immediately on page load.
}
export function resetGame(){
    initSave(true);
}
export function exportGame(){
    const elem = document.getElementById("saveArea");
    if(elem){
        elem.value = window.localStorage.getItem("unnamed-project");
    }
}
export function importGame(){
    const elem = document.getElementById("saveArea");
    const result = lzString.decompressFromBase64(elem.value);
    if(result){
        loadGame(JSON.parse(result));
        elem.value = "";
    }
    else if(elem){
        elem.value = "Error: Invalid save";
        console.error('Imported invalid save file!');
    }
}