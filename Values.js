import {skill, structure} from './Classes.js';
import {ref} from 'vue';
import {deepClone, format} from './Functions.js';
import loc from './Localization.js';
import {save} from './Save.js';


/*baseEffect(l, e){return 0.1 * l * e}, //this.effects.stat1.baseEffect(), baseEffect = linear additive modifier for stats.
effect(l, e){return 1 + (0.01 * l * e)}, //effect = multiplicative modifier for stats (can go below 1 for a penalty),
studyEffect(l, e){return 1 + (0.02 * l * e)}, //studyEffect = multiplicative modifier for stats (can go below 1 for a penalty) only affects study rate for items dependent on the skill.
//price(l, e){return 1.01 ** (l * e)}, //price = multiplicative price divider for items dependent on the stat, divides amount of exp needed to get a level based on how dependent the skill is. To be removed or reworked as the effect is too complicated.
skillCreep(l, e){return 1.001 ** (l * e)}, //skillCreep = multiplicative cost creep divider for skills, reduces the speed at which the experience requirement goes up with every level
skillEffect(l, e){return 1 + (0.01 * l)}, //skillEffect = multiplicative effect modifier for skills, affects the "e" value. (additive multiplier should not be needed?)
skillBaseLevel(l, e){return 0.1 * l * e}, //skillLevel = additive level modifier for skills, increases the "l" value.
skillLevel(l, e){return 1 + (0.01 * l * e)}, //skillLevel = multiplicative level modifier for skills, increases the "l" value.
skillTagEffect(l){return 1 + (0.01 * l)} //skillTagEffect = multiplicative effect modifier for all skills that have a matching tag. Affects the "e" value.
skillTagStudy(l){return 1 + (0.01 * l)} //skillTagStudy = multiplicative exp modifier for all skills that have a matching tag.*/

