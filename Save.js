import {saveValues, values, study, statValues, skills, skillsOrder} from './Values.js';
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
  stats:{

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
    if(result){
        save.value = result
    }
    else{
        const localStorage = window.localStorage.getItem("unnamed-project");
        if(localStorage){
            const decoded = JSON.parse(lzString.decompressFromBase64(localStorage));
            save.value = mergeDeep(deepClone(saveValues), deepClone(decoded));
            for(let [index, entry] of Object.entries(skills.value)){
                if(!save.value.skills[index]){
                    save.value.skills[index] = {exp:0, level:0, unlocked:false, enabled:false};
                }
            }
            for(let [index, entry] of Object.entries(values.stats)){
                if(!save.value.skills[index]){
                    save.value.skills[index] = decoded.stats[index];
                }
            }
            /*save.value.rivals = deepClone(decoded.rivals);
            save.value.study = deepClone(decoded.study);
            save.value.settings = deepClone(decoded.settings);*/
            for(let i=0;i<save.value.study.order.length; i++){
                const id = save.value.study.order[i];
                if(!save.value.skills[id].unlocked){
                    study.value.switch(id);
                }
            }
        }
    }
}
export function initSave(){
    //save.value.res = deepClone(saveValues.res);
    save.value = deepClone(saveValues);
    save.value.skills = {};
    for(let [index, entry] of Object.entries(skills.value)){
        save.value.skills[index] = {exp:0, level:0, unlocked:false, enabled:false};
    }
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
export function initGame(){
    initSave();
    statValues.value.initialize(values.stats, skills.value);
    loadGame();
    for(let [index, entry] of Object.entries(skills.value)){
      entry.update(); //update stats immediately on page load.
    }
}
export function resetGame(){
    initSave();
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