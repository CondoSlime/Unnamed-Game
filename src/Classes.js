import {deepClone, format} from './Functions.js';
import {ref, watch, unref} from 'vue';
import {statValues, values, skills} from './Values.js';
import {save} from './Save.js';


export class skill{
    constructor(id, tags, types, expMax, scaling, effects, description=function(){return `Description`}, unlockCondition=function(){return true}){
        this.id = id;
        this.tags = tags;
        this.types = types;
        this.expMax = expMax;
        this._level = 0; //tracking level value to be used to determine if skill needs to recalculate effects
        this.levelSpeed = 0 //amount of average levels that this skill gains per second. Used for progress bar animations
        this.scaling = scaling;
        this.effects = effects;
        this.description = description;
        this.unlockCondition = unlockCondition;
        this.skillEffect = 1;
    }
    advance(mult, skipLevel=false){
        //this.exp += this.speed * mult;
        const amount = this.studyTotal() * mult;
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
                result += start + this.priceEffect * amount;
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
        this.level += val;
        if(!skipEffect){
            this.levelEffect();
        }
        return this.trueLevel;
    }
    levelEffect(){
        this._level = this._level = this.level;
        for(let [index, entry] of Object.entries(this.effects)){
            //index = effect name (locomotion, all, digestion, etc)
            //entry = object {get effect, get creep, etc}
            for(let [index2, entry2] of Object.entries(entry)){
                //index2 = effect, creep, etc
                //entry2 = getter function, like get effect(){return 1 + (0.1 * this.level)}
                if(this.unlocked){
                    if(['skillEffect', 'skillBaseLevel', 'skillLevel'].includes(index2)){
                        statValues.value[index2][index][this.id] = entry2(this._level); //skill effect boosting effects are not and should not be affected by skill effect
                    }
                    else{
                        statValues.value[index2][index][this.id] = entry2(this._level, this.skillEffect);
                    }
                }
                else{
                    //locked upgrades have no effect.
                    if(index2 === 'baseEffect'){
                        statValues.value[index2][index][this.id] = 0;
                    }
                    else{
                        statValues.value[index2][index][this.id] = 1;
                    }
                }
                if(['skillEffect', 'skillBaseLevel', 'skillLevel'].includes(index)){ //another skill has been affected by this skill, recalculate its effect
                    
                }
            }
        }
    }
    required(raw=false){
        //required exp for next level
        if(raw){
            //ignore cost reduction effects
            return this.priceEffect * (this.scaling ** this.level);
        }
        return this.priceEffect * (this.scaleEffect ** this.level);
    }
    update(){
        //check if upgrade becomes unlocked
        //skills with the 'relock' tag can become locked again which disables their bonuses but keeps exp and levels
        let update = false;
        if((this.tags.includes('relock') && this.unlocked !== this.unlockCondition()) || 
        (!this.unlocked && this.unlockCondition())){
            this.unlocked = this.unlockCondition();
            update = true;
        }
        else if(this._level !== this.level){
            update = true;
        }
        const skillEffect = statValues.value.skillEffectTotal(this.id);
        if(this.skillEffect != skillEffect){
            this.skillEffect = skillEffect;
            update = true;
        }
        if(update){
            this.levelEffect();
        }
    }
    studyTotal(){ //Returns total speed of an item. Explanation of how this works is in values.js
        let time = 0;
        for(let [index, entry] of Object.entries(this.types)){
            time += this.required() / statValues.value.studyTotal(index) * entry;
        }
        return this.required() / time;
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
    get exp(){ return save.value.skills[this.id].exp }
    set exp(val){ save.value.skills[this.id].exp = val; }
    get level(){ return save.value.skills[this.id].level }
    set level(val){ save.value.skills[this.id].level = val; }
    get unlocked(){ return save.value.skills[this.id].unlocked; }
    set unlocked(val){ save.value.skills[this.id].unlocked = val; }
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
    /*get levelFormat(){
        //format number
        return format(this.level, 4, "eng");
    }*/
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