export const statValues = ref({
  effect:{}, //stat multiplicative effect
  baseEffect:{}, //stat additive effect
  skillEffect:{}, //skill multiplicative effect
  skillStudy:{}, //skill multiplicative study rate
  skillBaseLevel:{}, //skill free extra base level
  skillLevel:{}, //skill free extra multiplicative level
  skillTagEffect:{}, //skill tag multiplicative effect
  skillTagStudy:{}, //skill tag multiplicative study rate
  structureEffect:{}, //structure multiplicative effect
  structureStudy:{}, //structure multiplicative study rate
  structureBaseLevel:{}, //structure free extra base level
  structureLevel:{}, //structure free extra multiplicative level
  
  effectMods(type){return Object.values(statValues.value.effect[type]).reduce((a,b) => a*b, 1)},
  baseEffectMods(type){return Object.values(statValues.value.baseEffect[type]).reduce((a,b) => a+b, 0)}, //base is additive
  skillEffectMods(type){return Object.values(statValues.value.skillEffect[type]).reduce((a,b) => a*b, 1)},
  skillStudyMods(type){return Object.values(statValues.value.skillStudy[type]).reduce((a,b) => a*b, 1)},
  skillBaseLevelMods(type){return Object.values(statValues.value.skillBaseLevel[type]).reduce((a,b) => a+b, 0)}, //base is additive
  skillLevelMods(type){return Object.values(statValues.value.skillLevel[type]).reduce((a,b) => a*b, 1)},
  skillTagEffectMods(type){return Object.values(statValues.value.skillTagEffect[type]).reduce((a,b) => a*b, 1)},
  skillTagStudyMods(type){return Object.values(statValues.value.skillTagStudy[type]).reduce((a,b) => a*b, 1)},
  structureEffectMods(type){return Object.values(statValues.value.structureEffect[type]).reduce((a,b) => a*b, 1)},
  structureStudyMods(type){return Object.values(statValues.value.structureStudy[type]).reduce((a,b) => a*b, 1)},
  structureBaseLevelMods(type){return Object.values(statValues.value.structureBaseLevel[type]).reduce((a,b) => a+b, 0)}, //base is additive
  structureLevelMods(type){return Object.values(statValues.value.structureLevel[type]).reduce((a,b) => a*b, 1)},
  tags:[],
  initialize(stats, skills, structures){
      //add new stats so they can be used by future items.
      //can be re-run to add new stats afterwards
      for(let [index, entry] of Object.entries(stats)){ //initialize stats
        this.baseEffect[index] = {base:entry.base ?? 1};
        this.effect[index] = {base:1};
      }
      for(let [index, entry] of Object.entries(skills)){ //initialize skills
        for(let i=0;i<entry.tags.length;i++){
          if(!this.tags.includes(entry.tags[i])){
            this.tags.push(entry.tags[i]); //check skill for tags, add unique tags to list
          }
        }
        this.skillEffect[index] = {base:1};
        this.skillStudy[index] = {base:1};
        this.skillBaseLevel[index] = {base:0};
        this.skillLevel[index] = {base:1};
        this.structureEffect[index] = {base:1};
        this.structureStudy[index] = {base:1};
        this.structureBaseLevel[index] = {base:0};
        this.structureLevel[index] = {base:1};
      }
      for(let [index, entry] of Object.entries(structures)){ //initialize structures
        for(let i=0;i<entry.tags.length;i++){
          if(!this.tags.includes(entry.tags[i])){
            this.tags.push(entry.tags[i]); //check structures for tags, add unique tags to list
          }
        }
        this.skillEffect[index] = {base:1};
        this.skillStudy[index] = {base:1};
        this.skillBaseLevel[index] = {base:0};
        this.skillLevel[index] = {base:1};
        this.structureEffect[index] = {base:1};
        this.structureStudy[index] = {base:1};
        this.structureBaseLevel[index] = {base:0};
        this.structureLevel[index] = {base:1};
      }
      for(let i=0;i<this.tags.length;i++){ //initialize tags
        const tag = this.tags[i];
        this.skillTagEffect[tag] = {base:1};
        this.skillTagStudy[tag] = {base:1};
      }
  },
  formatTypes(types){
      if(!types){ types = []}
      if(typeof types !== 'object'){ types = [types]; }
      const result = types;
      for(let i=0;i<types.length;i++){
          if(!this.effect[types[i]]){
              result.splice(result.indexOf(i), 1); //remove tags that do not have an accompanying effect
          }
      }
      return result;
  },
  effectTotal(type, mods=[]){
      //returns total effect of a stat, base of all modifiers happens first, then mult.
      if(!this.effect[type]){
          console.warn(`Invalid value in statValues.studyTotal: ${type}`);
          return 1
      }
      let effect = this.baseEffectMods(type) * this.effectMods(type);
      const tags = refValues.value.stats[type];
      if(tags.special || mods.includes('raw')){ //do not apply extra modifiers to special stats like time
        return effect;
      }
      if(tags.study){ //modifiers exclusive to skills used for studies.
        effect *= formulas.sizeBonus();
        effect *= formulas.studyPenalty();
      }
      return effect
  },
  priceTotal(type){ //returns experience cap divider from one or more types combined, 1 = 100% required, 2 = 50% required
      if(!this.effect[type]){
          console.warn(`Invalid value in statValues.priceTotal: ${type}`);
          return 1
      }
      return 1 //rework or removal in progress
  },
  creepTotal(type){ //returns divider to how much more expensive items become with each level from one or more types combined, 1 = 100% cost creep, 2 = 50% cost creep
      if(!this.effect[type]){
          console.warn(`Invalid value in statValues.creepTotal: ${type}`);
          return 1
      }
      return 1 //rework in progress
  },
  skillEffectTotal(id){ //effect multiplier ("e" value) of a skill
    let effect = this.skillEffectMods(id);
    const skill = skillables.value.skills[id];
    for(let i=0;i<skill.tags.length;i++){ //apply effect modifiers that are tag-dependent.
      effect *= this.skillTagEffectMods(skill.tags[i]);
    }
    return effect;
  },
  skillLevelTotal(skill){ //level total from a skill. Can get free levels from other sources. 
    let effect = this.skillBaseLevelMods(skill) + (skillables.value.skills[skill].capped ? skillables.value.skills[skill].maxLevel : skillables.value.skills[skill].level) * this.skillLevelMods(skill);
    return effect;
  },
  allStats(){ //returns object with all stat types and additive, multiplicative, price and creep modifiers attached. Used for debugging.
      const result = {};
      for(let [index, entry] of Object.entries(this.effect)){
          result[index] = {base:0, mult:1, total:1, price:1, creep:1, tags:save.value.stats[index]};
          for(let [index2, entry2] of Object.entries(entry)){
              result[index].mult *= entry2; 
          }
      }
      for(let [index, entry] of Object.entries(this.baseEffect)){
          for(let [index2, entry2] of Object.entries(entry)){
              result[index].base += entry2; 
          }
          result[index].total = result[index].base * result[index].mult;
      }
      for(let [index, entry] of Object.entries(this.price)){
          for(let [index2, entry2] of Object.entries(entry)){
              result[index].price *= entry2; 
          }
      }
      for(let [index, entry] of Object.entries(this.creep)){
          for(let [index2, entry2] of Object.entries(entry)){
              result[index].creep *= entry2; 
          }
      }
      return result;
  },
  allSkills(){
    const result = {}
    for(let [index, entry] of Object.entries(skillables.value.skills)){
      result[index] = {level:entry.level, exp:entry.exp, stats:{}}
      for(let [index2, entry2] of Object.entries(skillables.value.skills[index].effects)){
        result[index].stats[index2] = {}
        for(let [index3, entry3] of Object.entries(entry2)){
          result[index].stats[index2][index3] = entry3(entry.level);
        }
      }
    }
    return result;
  }
});
export const values = { //do not modify
  res:{
    nutrients:0,
    size:1,
  },
  timers:{ //in seconds
    nutrAction:30,
    rival1Attack:100,
    rival2Attack:240,
    selfAttack:100,
    exploration:240
  },
  misc:{
    gameSpeed:0.1, //multiplier to all resource production and consumption
    timerSpeed:100, //game timer rate in ms, multiplies game speed as well
    nutrAction:'scouting', //stage 1 feature, swaps between scouting and digestion to indicate which action is more effective
    scoutSpeed:1, //nutrient gathering rate for stage 1
    digestSpeed:1, //nutrient digestion rate for stage 1
    digestionEfficiency:0.1, //nutrient to size conversion rate
    sizeBonus:1.3, //bonus for larger size, applied addively once every time size doubles above 1
    fooledConfuseMult:2, //multiplier to confusion gained for rivals in stage 1 after they get fooled by mimicry
    structureFocusExplorePenalty:1/3*2, //penalty to exploration rate for every point of structure focus invested
    exploreTimeIncrease:1.6 //extra time needed to complete next exploration every time the bar fills
  },
  tags:{
    basic:{},
    combat:{},
    ability:{},
    stage1:{hidden:true},
    stage2:{hidden:true},
    stage3:{hidden:true},
    danger:{hidden:true},
  },
  stats:{
    //hidden: Whether the stat is hidden or not. Shows as ??? in tooltips and doesn't show up in stats display (latter tbd)
    //base: sets the base starting value of a stat (default 1), skills requiring a stat with a value of 0 can't be completed.
    test:{/* tags */}, //test skill with no effect
    time:{study:true, special:true}, //basic stat, unaffected by all stat boosts and penalties
    locomotion:{study:true}, //basic stat, just used to speed up study rate of other skills
    senses:{study:true}, //basic stat
    scouting:{base:0}, //scouting finds nutrients at 1 nutrient/s per 1 scouting
    digestion:{study:true}, //basic stat
    nutrientDigestion:{base:0}, //turns nutrients into size at a rate of 1 nutrient/s into 0.1 size per 1 nutrientDigestion
    digestionEfficiency:{base:1}, //raises the amount of size gained per nutrient. default is a 1 to 0.1 ratio. Increases linearly.
    multitasking:{base:0}, //lowers the study penalty for assigning multiple focus points at once. each 0.01 increases speed by 1% additively. Caps at 100% speed.
    scavenger:{base:0}, //allows digesting nutrients while gathering and gathering nutrients while digesting. Gain 1% speed additively per point of scavenger
    memory:{study:true}, //basic stat
    focus:{}, //allow learning one extra skill at a time per point of focus, study rate is divided by amount of activated skills
    structureFocus:{}, //allow learning one extra structure at a time per point of structureFocus, study rate is divided by amount of activated studies
    rivals:{hidden:true, study:true}, //basic stat. Hidden until the first rival attacks.
    defense:{}, //lowers size loss from rival attacks. Size lost is divided by defense value
    attack:{base:0}, //raises size stolen from attacks. Size stolen is multiplied by attack value
    attackSpeed:{}, //speed at which attacks from the player happen. By default this happens every 100 seconds, rate is multiplied by attack speed
    ability:{study:true}, //basic stat
    mindControl:{base:0}, //raises chance for rivals to attack other rivals instead of you
    shapeShifting:{base:0}, //may cause rivals to fail an attack on you. Builds up mind control faster if they do.
    boneGrowth:{study:true}, //basic stat
    sizeMultBonus:{}, //multiplicative multiplier to study rate based on size. 1 = +100% per log2 size
    exploration:{base:0}, //specialized scouting for stage 2, builds progress towards exploring your surroundings and finding new structures (organs) instead of finding nutrients.
    fleshDigestion:{base:0}, //specialized digestion for stage 2, converts the environment into size. Does not rely on scouting for nutrients.
    skillStudyRate:{}, //multiplies study rate for all skills
    structureStudyRate:{}, //multiplies study rate for structures
    beings:{hidden:true, study:true} //basic stat. Hidden until the tiny beings attack in stage 2
  },
  rivals:{
    rival1:{
      baseSize:800,
      baseStrength:30,
      baseConfuseGain:1,
      baseConfuseMax:10,
    },
    rival2:{
      baseSize:3000,
      baseStrength:60,
      baseConfuseGain:2,
      baseConfuseMax:10,
    },
    self:{
      baseAttackTimer:1000,
      baseMimicryMax:10
    }
  },
  rivalNames:['rival1', 'rival2']
}
const gameSpeed = values.misc.gameSpeed;

