import {deepClone, format} from './Functions.js';
import {statValues, values, refValues} from './Values.js';
import {save} from './Save.js';


class levelable{

    constructor(expMax, scaling, maxLevel){
        this.expMax = expMax;
        this.scaling = scaling;
        this.maxLevel = maxLevel; //maximum level. Level can not go higher than this amount. Skill becomes automatically unfocused when this happens, -1 means no cap.
        this.exp = 0;
        this.levelSpeed = 0; //amount of average levels that this skill gains per second. Used for progress bar animations
        this.level = 0;
        this.trueLevel = 0; //level with effects to skill level modifiers applied. This is the value that is used for calculating stat effects

    }
    _advance(amount, skipLevel=false){
        //this.exp += this.speed * mult;
        this.exp += amount;
        this.levelSpeed = amount / this.required();
        if(!skipLevel && this.exp >= this.required()){
            //const levels = Math.floor(this.exp / this.required());
            const levels = Math.floor(this.convertExp(this.exp));
            const exp = this.convertLevel(levels, this.level);
            this.exp -= exp;
            this.raiseLevel(levels); //effects are updated immediately after a level again, this ensures modifiers that affect skill effects directly get priority.
        }
    }
    convertExp(exp, level=this.level){
        //returns amount of levels that you get if you add an amount of exp to a specific level
        if(level){
            exp += this.convertLevel(level, 0);
        }
        let result = 0;
        if(this.scaleEffect === 1){
            result = exp / this.priceEffect;
        }
        else{
            result = Math.log((this.scaleEffect -1) * exp/this.priceEffect +1) / Math.log(this.scaleEffect);
        }
        return result - level
    }
    convertLevel(amount=1, start=this.level, raw=false){
        //returns the amount of exp needed to go up a specified amount of levels at a starting point.
        let result = 0;
        if(raw){
            if(this.scaling === 0){ //avoid division by 0
                result += start + this.priceEffect * amount;
            }
            result += this.priceEffect * (Math.pow(this.scaling, (amount+start)) -1) / (this.scaling - 1);
        }
        else{
            const scaleEffect = this.scaleEffect;
            if(scaleEffect === 1){ //avoid division by 0
                result += this.priceEffect * (amount+start);
            }
            else{
                result += this.priceEffect * (Math.pow(scaleEffect, (amount+start)) -1) / (scaleEffect - 1);
            }
        }
        if(start > 0){
            result -= this.convertLevel(start, 0, raw);
        }
        return result;
    }
    raiseLevel(val=1, skipEffect=false){
        if(this.maxLevel != -1 && this.level + val >= this.maxLevel){
            this.level = Math.max(this.maxLevel, this.level);
        }
        else{
            this.level += val;
        }
        if(!skipEffect){
            this.levelEffect();
        }
        return this.trueLevel;
    }
    required(raw=false){
        //required exp for next level
        if(raw){
            //ignore cost reduction effects
            return this.priceEffect * (this.scaling ** this.level);
        }
        return this.priceEffect * (this.scaleEffect ** this.level);
    }
    _studyTotal(){ //Returns total speed of an item. Explanation of how this works is in values.js
        let time = 0;
        let result = 0;
        for(let [index, entry] of Object.entries(this.types)){
            time += 1 / statValues.value.effectTotal(index) * entry;
        }
        result = 1 / time;
        for(let i=0;i<this.tags.length;i++){ //apply speed modifiers that are dependent to this item's tags.
            result *= statValues.value.skillTagStudyMods(this.tags[i]);
        }
        return result;
    }
    priceTotal(){ //Returns experience required multiplier of an item (converts divider into mult)
        /*exp requirement mult
        stat1 = 3, stat2 = 2, stat3 = 1
        let mult = 1 / (3 - 1) * 0.2 + 1 (1 / 1.4 = 0,714)
        mult *= 1 / (2 - 1) * 0.3 + 1 (0,714 / 1.3 = 0.549)
        mult *= 1 / (1 - 1) * 0.4 + 1 (0.549 / 1 = 0.549)
        final exp requirement mult = 0.549*/
        let mult = 1;
        for(let [index, entry] of Object.entries(this.types)){
            //mult *= 1 / ((statValues.value.priceTotal(index) - 1) * entry + 1);
            mult *= 1 / ((statValues.value.priceTotal(index) - 1) * entry + 1);
        }
        return mult;
    }
    creepTotal(){ //Returns the multiplier at which the exp requirement of an item increases with levels (converts divider into mult)
        let mult = 1;
        for(let [index, entry] of Object.entries(this.types)){
            mult *= 1 / ((statValues.value.creepTotal(index) - 1) * entry + 1);
        }
        return mult;
    }
    get capped(){return this.maxLevel != -1 && this.level >= this.maxLevel}
    get scaleEffect(){
        //multiplier to amount of exp needed for the next level
        return (this.scaling - 1) / this.creepTotal() + 1;
    }
    get priceEffect(){
        //required exp for the first level
        return this.expMax / this.priceTotal();
    }
    get expPercent(){
        //amount of exp compared to required amount in percentages
        return this.exp / this.required() * 100;
    }
}