export const saveValues = {
  res:{
    nutrients:values.res.nutrients,
    size:values.res.size
  },
  timers:{
    nutrAction:0,
    rival1Attack:0,
    rival2Attack:0,
    selfAttack:0,
    exploration:0
  },
  misc:{
    nutrAction:values.misc.nutrAction,
  },
  skills:{},
  structures:{},
  stage:1,
  rivals:{
    rival1:{
      unlocked:false,
      size:values.rivals.rival1.baseSize,
      attacks:0,
      confuse:0,
      stolen:0,
      lastTarget:false,
      alive:true
    },
    rival2:{
      unlocked:false,
      size:values.rivals.rival2.baseSize,
      attacks:0,
      confuse:0,
      stolen:0,
      lastTarget:false,
      alive:true
    },
    self:{
      attacks:0,
      stolen:0,
      mimicry:0,
      lastTarget:false
    }
  },
  exploration:{
    count:0
  },
  study:{
    skills:{
      order:[]
    },
    structures:{
      order:[]
    }
  },
  settings:{
    autoSave:false
  },
  seed:0,
}
function seededRandom(adv=true) {
  let a = save.value.seed;
  a |= 0;
  a = a + 0x9e3779b9 | 0;
  let t = a ^ (a >>> 16);
  t = Math.imul(t, 0x21f0aaad);
  t = t ^ (t >>> 15);
  t = Math.imul(t, 0x735a2d97);
  const result = ((t = t ^ (t >>> 15)) >>> 0) / 4294967296;
  if(adv){ save.value.seed = a; }
  return result;
}
export const refValuesBase = { //do not modify
  stats:deepClone(values.stats),
  tagLock:[], /* all skills that include a tag in this list are locked regardless of unlock condition. Has priority over noTagLock */
  noTagLock:[], /*all skills that do not have all tags in this list are locked regardless of unlock condition */
  settings:{
    infoMode:'guide',
    showGuide:'',
    showStat:'',
    showSkill:'',
    screen:'game',
    gameSection:'skills',
    pause:false
  },
  tags:deepClone(values.tags),
  timers:deepClone(values.timers),
  misc:{
    rival1Warn:false, //currently unused
    rival2Warn:false, //currently unused
    skillNotif:false, //highlight skills tab if a new skill option is unlocked (unimplemented)
    exploreNotif:false //highlight explore tab if a new exploration option is unlocked
  },
  rivals:{
    rival1:{
      size:values.rivals.rival1.baseSize,
      strength:values.rivals.rival1.baseStrength,
      confuseGain:values.rivals.rival1.baseConfuseGain,
      confuseMax:values.rivals.rival1.baseConfuseMax
    },
    rival2:{
      size:values.rivals.rival2.baseSize,
      strength:values.rivals.rival2.baseStrength,
      confuseGain:values.rivals.rival2.baseConfuseGain,
      confuseMax:values.rivals.rival2.baseConfuseMax
    },
    self:{
      attackTimer:values.rivals.self.baseAttackTimer,
      mimicryMax:values.rivals.self.baseMimicryMax
    }
  }
}

export const refValues = ref({}); //tracks values not used in the save file. These are cleared on page reload);
export function initRefValues(){
  refValues.value = {...deepClone(refValuesBase),
    get rivalAttacks(){
      return save.value.rivals.rival1.attacks + save.value.rivals.rival2.attacks
    },
    get rivalsAlive(){
      return save.value.rivals.rival1.alive || save.value.rivals.rival2.alive;
    },
    seededRandom:seededRandom,
    advanceTimer: function(id, amount=1, mods=[]){
      if(!save.value.timers.hasOwnProperty(id)){
        console.warn(`property ${id} not found in timers!`);
        return false;
      }
      if(mods.includes('watch')){
        return save.value.timers[id] + amount * values.misc.gameSpeed;
      }
      if(!mods.includes('check')){
        save.value.timers[id] += amount * values.misc.gameSpeed;
      }
      if(save.value.timers[id] >= refValues.value.timers[id]){
        if(mods.includes('subtract')){
          save.value.timers[id] -= refValues.value.timers[id]
        }
        else if(!mods.includes('keep')){
          save.value.timers[id] = 0;
        }
        return true
      }
      return false;
    },
    getTimer: function(id, percentage=true){
      if(percentage){
        return format(save.value.timers[id] / refValues.value.timers[id] * 100, 4, 'eng');
      }
      else{
        return save.value.timers[id];
      }
    }
  }
}
export const formulas = {
  nutrientGathering:function(stage=save.value.stage){ //gather 1 nutrients per second per point of scouting.
    //gathering and digestion are on a cycle, gathering reduced to 10% of original per point of scavenger above 1 if cycle is digestion
    let amount = 0
    if(stage === 1){
      const scavenger = statValues.value.effectTotal('scavenger');
      const gather = statValues.value.effectTotal('scouting');
      const rate = save.value.misc.nutrAction === 'scouting' ? 1 : scavenger;
      amount = values.misc.scoutSpeed * gather * gameSpeed * rate;
    }
    return amount;
  },
  nutrientDigestion:function(stage=save.value.stage){ //convert 1 nutrients per second into mass per point of nutrientDigestion
    //digestion converts 1 nutrients into 0.1 mass, this rate can be increased with the efficient digestion skill
    //gathering and digestion are on a cycle, digestion reduced to 10% of original per point of scavenger above 1 if cycle is scavenger
    let amount = 0;
    if(stage === 1){
      const scavenger = statValues.value.effectTotal('scavenger');
      const digestion = statValues.value.effectTotal('nutrientDigestion');
      const rate = save.value.misc.nutrAction === 'digestion' ? 1 : scavenger;
      amount = values.misc.digestSpeed * digestion * gameSpeed * rate;
      amount = Math.min(amount, save.value.res.nutrients);
      amount = Math.max(0, amount);
    }
    else if(stage === 2){
      const digestion = statValues.value.effectTotal('fleshDigestion');
      amount = values.misc.digestSpeed * digestion * gameSpeed;
    }
    return amount;
  },
  passiveSizeLoss:function(){ //lose size equal to amount of ditits in size above 2 (100)
    return Math.min(save.value.res.size-10, Math.max(0, Math.log10(save.value.res.size) - 1) * gameSpeed);
  },
  rivalPassiveSizeGain:function(which){ //rivals gain back 0.01% of their missing size per second
    const rival = save.value.rivals[which];
    const rivalValue = refValues.value.rivals[which];
    if(rivalValue.size > rival.size){
      return (rivalValue.size - rival.size) * 0.0001 * gameSpeed
    }
    return 0;
  },
  rivalAttackSpeed:function(which){ //returns attack value that rivals gain per cycle. Amount of value needed varies per rival, rival1 has 100, rival2 has 240, by default it's 1/s, reduced by the delayAttack stat
    //rival2 becomes faster if rival1 is dead
    if(which === 'rival2' && !save.value.rivals.rival1.alive){
      return 2;
    }
    return 1;
  },
  attackSizeStolen:function(which, target, stage=save.value.stage){ //return the amount of size that either you or a rival would steal from you or another rival during an attack. Can go above the current size that a target has.
    //you can't attack yourself
    let stolen = 0;
    if(stage === 1){
      if(target === 'you'){ //rival attacks you
        const defense = statValues.value.effectTotal('defense');
        const rivalStrength = refValues.value.rivals[which].strength;
        const rivalSize = save.value.rivals[which].size;
        //steals either a percentage of size equal to strength or a flat amount of strength multiplied by 1% of size. Whichever is more.
        stolen = Math.max(save.value.res.size / 100 * rivalStrength, rivalStrength * rivalSize / 100);
        stolen /= defense;
        //amount of size that mass gains is capped at their strength value
      }
      else if(which === 'you'){ //you attack rival
        const attack = statValues.value.effectTotal('attack');
        stolen = attack;
        stolen = Math.min(save.value.res.size, stolen); //capped at 100% of your mass
        //stolen = Math.min(save.value.rivals[target].size, stolen); //capped at 100% of rival mass
      }
      else{ //rival attacks rival
        //steals either a percentage of size equal to strength or a flat amount of strength multiplied by 1% of size. Whichever is less
        const rivalStrength = refValues.value.rivals[which].strength;
        const rivalSize = save.value.rivals[which].size;
        stolen = Math.min(save.value.rivals[target].size * rivalStrength / 100, rivalStrength * rivalSize);
        //amount of size that mass gains is capped at their strength value.
      }
    }
    return stolen;
  },
  digestSizeGain:function(amount){ //Size gained is divided by amount of ditits in size above 2 (100)
    const eff = statValues.value.effectTotal('digestionEfficiency');
    amount *= eff * values.misc.digestionEfficiency; //values.digestionEfficiency = 0.1 by default
    return amount / Math.max(1, Math.log10(save.value.res.size + amount)-1);
  },
  rivalSizeGain:function(which, amount){ //rivals gain diminished size if they go over the value they start with to prevent them growing out of control.
    amount = Math.min(amount, refValues.value.rivals[which].strength); //size stolen is also capped at rival strength to prevent them gaining large amounts of size from attacking the player or other rivals.
    return amount * 0.99 ** Math.max(0, (save.value.rivals[which].size + amount - refValues.value.rivals[which].size));
  },
  rivalConfuseGain:function(which){ //rivals become confused over time, when their value reaches the max value (by defaul 10), they'll attack the other rival. Raises by 1 per attack for rival1 and 3 for rival2, affected by confusion skills.
    const confusion = statValues.value.effectTotal('mindControl');
    return refValues.value.rivals[which].confuseGain * confusion;
  },
  mimicryGain(){ //when mimicry reaches the max value (by default 10), the next rival attack will deal no damage. Confusion raises twice as fast on the target rival if this happens.
    const mimicry = statValues.value.effectTotal('shapeShifting');
    return mimicry;
  },
  sizeBonus(size=false){ //study bonus from larger size. By default it's +30% additively whenever your size doubles
    size = Math.max(1, Number.isInteger(size) ? size : save.value.res.size);
    const sizeMult = Math.log2(size);
    const multBonus = statValues.value.effectTotal('sizeMultBonus'); //size mult is a secondary compounding multiplier to the size bonus. (currently unused)
    return Math.max(1, 1+(values.misc.sizeBonus-1) * sizeMult) * (multBonus ** sizeMult);
  },
  studyPenalty(which='skills'){ //study penalty for assigning more focus points at once, by default, study rate is divided by amount of points invested. Penalty reduced by multitasking skill
    return Math.min(1, 1 / Math.max(1, study.value.used(which)) + statValues.value.effectTotal("multitasking"));
  }
}

export const guides = {
  basics:{
    unlock:function(){return true}
  },
  expGain:{
    unlock:function(){return true}
  },
  size:{
    unlock:function(){return skillables.value.skills.scouting.unlocked || skillables.value.skills.nutrientDigestion.unlocked}
  },
  rivals:{
    unlock:function(){return refValues.value.rivalAttacks}
  }
}

export const study = ref({
  max: function(which){
    if(which === 'skills'){
      return Math.floor(statValues.value.effectTotal('focus'));
    }
    else if(which === 'structures'){
      return Math.floor(statValues.value.effectTotal('structureFocus'));
    }
  },
  order: function(which){return save.value.study[which].order},
  used: function(which){return this.order(which).length},
  free: function(which){return this.max(which) - this.used(which)},
  switch:function(which, id){
    const item = skillables.value[which];
    if(!item){
      console.error('incorrect value for which in study', which);
      return false;
    }
    const studyVal = save.value.study[which];
    if(!item[id].enabled && !item[id].capped){
      if(!save.value.study[which].order.includes(id)){
        save.value.study[which].order.push(id);
      }
      item[id].enabled = true;
    }
    else if(item[id].enabled){
      save.value.study[which].order.splice(studyVal.order.indexOf(id), 1);
      item[id].enabled = false;
    }
  },
  flash:{ //when set to true, a red flash happens if your focus is capped if you try to study more skills
    skills:false,
    structures:false
  }
});

export function updateStage(stage=-1){
  if(stage !== -1){
    save.value.stage = stage;
    if(stage === 2){
      save.value.res.size = 1;
      save.value.res.nutrients = 0;
    }
  }
  if(save.value.stage === 1){
    skillLockByNoTag('stage1', true, true);
    skillLockByNoTag('stage2', false, true);
    skillLockByNoTag('stage3', false, true);
  }
  else if(save.value.stage === 2){
    skillLockByNoTag('stage1', false, true);
    skillLockByNoTag('stage2', true, true);
    skillLockByNoTag('stage3', false, true);
  }
  if(save.value.stage !== 1){
    for(let i=0;i<values.rivalNames.length;i++){
      const name = values.rivalNames[i];
      delete statValues.value.effect.scouting[`effect_deceased_${name}`]; //no deceased rival bonus outside of stage 1
      delete statValues.value.effect.nutrientDigestion[`effect_deceased_${name}`];
    }
  }
  updateEffects(true);
}

export function skillLockByTag(tag, lock='toggle', skipUpdate=false){ //lock or unlock all skills that have a certain tag. When locked, they are unavailable and inactive regardless of conditions.
  const tagLock = refValues.value.tagLock;
  if(!tagLock.includes(tag) && (lock === true || lock === 'toggle')){
    refValues.value.tagLock.push(tag);
  }
  else if(tagLock.includes(tag) && (lock === false || lock === 'toggle')){
    const pos = tagLock.indexOf(tag);
    refValues.value.tagLock.splice(pos, 1); //remove lock on skills with tag
  }
  if(!skipUpdate){
    updateEffects();
  }
}
export function skillLockByNoTag(tag, lock='toggle', skipUpdate=false){ //lock or unlock all skills that do not have a certain tag. When locked, they are unavailable and inactive regardless of conditions.
  const noTagLock = refValues.value.noTagLock;
  if(!noTagLock.includes(tag) && (lock === true || lock === 'toggle')){
    refValues.value.noTagLock.push(tag);
  }
  else if(noTagLock.includes(tag) && (lock === false || lock === 'toggle')){
    const pos = noTagLock.indexOf(tag);
    refValues.value.noTagLock.splice(pos, 1); //remove lock on skills with tag
  }
  if(!skipUpdate){
    updateEffects();
  }
}

export function resetByTag(tag, which){
  for(let [index, entry] of Object.entries(skillables.value[which])){
    if(entry.tags.includes(tag) || tag === 'all'){
      entry.unlocked = false;
      entry.exp = 0;
      entry.level = 0;
    }
  }
  updateEffects();
}

export function updateEffects(force=false, type='all'){
  for(let [index, entry] of Object.entries(skillables.value)){
    if(type === 'all' || index === type){
      for(let [index2, entry2] of Object.entries(entry)){
        entry2.update(force); //check if new skills can be unlocked. Can lock skills again if the ['relock'] tag for said skill is set.
        if(entry2.unlocked && !save.value.skills[index]){
          save.value[index][index2] = {unlocked:true, exp:0, level:0};
        }
        if(save.value[index][index2]){
          save.value[index][index2].unlocked = entry2.unlocked;
          save.value[index][index2].exp = entry2.exp;
          save.value[index][index2].level = entry2.level;
        }
      }
    }
  }
  for(let [index, entry] of Object.entries(skillables.value)){
    if(type === 'all' || index === type){
      for(let i=save.value.study[index].order.length-1;i>=0; i--){
        const id = save.value.study[index].order[i];
        const enabled = skillables.value[index][id].enabled;
        const item = skillables.value[index][id];
        if(!item.unlocked || item.capped){
          study.value.switch(index, id); //switch off locked or capped skillables
        }
        if(!enabled && item.unlocked){
          study.value.switch(index, id); //switch on studies that are not enabled but are enabled in the save.
        }
      }
      for(let i=save.value.study[index].order.length-1;i>=0; i--){
        const id = save.value.study[index].order[i];
        const enabled = skillables.value[index][id].enabled;
        if(study.value.free(index) < 0 && enabled){
          study.value.switch(index, id); //switch off studies that are over the limit.
        }
      }
    }
  }
  /*if(['all', 'skills'].includes(type)){
    for(let [index, entry] of Object.entries(skillables.value.skills)){
      entry.update(force); //check if new skills can be unlocked. Can lock skills again if the ['relock'] tag for said skill is set.
      if(entry.unlocked && !save.value.skills[index]){
        save.value.skills[index] = {unlocked:true, exp:0, level:0};
      }
      if(save.value.skills[index]){
        save.value.skills[index].unlocked = entry.unlocked;
        save.value.skills[index].exp = entry.exp;
        save.value.skills[index].level = entry.level;
      }
    }
  }
  if(['all', 'structures'].includes(type)){
    for(let [index, entry] of Object.entries(skillables.value.structures)){
      entry.update(force); //check if new skills can be unlocked. Can lock skills again if the ['relock'] tag for said skill is set.
      if(entry.unlocked && !save.value.structures[index]){
        save.value.structures[index] = {unlocked:true, exp:0, level:0};
      }
      if(save.value.structures[index]){
        save.value.structures[index].unlocked = entry.unlocked;
        save.value.structures[index].exp = entry.exp;
        save.value.structures[index].level = entry.level;
      }
    }
  }
  if(['all', 'skills'].includes(type)){
    for(let i=save.value.study.skill.order.length-1;i>=0; i--){
      const id = save.value.study.skill.order[i];
      if(!skillables.value.skills[id].unlocked){
          study.value.switch('skill', id);
      }
    }
  }
  if(['all', 'structures'].includes(type)){
    for(let i=save.value.study.structure.order.length-1;i>=0; i--){
      const id = save.value.study.structure.order[i];
      if(!skillables.value.structures[id].unlocked){
          study.value.switch('structures', id);
      }
    }
  }*/
}