export class skill extends levelable{
    constructor(id, tags, types, expMax, scaling, effects, maxLevel=-1, description=function(){return `Description`}, unlockCondition=function(){return true}, visibleCondition=function(){return false}, lockedHoverDesc=""){
        super(expMax, scaling, maxLevel);
        this.id = id;
        this.tags = tags;
        for(let [index, entry] of Object.entries(types)){
            if(!values.stats[index].study){
                console.warn(`Used non-study stat ${index} for skill ${id}`);
            }
        }
        this.types = types;
        //this._level = 0; //tracking level value to be used to determine if skill needs to recalculate effects
        this.effects = effects;
        this.unlocked = false;
        this.lockLevel = 0; //lockLevel = 0 = no special properties. lockLevel = 1 = considered locked regardless of unlock condition. lockLevel = 2 = effect of lockLevel 1 + skill does not show up at all.
        this.description = description;
        this.unlockCondition = unlockCondition;
        this.visibleCondition = visibleCondition; //condition for when skill should become visible pre-emptively. This happens regardless to skills of which another skill higher in the order is unlocked. A visible skill does not cause other lower order skills to become visible.
        this.visibleHoverTooltip = true; //to get a visible but locked skill to show a tooltip, just add one in loc. Set this value to false to hide the tooltip.
        this.effect = 1;
    }
    studyTotal(){ //Returns total speed of an item. Explanation of how this works is in values.js
        let time = 0;
        let result = 0;
        for(let [index, entry] of Object.entries(this.types)){
            time += 1 / statValues.value.effectTotal(index) * entry;
        }
        result = 1 / time;
        for(let i=0;i<this.tags.length;i++){ //apply speed modifiers that are dependent to this item's tags.
            result *= statValues.value.skillTagStudyMods(this.tags[i]);
        }
        result *= statValues.value.effectTotal('skillStudyRate');
        return result;
    }
    advance(mult, skipLevel=false){
        //this.exp += this.speed * mult;
        let amount = this.studyTotal() * mult;
        this._advance(amount, skipLevel);
    }
    update(force=false){
        //check if upgrade becomes unlocked
        //skills with the 'relock' tag can become locked again which disables their bonuses but keeps exp and levels
        let update = force;
        let tagLock = false;
        let lockLevel = this.lockLevel;
        const mustHaveTags = deepClone(refValues.value.noTagLock);
        for(let i=0;i<this.tags.length; i++){
            const tag = this.tags[i];
            if(refValues.value.tagLock.includes(tag)){
                tagLock = true;
            }
            if(mustHaveTags.includes(tag)){
                mustHaveTags.splice(mustHaveTags.indexOf(tag), 1);
            }
        }
        if(mustHaveTags.length){
            tagLock = true;
        }
        if(tagLock){
            this.lockLevel = 2;
        }
        else{
            this.lockLevel = 0;
        }
        if(!this.lockLevel){
            if((this.tags.includes('relock') && this.unlocked !== this.unlockCondition()) || 
            (!this.unlocked && this.unlockCondition())){
                this.unlocked = this.unlockCondition();
                update = true;
            }
        }
        else{
            this.unlocked = false;
        }
        if(this.lockLevel !== lockLevel){
            update = true;
        }
        /*if(this._level !== this.level){
            update = true;
        }*/
        const skillEffect = statValues.value.skillEffectTotal(this.id);
        if(this.effect != skillEffect){
            this.effect = skillEffect;
            update = true;
        }
        const trueLevel = statValues.value.skillLevelTotal(this.id);
        if(this.trueLevel != trueLevel){
            this.trueLevel = trueLevel;
            update = true;
        }
        if(update){
            this.levelEffect();
        }
    }
    levelEffect(){
        //this._level = this._level = this.level;
        for(let [index, entry] of Object.entries(this.effects)){
            //index = effect name (locomotion, all, digestion, etc)
            //entry = object {get effect, get creep, etc}
            for(let [index2, entry2] of Object.entries(entry)){
                //index2 = effect, creep, etc
                //entry2 = getter function, like get effect(){return 1 + (0.1 * this.level)}
                if(this.unlocked){
                    if(['skillEffect', 'skillBaseLevel', 'skillLevel'].includes(index2)){
                        statValues.value[index2][index][`skill_${this.id}`] = entry2(this.trueLevel); //skill effect boosting effects are not and should not be affected by skill effect
                    }
                    else{
                        statValues.value[index2][index][`skill_${this.id}`] = entry2(this.trueLevel, this.effect);
                    }
                }
                else{
                    //locked upgrades have no effect.
                    if(index2 === 'baseEffect'){
                        statValues.value[index2][index][`skill_${this.id}`] = 0;
                    }
                    else{
                        statValues.value[index2][index][`skill_${this.id}`] = 1;
                    }
                }
            }
        }
    }
    /*get exp(){ return save.value.skills[this.id].exp }
    set exp(val){ save.value.skills[this.id].exp = val; }
    get level(){ return save.value.skills[this.id].level }
    set level(val){ save.value.skills[this.id].level = val; }
    get unlocked(){ return save.value.skills[this.id].unlocked; }
    set unlocked(val){ save.value.skills[this.id].unlocked = val; }*/
    /*get levelFormat(){
        //format number
        return format(this.level, 4, "eng");
    }*/
}