/*new skill(
  'id', //this.id, internal id of item
  ['tag1', 'tag2'], //this.tags, tags of the item, may affect various parts or unlock conditions
  {stat1: 0.3, stat2:0.3, stat3:0.3}, //this.types, which stats the item is affected by with a weight attached.
  100, //this.expMax, amount of exp needed to get the first level
  1.12, //this.scaling, cost creep, when a level is gained, the experience required for the next level is multiplied by this amount
  { //this.effects
    stat1:{ //affects statValues.value.stat1 OR skillables.value.skills.stat1 OR skillables.value.skills.tags.includes('stat1'), effects are only applied if this item is unlocked
      //l is equal to the level of the item
      //e is equal to the effect modifier of the item (default 1)
      baseEffect(l, e){return 0.1 * l * e}, //this.effects.stat1.baseEffect(), baseEffect = linear additive modifier for stats.
      effect(l, e){return 1 + (0.01 * l * e)}, //effect = multiplicative modifier for stats (ALL multiplicative modifiers can go below 1 for a penalty),
      //price(l, e){return 1.01 ** (l * e)}, //price = multiplicative price divider for items dependent on the stat, divides amount of exp needed to get a level based on how dependent the skill is. To be removed or reworked as the effect is too complicated.
      //skillCreep(l, e){return 1.001 ** (l * e)}, //skillCreep = multiplicative cost creep divider for skills, reduces the speed at which the experience requirement goes up with every level
      skillEffect(l){return 1 + (0.01 * l)}, //skillEffect = multiplicative effect modifier for skills, affects the "e" value. Can NOT be affected by "e" or a recursive boost can happen
      skillStudy(l){return 1 + (0.01 * l)}, //skillStudy = multiplicative exp modifier for skills
      skillBaseLevel(l){return 0.1 * l}, //skillBaseLevel = additive level modifier for skills, increases the "l" value.
      skillLevel(l){return 1 + (0.01 * l)}, //skillLevel = multiplicative level modifier for skills, increases the "l" value.
      skillTagEffect(l){return 1 + (0.01 * l)} //skillTagEffect = multiplicative effect modifier for all skills that have a matching tag. Affects the "e" value.
      skillTagStudy(l){return 1 + (0.01 * l)} //skillTagStudy = multiplicative exp modifier for all skills that have a matching tag.
    },
    stat2{ //multiple stats can be affected
      effect(l, e) {return 1 + (l / (l + 500) * e)} //scaling can be different
    }
  },
  levelMax=-1 //maximum level, a skill can not go higher level than this amount. -1 means no cap.
  function(){return `Description text. Current speed: ${this.studyTotal()}`}, //description shown when hovering over this item
  function(){return statValues.value.studyTotal('stat1') >= 10} //unlock requirement. Item becomes active when the condition is met.
  function(){return statValues.value.studyTotal('stat1') >= 3} //visible requirement. Item becomes visible but shows as a question mark and is further not usable. Has a different hover tooltip if it's specified in loc
)*/

/*more details on stat affect:
{stat1:0.2, stat2:0.3, stat3:0.4}
//means this item is affected by 20% of the effect of stat1 + 30% of stat2 + 40% of stat3
//if stat1 has 20 speed, stat2 has 50 speed and stat3 has 1 speed and you need 1000 exp for a level
speed = 1000 / 20 * 0.2 (10)
speed += 1000 / 50 * 0.3 (6)
speed += 1000 / 1 * 0.4 (400) < big effect, raise stat3 to significantly speed up progress
exp = 1000 / 416 = 2.403 exp base

//exp amount is the same regardless of exp required
speed = 2000 / 20 * 0.2 (20)
speed += 2000 / 50 * 0.3 (12)
speed += 2000 / 1 * 0.4 (800)
exp = 2000 / 832 = 2.403 exp base < exp value remains the same no matter the exp required

/stat3 becomes 10 (10x as high)
speed = 2000 / 20 * 0.2 (20)
speed += 2000 / 50 * 0.3 (12)
speed += 2000 / 10 * 0.4 (80) < significantly lower number
exp = 2000 / 112 = 17.86 exp base < much higher exp

exp requirement mult
stat1 = 3, stat2 = 2, stat3 = 1
speed = 1 / (3 - 1) * 0.2 + 1 (1 / 1.4 = 0,714)
speed += 1 / (2 - 1) * 0.3 + 1 (0,714 / 1.3 = 0.549)
speed += 1 / (1 - 1) * 0.4 + 1 (0.549 / 1 = 0.549)
final exp requirement = 0.549

const time = 0;
for(let [index, entry] of Object.entries(item.stats)){
  time += item.expRequired / statValues[stats] * entry;
}
return item.expRequired / time
*/

//special skill tags
//relock: skill can become locked at any time if conditions are not met anymore.
//

function desc_skill(skill, insert=[], locName=`skillDesc_${skill.id}`, exclude=[]){
  const tags = skill.tags.filter((entry, index) => !refValues.value.tags[entry].hidden);
  return `${insert[0] ? `${insert[0]}<br>` : ''}\
${exclude.includes('descr') ? '' : `${loc(locName)}<br>`}\
${insert[1] ? `${insert[1]}<br>` : ''}\
${exclude.includes('tags') || !tags.length ? '' : `Tags:
  ${tags.map((entry, index) => {
    return `<span class='tag'>${loc(`tag_${entry}`)}</span>`}).join(", ")
  }<br>`}\
${insert[2] ? `${insert[2]}<br>` : ''}\
${exclude.includes('statDescr') ? '' : `${desc_stats(skill.types)}<br>`}\
${insert[3] ? `${insert[3]}<br>` : ''}\
${exclude.includes('effect') || !Object.keys(skill.effects).length ? '' : `${desc_skill_effects(skill)}<br>`}\
${insert[4] ? `${insert[4]}<br>` : ''}\
${exclude.includes('speed') ? '' : `speed: ${format(skillables.value.skills[skill.id].studyTotal() / gameSpeed, 4, 'eng')}/s<br>`}\
${insert[5] ? `${insert[5]}<br>` : ''}`.slice(0, -4);
}

function desc_structure(structure, insert=[], locName=`structureDesc_${structure.id}`, exclude=[]){
  return `${exclude.includes('descr') ? '' : `${loc(locName)}<br>`}\
  ${exclude.includes('statDescr') ? '' : `${desc_stats(structure.types)}<br>`}\
  ${exclude.includes('effect') || !Object.keys(structure.effects).length ? '' : `${desc_skill_effects(structure)}<br>`}\
  ${exclude.includes('speed') ? '' : `speed: ${format(skillables.value.structures[structure.id].studyTotal() / gameSpeed, 4, 'eng')}/s<br>`}`.slice(0, -4);
}

function desc_stats(types){
  return Object.entries(types).map((entry) => (
    refValues.value.stats[entry[0]].hidden ? 
      `???: ${format(entry[1]*100, 4, 'eng')}%`
    : 
      `<span class='stat'>${loc(`stat_${entry[0]}`)}</span>: ${format(entry[1]*100, 4, 'eng')}%`)
  ).join(' ');
}


/*if(['skillEffect', 'skillBaseLevel', 'skillLevel'].includes(index2)){
  statValues.value[index2][index][this.id] = entry2(this._level); //skill effect boosting effects are not and should not be affected by skill effect
}
else{
  statValues.value[index2][index][this.id] = entry2(this._level, this.skillEffect);
}*/

function desc_skill_effects(skill){
  let desc = '';
  let i = 0;
  for(let [index, entry] of Object.entries(skill.effects)){
    for(let [index2, entry2] of Object.entries(entry)){
      if(i && !(i%4)){
        desc += '<br>';
      }
      if(['baseEffect', 'effect'].includes(index2)){
        const name = refValues.value.stats[index].hidden ? '???' : loc(`stat_${index}`);
        if(index2 === 'baseEffect'){
          desc += `${name}: +${format(entry2(skill.trueLevel, skill.effect), 4, 'eng')} `;
        }
        if(index2 === 'effect'){
          desc += `${name}: +${format((entry2(skill.trueLevel, skill.effect) - 1) * 100, 4, 'eng')}% `;
        }
      }
      if(['skillEffect', 'skillBaseLevel', 'skillLevel'].includes(index2)){
        if(index2 === 'skillEffect'){
          desc += `<span class='skill'>${index}</span> skill effect: +${format((entry2(skill.trueLevel) - 1) * 100, 4, 'eng')}% `;
        }
        if(index2 === 'skillBaseLevel'){
          desc += `<span class='skill'>${index}</span> skill level: +${format(entry2(skill.trueLevel), 4, 'eng')} `;
        }
        if(index2 === 'skillLevel'){
          desc += `<span class='skill'>${index}</span> skill level: +${format((entry2(skill.trueLevel) - 1) * 100, 4, 'eng')}% `;
        }
      }
      if(['skillTagEffect', 'skillTagStudy'].includes(index2)){
        const name = loc(`tag_${index}`);
        if(index2 === 'skillTagEffect'){
          desc += `<span class='tag'>${name}</span> skill effect: +${format((entry2(skill.trueLevel) - 1) * 100, 4, 'eng')}% `;
        }
        if(index2 === 'skillTagStudy'){
          desc += `<span class='tag'>${name}</span> skill speed: +${format((entry2(skill.trueLevel) - 1) * 100, 4, 'eng')}% `;
        }
      }
      i++;
    }
  }
  return desc;
}