export class structure extends levelable{ //points of interest for stage 2 (organs)
    constructor(id, tags, types, expMax, scaling, effects, description=function(){return `Description`}){
        super(expMax, scaling, -1);
        this.id = id;
        this.tags = tags;
        for(let [index, entry] of Object.entries(types)){
            if(!values.stats[index].study){
                console.warn(`Used non-study stat ${index} for skill ${id}`);
            }
        }
        this.types = types;
        this.effects = effects;
        this.unlocked = false;
        this.lockLevel = 0; //lockLevel = 0 = no special properties. lockLevel = 1 = considered locked regardless of unlock condition. lockLevel = 2 = effect of lockLevel 1 + skill does not show up at all.
        this.description = description;
        this.effect = 1;
    }
    studyTotal(){ //Returns total speed of an item. Explanation of how this works is in values.js
        let time = 0;
        let result = 0;
        for(let [index, entry] of Object.entries(this.types)){
            time += 1 / statValues.value.effectTotal(index) * entry;
        }
        result = 1 / time;
        result *= statValues.value.effectTotal('structureStudyRate');
        return result;
    }
    advance(mult, skipLevel=false){
        //this.exp += this.speed * mult;
        let amount = this.studyTotal() * mult;
        this._advance(amount, skipLevel);
    }
    update(force=false){
        //check if upgrade becomes unlocked
        //skills with the 'relock' tag can become locked again which disables their bonuses but keeps exp and levels
        let update = force;
        /*if(this._level !== this.level){
            update = true;
        }*/
        //const structureEffect = statValues.value.structureEffectTotal(this.id);
        const structureEffect = 1;
        if(this.effect != structureEffect){
            this.effect = structureEffect;
            update = true;
        }
        //const trueLevel = statValues.value.structureLevelTotal(this.id);
        const trueLevel = this.level;
        if(this.trueLevel != trueLevel){
            this.trueLevel = trueLevel;
            update = true;
        }
        if(update){
            this.levelEffect();
        }
    }
    
    levelEffect(){
        //this._level = this._level = this.level;
        for(let [index, entry] of Object.entries(this.effects)){
            //index = effect name (locomotion, all, digestion, etc)
            //entry = object {get effect, get creep, etc}
            for(let [index2, entry2] of Object.entries(entry)){
                //index2 = effect, creep, etc
                //entry2 = getter function, like get effect(){return 1 + (0.1 * this.level)}
                if(this.unlocked){
                    if(['structureEffect', 'structureBaseLevel', 'structureLevel'].includes(index2)){
                        statValues.value[index2][index][`structure_${this.id}`] = entry2(this.trueLevel); //skill effect boosting effects are not and should not be affected by skill effect
                    }
                    else{
                        statValues.value[index2][index][`structure_${this.id}`] = entry2(this.trueLevel, this.effect);
                    }
                }
                else{
                    //locked upgrades have no effect.
                    if(index2 === 'baseEffect'){
                        statValues.value[index2][index][`structure_${this.id}`] = 0;
                    }
                    else{
                        statValues.value[index2][index][`structure_${this.id}`] = 1;
                    }
                }
            }
        }
    }
}

/*export class resource{
    constructor(id, amount=0, cap=-1){
        this.id = id;
        this._amount = amount;
        this.cap = cap;
    }
    set amount(i){this._amount = i;}
    get amount(){return this._amount;}
    updateAmount(i, mods){
        this._amount = 1;
    }
}*/