const skills = {
  focus:new skill(
    'focus',
    ['stage1'],
    {memory:1},
    1000,
    4,
    {
      focus:{
        baseEffect(l){return 1 * l}
      }
    },
    -1,
    function(){return desc_skill(this)},
    function(){return skillables.value.skills.memorization.level >= 10}
  ),
  movement:new skill(
    'movement',
    ['stage1'],
    {senses:0.3, locomotion:0.3, memory:0.4},
    100,
    1.05,
    {
      locomotion:{
        baseEffect(l, e){ return 0.1 * l * e}
      }
    },
    -1,
    function(){return desc_skill(this)}
  ),
  sensing:new skill(
    'sensing',
    ['stage1'],
    {senses:0.2, locomotion:0.3, memory:0.5},
    100,
    1.05,
    {
      senses:{
        baseEffect(l, e){ return 0.1 * l * e}
      }
    },
    -1,
    function(){return desc_skill(this)},
    function(){return skillables.value.skills.movement.level >= 3}
  ),
  digestion:new skill(
    'digestion',
    ['stage1'],
    {senses:0.4, digestion:0.4, memory:0.2},
    100,
    1.05,
    {
      digestion:{
        baseEffect(l, e){ return 0.1 * l * e}
      }
    },
    -1,
    function(){return desc_skill(this)},
    function(){return skillables.value.skills.movement.level >= 3}
  ),
  memorization:new skill(
    'memorization',
    ['stage1'],
    {senses:0.2, memory:0.8},
    100,
    1.05,
    {
      memory:{
        baseEffect(l, e){return 0.1 * l * e }
      }
    },
    -1,
    function(){return desc_skill(this)},
    function(){return skillables.value.skills.movement.level >= 8 && skillables.value.skills.sensing.level >= 8}
  ),
  scouting:new skill(
    'scouting',
    ['stage1'],
    {locomotion:0.5, senses:0.5},
    150,
    1.04,
    {
      scouting:{
        baseEffect(l, e){ return 0.05 * l * e}
      }
    },
    -1,
    function(){return desc_skill(this)},
    function(){return skillables.value.skills.sensing.level >= 3}
  ),
  nutrientDigestion:new skill(
    'nutrientDigestion',
    ['stage1'],
    {digestion:0.8, locomotion:0.2},
    150,
    1.04,
    {
      nutrientDigestion:{
        baseEffect(l, e){ return 0.05 * l * e}
      }
    },
    -1,
    function(){return desc_skill(this)},
    function(){return skillables.value.skills.digestion.level >= 3}
  ),
  deepScouting:new skill(
    'deepScouting',
    ['stage1'],
    {senses:0.4, locomotion:0.4, digestion:0.2},
    400,
    1.08,
    {
      senses:{
        effect(l, e){return 1 + (l / (l + 50) * e)}
      },
      scouting:{
        effect(l, e){return 1 + (0.02 * l * e)}
      }
    },
    -1,
    function(){return desc_skill(this)},
    function(){return skillables.value.skills.scouting.level >= 15}
  ),
  efficientDigestion:new skill(
    'efficientDigestion',
    ['stage1'],
    {senses:0.3, digestion:0.3, memory:0.4},
    400,
    1.08,
    {
      digestionEfficiency:{
        baseEffect(l, e){ return 0.1 * l * e}
      },
      nutrientDigestion:{
        effect(l, e){return 1 + (0.02 * l * e)}
      }
    },
    -1,
    function(){return desc_skill(this)},
    function(){return skillables.value.skills.nutrientDigestion.level >= 15}
  ),
  multitasking:new skill(
    'multitasking',
    ['stage1'],
    {memory:0.6, locomotion:0.2, senses:0.2},
    1000,
    1.1,
    {
      multitasking:{
        baseEffect(l, e){ return 0.01 * l * e}
      },
      memory:{
        effect(l, e){return 1 + (l / (l + 50) * e)}
      }
    },
    100,
    function(){return desc_skill(this)},
    function(){return skillables.value.skills.focus.level >= 2 }
  ),
  scavenger:new skill(
    'scavenger',
    ['stage1'],
    {locomotion:0.4, digestion:0.4, senses:0.2},
    1200,
    1.1,
    {
      scavenger:{
        baseEffect(l, e){ return 0.01 * l * e}
      },
      locomotion:{
        effect(l, e){ return 1 + (l / (l + 50) * 0.5 * e )}
      },
      digestion:{
        effect(l, e){ return 1 + (l / (l + 50) * 0.5 * e)}
      },
      senses:{
        effect(l, e){ return 1 + (l / (l + 50) * 0.5 * e)}
      }
    },
    100,
    function(){return desc_skill(this)},
    function(){return skillables.value.skills.deepScouting.level >= 10 && skillables.value.skills.efficientDigestion.level >= 10 }
  ),
  rival1Study:new skill(
    'rival1Study',
    ['stage1'],
    {senses:0.3, locomotion:0.2, memory:0.2, rivals:0.3},
    300,
    1.1,
    {
      rivals:{
        effect(l, e){ return 1 + (l / (l + 50) * 0.5 * e)},
        baseEffect(l, e){return 0.1 * l * e}
      }
    },
    -1,
    function(){return desc_skill(this,undefined, `skillDesc_${refValues.value.rivalAttacks ? 'rival1Study_alt' : 'rival1Study'}`)},
    function(){return save.value.rivals.rival1.unlocked}
  ),
  rival2Study:new skill(
    'rival2Study',
    ['stage1'],
    {senses:0.2, locomotion:0.15, memory:0.2, rivals:0.45},
    700,
    1.1,
    {
      rivals:{
        effect(l, e){ return 1 + (l / (l + 50) * 0.5 * e)},
        baseEffect(l, e){return 0.1 * l * e}
      }
    },
    -1,
    function(){return desc_skill(this)},
    function(){return save.value.rivals.rival2.unlocked}
  ),
  bodyHardening:new skill(
    'bodyHardening',
    ['stage1', 'combat'],
    {senses:0.2, rivals:0.8},
    800,
    1.15,
    {
      defense:{
        baseEffect(l, e){return 0.03 * l * e}
      },
      senses:{
        effect(l, e){ return 1 + l / (l + 50) * e}
      }
    },
    -1,
    function(){return desc_skill(this, {4:`You currently are ${format((1 - (1 / statValues.value.effectTotal('defense'))) * 100, 4, 'eng')}% protected.`})},
    function(){return refValues.value.rivalAttacks >= 1}
  ),
  attack:new skill(
    'attack',
    ['stage1', 'combat'],
    {digestion:0.6, rivals:0.4},
    1200,
    1.1,
    {
      attack:{
        baseEffect(l, e){return 0.25 * l * e}
      },
      digestion:{
        effect(l, e){ return 1 + l / (l + 50) * e}
      }
    },
    -1,
    function(){return desc_skill(this)},
    function(){return refValues.value.rivalAttacks >= 3}
  ),
  aggression:new skill(
    'aggression',
    ['stage1', 'combat'],
    {locomotion:0.4, rivals:0.3, digestion:0.3},
    1500,
    1.1,
    {
      attackSpeed:{
        baseEffect(l, e){return 0.05 * l * e}
      },
      locomotion:{
        effect(l, e){ return 1 + l / (l + 50) * 0.5 * e}
      }
    },
    -1,
    function(){return desc_skill(this)},
    function(){return skillables.value.skills.attack.level >= 3}
  ),
  /*evasion:new skill(
    'evasion',
    ['basic', 'combat'],
    {locomotion:0.4, rivals:0.4, memory:0.2},
    2000,
    1.1,
    {
      delayAttack:{
        baseEffect(l, e){return 0.03 * l * e}
      },
      locomotion:{
        effect(l, e){return 1 + (0.15 * l * e)}
      }
    },
    function(){return desc_skill(this, {2:loc('skillDesc_evasion_1', format((statValues.value.effectTotal('delayAttack')-1)*100, 4, 'eng'))})},
    function(){return skillables.value.skills.rival1Study.level >= 12 && skillables.value.skills.rival2Study.level >= 8 }
  ),*/
  rivalBehavior:new skill(
    'rivalBehavior',
    ['stage1'],
    {memory:0.6, rivals:0.4},
    5000,
    1.15,
    {
      combat:{
        skillTagStudy(l){return 1 + (0.025 * l)}
      },
      memory:{
        effect(l, e){ return 1 + l / (l + 50) * 0.5 * e}
      }
    },
    -1,
    function(){return desc_skill(this)},
    function(){return skillables.value.skills.rival1Study.level >= 18 && skillables.value.skills.rival2Study.level >= 12 }
  ),
  abilities:new skill(
    'abilities',
    ['stage1', 'ability'],
    {memory:0.3, rivals:0.2, ability:0.2, senses:0.3},
    4000,
    1.05,
    {
      ability:{
        baseEffect(l, e){return 0.1 * l * e}
      }
    },
    -1,
    function(){return desc_skill(this)},
    function(){return skillables.value.skills.movement.level >= 50 && skillables.value.skills.memorization.level >= 50 && save.value.rivals.rival2.unlocked }
  ),
  mimicry:new skill(
    'mimicry',
    ['stage1', 'ability'],
    {senses:0.3, ability:0.3, rivals:0.3, memory:0.1},
    6000,
    1.15,
    {
      shapeShifting:{
        baseEffect(l, e){return (0.1 * l * e)}
      },
      ability:{
        baseEffect(l, e){return (0.05 * l * e)}
      }
    },
    -1,
    function(){return desc_skill(this)},
    function(){return skillables.value.skills.abilities.level >= 1 }
  ),
  confusion:new skill(
    'confusion',
    ['stage1', 'ability'],
    {ability:0.3, memory:0.3, rivals:0.3, senses:0.1},
    6000,
    1.15,
    {
      mindControl:{
        baseEffect(l, e){return (0.1 * l * e)}
      },
      ability:{
        baseEffect(l, e){return (0.05 * l * e)}
      }
    },
    -1,
    function(){return desc_skill(this)},
    function(){return skillables.value.skills.abilities.level >= 5 }
  ),
  boneGrowth:new skill(
    'boneGrowth',
    ['stage1', 'ability'],
    {senses:0.3, memory:0.3, ability:0.2, rivals:0.2},
    9000,
    1.05,
    {
      boneGrowth:{
        baseEffect(l, e){return 0.1 * l * e}
      }
    },
    -1,
    function(){return desc_skill(this)},
    function(){return skillables.value.skills.abilities.level >= 10 }
  ),
  boneOffense:new skill(
    'boneOffense',
    ['stage1', 'ability', 'combat'],
    {rivals:0.2, ability:0.4, boneGrowth:0.4},
    9000,
    1.12,
    {
      attack:{
        effect(l, e){return 1 + (0.08 * l * e)}
      },
      defense:{
        effect(l, e){ return 1 + l / (l + 50) * 0.5 * e}
      }
    },
    -1,
    function(){return desc_skill(this)},
    function(){return skillables.value.skills.boneGrowth.level >= 3 }
  ),
  core:new skill(
    'core',
    ['stage1', 'ability'],
    {boneGrowth:0.4, ability:0.3, memory:0.3},
    10000,
    1.15,
    {
      memory:{
        effect(l, e){return 1 + l / (l + 50) * 2 * e}
      },
      ability:{
        effect(l, e){return 1 + l / (l + 50) * 2 * e}
      },
      rivals:{
        effect(l, e){return 1 + l / (l + 50) * 2 * e}
      }
    },
    -1,
    function(){return desc_skill(this)},
    function(){return skillables.value.skills.abilities.level >= 8 && skillables.value.skills.boneGrowth.level >= 5 }
  ),
  hibernation:new skill(
    'hibernation',
    ['stage1', 'danger'],
    {senses:0.8, memory:0.2},
    1e6,
    1,
    {},
    1,
    function(){return desc_skill(this, {1:`<span class="danger" style="font-size:1.1rem;">${loc('skillDesc_hibernation_warn')}</span>`})},
    function(){return !save.value.rivals.rival1.alive && !save.value.rivals.rival2.alive }
  ),


  recollect:new skill(
    'recollect',
    ['stage2'],
    {time:1},
    300,
    1,
    {
      focus:{
        baseEffect(l){return 1 + 0.1 * l}
      },
      memory:{
        baseEffect(l, e){return 5 * l * e}
      },
      senses:{
        baseEffect(l, e){return 5 * l * e}
      },
      locomotion:{
        baseEffect(l, e){return 5 * l * e}
      },
      digestion:{
        baseEffect(l, e){return 5 * l * e}
      },
      digestionEfficiency:{
        baseEffect(l, e){return 0.1 * l * e}
      },
      ability:{
        baseEffect(l, e){return 4 * l * e}
      },
      boneGrowth:{
        baseEffect(l, e){return 4 * l * e}
      },
      multitasking:{
        baseEffect(l, e){return 0.025 * l * e}
      }
    },
    10,
    function(){return desc_skill(this)},
    function(){return true}
  ),
  stage2Focus:new skill(
    'stage2Focus',
    ['stage2'],
    {memory:1},
    120000,
    4,
    {
      focus:{
        baseEffect(l){return 1 * l}
      }
    },
    -1,
    function(){return desc_skill(this)},
    function(){return skillables.value.skills.recollect.level >= 3}
  ),
  experience:new skill(
    'experience',
    ['stage2'],
    {memory:0.25, senses:0.25, locomotion:0.25, digestion:0.25},
    8000,
    1.05,
    {
      memory:{
        baseEffect(l, e){return 1 * l * e}
      },
      senses:{
        baseEffect(l, e){return 1 * l * e}
      },
      locomotion:{
        baseEffect(l, e){return 1 * l * e}
      },
      digestion:{
        baseEffect(l, e){return 1 * l * e}
      }
    },
    -1,
    function(){return desc_skill(this)}
  ),
  exploration:new skill(
    'exploration',
    ['stage2'],
    {locomotion:0.5, senses:0.3, memory:0.2},
    10000,
    1.08,
    {
      exploration:{
        baseEffect(l, e){return 0.1 * l * e}
      }
    },
    -1,
    function(){return desc_skill(this)},
    function(){return skillables.value.skills.experience.level >= 1}
  ),
  fleshDigestion:new skill(
    'fleshDigestion',
    ['stage2'],
    {digestion:0.6, senses:0.2, memory:0.2},
    10000,
    1.08,
    {
      fleshDigestion:{
        baseEffect(l, e){return 0.1 * l * e}
      }
    },
    -1,
    function(){return desc_skill(this)},
    function(){return skillables.value.skills.exploration.level >= 1}
  ),
  stage2EfficientDigestion:new skill(
    'stage2EfficientDigestion',
    ['stage2'],
    {digestion:0.6, senses:0.4},
    16000,
    1.12,
    {
      digestionEfficiency:{
        effect(l, e){return 1 + 0.05 * l * e}
      },
      digestion:{
        effect(l, e){return 1 + 0.08 * l * e}
      }
    },
    -1,
    function(){return desc_skill(this)},
    function(){return skillables.value.skills.fleshDigestion.level >= 3}
  ),
  stage2Abilities:new skill(
    'stage2Abilities',
    ['stage2', 'ability'],
    {memory:0.5, ability:0.2, senses:0.3},
    20000,
    1.08,
    {
      ability:{
        effect(l, e){return 1 + (0.08 * l * e)}
      },
      boneGrowth:{
        effect(l, e){return 1 + (0.08 * l * e)}
      }
    },
    -1,
    function(){return desc_skill(this)},
    function(){return skillables.value.skills.recollect.level >= 10}
  ),
  stage2Core:new skill(
    'stage2Core',
    ['stage2', 'ability'],
    {boneGrowth:0.4, ability:0.3, memory:0.3},
    35000,
    1.15,
    {
      memory:{
        effect(l, e){return 1 + (l / (l + 50) * 2 * e)}
      },
      multitasking:{
        baseEffect(l, e){return (0.02 * l * e)}
      }
    },
    -1,
    function(){return desc_skill(this)},
    function(){return skillables.value.skills.experience.level >= 5}
  ),
  structureAnalyzing:new skill(
    'structureAnalyzing',
    ['stage2'],
    {memory:0.6, locomotion:0.2, senses:0.2},
    45000,
    1.15,
    {
      structureStudyRate:{
        baseEffect(l, e){return 0.04 * l * e}
      },
    },
    -1,
    function(){return desc_skill(this)},
    function(){return save.value.exploration.count >= 1}
  ),
  structureFocus:new skill(
    'structureFocus',
    ['stage2'],
    {ability:0.2, memory:0.2, locomotion:0.6},
    160000,
    5,
    {
      structureFocus:{
        baseEffect(l, e){return 1 * l * e}
      },
    },
    -1,
    function(){return desc_skill(this)},
    function(){return save.value.exploration.count >= 3}
  ),
  navigatePathways:new skill(
    'navigatePathways',
    ['stage2'],
    {locomotion:0.7, senses:0.3},
    110000,
    1.12,
    {
      exploration:{
        effect(l, e){return 1 + 0.025 * l * e}
      },
      locomotion:{
        effect(l, e){return 1 + 0.04 * l * e}
      }
    },
    -1,
    function(){return desc_skill(this)},
    function(){return skillables.value.structures.vessels.level >= 3}
  ),
  /*test1:new skill(
    'test1',
    ['basic'],
    {memory:1},
    100,
    1.05,
    {
      test:{
        baseEffect(l, e){ return 1 * l * e}
      }
    },
    function(){return desc_skill(this)},
    function(){return true}
  ),
  test2:new skill(
    'test2',
    ['basic'],
    {memory:1},
    100,
    1.05,
    {
      test1:{
        skillEffect(l){ return 1 + (1 * l)}
      }
    },
    function(){return desc_skill(this)},
    function(){return true}
  ),
  test3:new skill(
    'test3',
    ['basic'],
    {memory:1},
    1,
    1,
    {
    },
    function(){return desc_skill(this)},
    function(){return true}
  ),
  test4:new skill(
    'test4',
    [],
    {memory:1},
    100,
    1.1,
    {
      basic:{
        skillTagEffect(l){return 1 + 0.1 * l}
      }
    },
    function(){return desc_skill(this)},
    function(){return true}
  )*/
};

const structures = {
  bones:new structure(
    'bones',
    [],
    {boneGrowth:0.6, digestion:0.2, memory:0.2},
    150000,
    1.1,
    {
      exploration:{
        effect(l, e){return 1 + 0.01 * l * e}
      },
      boneGrowth:{
        effect(l, e){return 1 + 0.025 * l * e}
      }
    },
    function(){return desc_structure(this)}
  ),
  muscles:new structure(
    'muscles',
    [],
    {locomotion:0.6, ability:0.4},
    150000,
    1.1,
    {
      exploration:{
        effect(l, e){return 1 + 0.01 * l * e}
      },
      locomotion:{
        effect(l, e){return 1 + 0.025 * l * e}
      }
    },
    function(){return desc_structure(this)}
  ),
  vessels:new structure(
    'vessels',
    [],
    {locomotion:0.8, memory:0.2},
    150000,
    1.1,
    {
      exploration:{
        effect(l, e){return 1 + 0.01 * l * e}
      },
      locomotion:{
        effect(l, e){return 1 + 0.025 * l * e}
      }
    },
    function(){return desc_structure(this)}
  ),
  acid:new structure(
    'acid',
    [],
    {digestion:0.7, senses:0.25},
    150000,
    1.1,
    {
      exploration:{
        effect(l, e){return 1 + 0.01 * l * e}
      },
      digestion:{
        effect(l, e){return 1 + 0.025 * l * e}
      }
    },
    function(){return desc_structure(this)}
  ),
  rhythmic:new structure(
    'rhythmic',
    [],
    {locomotion:0.3, senses:0.4, memory:0.3},
    150000,
    1.1,
    {
      exploration:{
        effect(l, e){return 1 + 0.01 * l * e}
      },
      locomotion:{
        effect(l, e){return 1 + 0.025 * l * e}
      },
      senses:{
        effect(l, e){return 1 + 0.025 * l * e}
      }
    },
    function(){return desc_structure(this)}
  ),
  wall:new structure(
    'wall',
    [],
    {senses:0.5, memory:0.3, locomotion:0.2},
    150000,
    1.1,
    {
      exploration:{
        effect(l, e){return 1 + 0.01 * l * e}
      },
      senses:{
        effect(l, e){return 1 + 0.025 * l * e}
      }
    },
    function(){return desc_structure(this)}
  ),
};
export const skillables = ref({
  skills:skills,
  structures:structures
});
export const skillablesOrder = ref({
  skills:Object.keys(skills),
  structures:Object.keys(structures)
})

