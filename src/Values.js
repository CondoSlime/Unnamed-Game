import {skill} from './Classes.js';
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
skillLevel(l, e){return 1 + (0.01 * l * e)}, //skillLevel = multiplicative level modifier for skills, increases the "l" value.*/

export const statValues = ref({
  effect:{},
  baseEffect:{},
  studyEffect:{},
  jobEffect:{},
  skillEffect:{},
  skillBaseLevel:{},
  skillLevel:{},
  //price:{},
  //skillCreep:{},
  effectMods:{},
  baseEffectMods:{},
  studyEffectMods:{},
  jobEffectMods:{},
  skillEffectMods:{},
  skillBaseLevelMods:{},
  skillLevelMods:{},
  //priceMods:{},
  //skillCreepMods:{},
  tags:{},
  initialize:function(stats, skills){
      //add new stats so they can be used by future items.
      //can be re-run to add new stats afterwards
      for(let [index, entry] of Object.entries(stats)){
        this.baseEffect[index] = {base:1};
          this.effect[index] = {base:1};
          this.studyEffect[index] = {base:1};
          this.jobEffect[index] = {base:1}
          Object.defineProperty(this.effectMods, index, {get() {
              return Object.values(statValues.value.effect[index]).reduce((a,b) => a*b, 1);
          }});
          Object.defineProperty(this.baseEffectMods, index, {get() {
              return Object.values(statValues.value.baseEffect[index]).reduce((a,b) => a+b, 0); //base is additive
          }});
          Object.defineProperty(this.studyEffectMods, index, {get() {
              return Object.values(statValues.value.studyEffect[index]).reduce((a,b) => a*b, 1);
          }});
          Object.defineProperty(this.jobEffectMods, index, {get() {
              return Object.values(statValues.value.jobEffect[index]).reduce((a,b) => a*b, 1);
          }});
          /*Object.defineProperty(this.priceMods, index, {get() {
              return Object.values(statValues.value.price[index]).reduce((a,b) => a*b, 1);
          }});
          Object.defineProperty(this.skillCreepMods, index, {get() {
              return Object.values(statValues.value.skillCreep[index]).reduce((a,b) => a*b, 1);
          }});*/
      }
      for(let [index, entry] of Object.entries(skills)){
        this.skillEffect[index] = {base:1};
        this.skillBaseLevel[index] = {base:1};
        this.skillLevel[index] = {base:1};
        Object.defineProperty(this.skillEffectMods, index, {get() {
            return Object.values(statValues.value.skillEffect[index]).reduce((a,b) => a*b, 1);
        }});
        Object.defineProperty(this.skillBaseLevelMods, index, {get() {
            return Object.values(statValues.value.skillBaseLevel[index]).reduce((a,b) => a+b, 0); //base is additive
        }});
        Object.defineProperty(this.skillLevelMods, index, {get() {
            return Object.values(statValues.value.skillLevel[index]).reduce((a,b) => a*b, 1);
        }});
      }
      //this.price = deepClone(this.effect);
      //this.creep = deepClone(this.effect);
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
  studyTotal: function(type, mods=[]){ //returns combined experience gain from one or more stats combined, base of all stats happens first, then mult. Mult of each type is multiplicative with each other
      if(!this.effect[type]){
          console.warn(`Invalid value in statValues.studyTotal: ${type}`);
          return 1
      }
      let effect = this.baseEffectMods[type] * this.effectMods[type];
      if(save.value.stats[type].special || mods.includes('raw')){ //do not apply extra modifiers to special stats like focus.
        return effect;
      }
      effect *= this.studyEffectMods[type];
      effect *= formulas.sizeBonus();
      effect *= formulas.studyPenalty();
      return effect
  },
  jobTotal(type){ //returns speed for non-study related tasks like finding/digesting nutrients
    if(!this.effect[type]){
      console.warn(`Invalid value in statValues.jobTotal: ${type}`);
      return 1
    }
    let effect = this.baseEffectMods[type] * this.effectMods[type];
    effect *= this.jobEffectMods[type];
    return effect;
  },
  priceTotal: function(type){ //returns experience cap divider from one or more types combined, 1 = 100% required, 2 = 50% required
      if(!this.effect[type]){
          console.warn(`Invalid value in statValues.priceTotal: ${type}`);
          return 1
      }
      return 1 //rework or removal in progress
      //return this.priceMods[type];
  },
  creepTotal: function(type){ //returns divider to how much more expensive items become with each level from one or more types combined, 1 = 100% cost creep, 2 = 50% cost creep
      if(!this.effect[type]){
          console.warn(`Invalid value in statValues.creepTotal: ${type}`);
          return 1
      }
      return 1 //rework in progress
      //return this.priceMods[type];
  },
  skillEffectTotal: function(skill){
    let effect = this.skillEffectMods[skill];
    return effect;
  },
  skillLevelTotal: function(skill){ //supply with level from the 
    let effect = this.skillBaseLevelMods[skill] + save.value.skills[skill].level * this.skillLevelMods[skill];
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
    for(let [index, entry] of Object.entries(save.value.skills)){
      result[index] = {level:entry.level, exp:entry.exp, stats:{}}
      for(let [index2, entry2] of Object.entries(skills.value[index].effects)){
        result[index].stats[index2] = {}
        for(let [index3, entry3] of Object.entries(entry2)){
          result[index].stats[index2][index3] = entry3(entry.level);
        }
      }
    }
    return result;
  }
});
const timers = ['digestion', 'scouting', 'rival1Attack', 'rival2Attack', 'selfAttack'];
export const values = { //do not modify
  res:{
    nutrients:0,
    size:1,
  },
  timers:{ //in seconds
    nutrAction:30,
    rival1Attack:100,
    rival1Confuse:10,
    rival2Attack:240,
    rival2Confuse:10,
    selfAttack:100,
  },
  misc:{
    gameSpeed:0.1,
    nutrAction:'scouting',
    scoutSpeed:1,
    digestSpeed:1,
    sizeBonus:1.3,
    digestToSizeEff:0.1,
  },
  stats:{
    //hidden: Whether the resource is hidden or not. Shows as ??? in tooltips and doesn't show up in stats display (latter tbd)
    test:{}, //test skill with no effect
    locomotion:{/* tags */}, //basic stat, just used to speed up study rate of other skills
    senses:{}, //senses finds nutrients at 1 nutrient/s per 1 senses
    digestion:{}, //digestion turns nutrients into size at a rate of 1 nutrient/s into 0.1 size per 1 digestion
    digestionEfficiency:{}, //digestionEfficiency raises the amount of size gained per nutrient. formula: 0.1^(1/digestionEfficiency) at 2 digestionEfficiency it is 31.6%
    multitasking:{}, //lowers the study penalty for assigning multiple focus points at once. formula: penalty^(1/multitasking)
    scavenger:{}, //allows digesting nutrients while gathering and gathering nutrients while digesting. Gain 1% speed additively per point of scavenger
    memory:{}, //basic stat, just used to speed up study rate of other skills
    focus:{}, //allow learning one extra skill at a time per point of focus, study rate is divided by amount of activated skills
    rivals:{hidden:true}, //basic stat, just used to speed up study rate of other skills
    defense:{}, //lowers size loss from rival attacks. Size lost is divided by defense value
    attack:{}, //raises size stolen from attacks. Size stolen is multiplied by attack value
    attackSpeed:{}, //speed at which attacks from the player happen. By default this happens every 100 seconds, rate is multiplied by attack speed
    delayAttack:{}, //speed at which attacks from rivals happen. rate is divided by delayAttack
    combat:{}, //study multiplier for skills with the combat tag. Rate is multiplied by combat
    ability:{}, //basic stat, just used to speed up study rate of other skills
    mindControl:{}, //raises chance for rivals to attack other rivals instead of you, TBD
    shapeShifting:{} //may cause rivals to fail an attack on you, TBD
  },
  rivals:{
    rival1:{
      unlocked:false,
      size:400,
      strength:30,
      confuseBase:1,
      attacks:0,
      stolen:0,
      lastTarget:false
    },
    rival2:{
      unlocked:false,
      size:1000,
      strength:60,
      confuseBase:2,
      attacks:0,
      stolen:0,
      lastTarget:false
    },
    self:{
      attackTimer:1000,
      attackCurrTimer:0,
      attacks:0,
      stolen:0
    }
  }
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
    rival1Confuse:0,
    rival2Attack:0,
    rival2Confuse:0,
    selfAttack:0,
  },
  misc:{
    nutrAction:values.misc.nutrAction,
  },
  stats:deepClone(values.stats),
  rivals:{
    rival1:{
      unlocked:values.rivals.rival1.unlocked,
      size:values.rivals.rival1.size,
      attacks:values.rivals.rival1.attacks,
      stolen:values.rivals.rival1.stolen,
      lastTarget:values.rivals.rival1.lastTarget
    },
    rival2:{
      unlocked:values.rivals.rival2.unlocked,
      size:values.rivals.rival2.size,
      attacks:values.rivals.rival2.attacks,
      stolen:values.rivals.rival2.stolen,
      lastTarget:values.rivals.rival1.lastTarget
    },
    self:{
      attacks:values.rivals.self.attacks,
      stolen:values.rivals.self.stolen
    }
  },
  study:{
    order:[]
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
  rival1Warn:false,
  rival2Warn:false,
  screen:'game',
  showStat:'',
}
export const refValues = ref( //tracks values not used in the save file. These are cleared on page reload
  {...deepClone(refValuesBase),
    get rivalAttacks(){
      return save.value.rivals.rival1.attacks + save.value.rivals.rival2.attacks
    },
    seededRandom:seededRandom,
    advanceTimer: function(id, amount=values.misc.gameSpeed, mods=[]){
      if(!save.value.timers.hasOwnProperty(id)){
        console.warn(`property ${id} not found in timers!`);
        return false;
      }
      if(mods.includes('watch')){
        return save.value.timers[id] + amount;
      }
      if(!mods.includes('check')){
        save.value.timers[id] += amount;
      }
      if(save.value.timers[id] >= values.timers[id]){
        if(mods.includes('subtract')){
          save.value.timers[id] -= values.timers[id]
        }
        else if(!mods.includes('keep')){
          save.value.timers[id] = 0;
        }
        return true
      }
      return false;
    }
  }
);
export const formulas = {
  nutrientGathering:function(){ //gather 1 nutrients per second per point of senses.
    //gathering and digestion are on a cycle, gathering reduced to 10% of original per point of scavenger above 1 if cycle is digestion
    const scavenger = statValues.value.jobTotal('scavenger');
    const senses = statValues.value.jobTotal('senses');
    const rate = save.value.misc.nutrAction === 'scouting' ? 1 : (scavenger-1) / 100;
    return values.misc.scoutSpeed * (senses-1) * gameSpeed * rate;
  },
  nutrientDigestion:function(){ //convert 1 nutrients per second into mass per point of digestion
    //digestion converts 1 nutrients into 0.1 mass, this rate can be increased with the efficient digestion skill
    //gathering and digestion are on a cycle, digestion reduced to 10% of original per point of scavenger above 1 if cycle is scavenger
    const scavenger = statValues.value.jobTotal('scavenger');
    const digestion = statValues.value.jobTotal('digestion');
    const rate = save.value.misc.nutrAction === 'digestion' ? 1 : (scavenger-1) / 100;
    let amount = values.misc.digestSpeed * (digestion-1) * gameSpeed * rate;
    amount = Math.min(amount, save.value.res.nutrients);
    amount = Math.max(0, amount);
    return amount;
  },
  passiveSizeLoss:function(){ //lose 1% of current size above 1 per second.
    return (save.value.res.size - 1) * (0.01 * gameSpeed)
  },
  rivalAttackSpeed:function(which){ //returns attack value that rivals gain per cycle. Amount of value needed varies per rival, rival1 has 100, rival2 has 240, by default it's 1/s, reduced by the delayAttack stat
    const delayAttack = statValues.value.jobTotal('delayAttack');
    return delayAttack * gameSpeed;
  },
  attackSizeStolen:function(which, target){ //return the amount of size that either you or a rival would steal from you or another rival during an attack.
    //you can't attack yourself
    let stolen = 0;
    if(target === 'you'){ //rival attacks you
      const defense = statValues.value.jobTotal('defense');
      stolen = save.value.res.size / 100 * values.rivals[which].strength;
      stolen = Math.min(save.value.rivals[which].size / 10, stolen); //capped at 10% of rival mass
      stolen /= defense;
    }
    else if(which === 'you'){ //you attack rival
      const attack = statValues.value.jobTotal('attack');
      stolen = save.value.rivals[which].size / 100 * attack;
      stolen = Math.min(save.value.res.size / 10, stolen); //capped at 10% of your mass
      stolen = Math.min(save.value.rivals[which].size, stolen); //capped at 100% of rival mass
    }
    else{ //rival attacks rival
      stolen = save.value.rivals[target].size / 1000 * values.rivals[which].strength;
      stolen = Math.min(save.value.rivals[which].size / 10, stolen); //capped at 10% of rival mass
    }
    return stolen;
  },
  rivalSizeGain:function(which, amount){ //rivals gain diminished size if they go over the value they start with to prevent them growing out of control.
    return amount * 0.99 ** Math.max(0, (save.value.rivals[which].size + amount - values.rivals[which].size));
  },
  rivalConfuseGain:function(which){ //rivals become confused over time, when their value exeeds 10, they'll attack the other rival. Raises by 1 per attack for rival1 and 3 for rival2, affected by confusion skills.
    const confusion = statValues.value.jobTotal('mindControl');
    return values.rivals[which].confuseBase * confusion;
  },
  sizeBonus(size=false){ //study bonus from larger size. By default it's +30% additively whenever your size doubles
    return Math.max(1, 1+(values.misc.sizeBonus-1) * Math.log2(size || save.value.res.size));
  },
  studyPenalty(){ //study penalty for assigning more focus points at once, by default, study rate is divided by amount of points invested. Penalty reduced by multitasking skill
    return 1 / (Math.max(1, study.value.used) ** (1 / statValues.value.jobTotal("multitasking")));
  },
  digestToSizeEff(){ //efficienct of converting nutrients into mass. By default it's 10% (1 nutrients -> 0.1 mass), affected by efficient digestion skill
    return values.misc.digestToSizeEff ** (1 / statValues.value.jobTotal('digestionEfficiency'));
  },
}


export const study = ref({
  get max(){return statValues.value.jobTotal('focus')},
  get order(){return save.value.study.order},
  get used(){return this.order.length},
  switch:function(id){
    const studyVal = save.value.study;
    if(!this.order.includes(id) && this.max > this.order.length){
      save.value.study.order.push(id);
      save.value.skills[id].enabled = true;
    }
    else if(this.order.includes(id)){
      save.value.study.order.splice(studyVal.order.indexOf(id), 1);
      save.value.skills[id].enabled = false;
    }
  }
});


/*new item(
  'id', //this.id, internal id of item
  'name', //this.name, to be removed
  ['tag1', 'tag2'], //this.tags, tags of the item, may affect various parts or unlock conditions
  {stat1: 0.3, stat2:0.3, stat3:0.3}, //this.types, which stats the item is affected by with a weight attached.
  100, //this.expMax, amount of exp needed to get the first level
  4, //this.scaling, cost creep, when a level is gained, the experience required for the next level is multiplied by this amount
  { //this.effects
    stat1:{ //affects statValues.value.stat1 OR skills.value.stat1, effects are only applied if this item is unlocked
      //l is equal to the level of the item
      //e is equal to the effect modifier of the item (default 1)
      baseEffect(l, e){return 0.1 * l * e}, //this.effects.stat1.baseEffect(), baseEffect = linear additive modifier for stats.
      effect(l, e){return 1 + (0.01 * l * e)}, //effect = multiplicative modifier for stats (ALL multiplicative modifiers can go below 1 for a penalty),
      studyEffect(l, e){return 1 + (0.02 * l * e)}, //studyEffect = multiplicative modifier for stats. Only affects study rate for items dependent on the skill.
      jobEffect(l, e){return return 1 + (0.1 * l * e)} //jobEffect = multiplicative modifier for stats. Only affects tasks not related to skill learning like finding or digesting nutrients
      //price(l, e){return 1.01 ** (l * e)}, //price = multiplicative price divider for items dependent on the stat, divides amount of exp needed to get a level based on how dependent the skill is. To be removed or reworked as the effect is too complicated.
      //skillCreep(l, e){return 1.001 ** (l * e)}, //skillCreep = multiplicative cost creep divider for skills, reduces the speed at which the experience requirement goes up with every level
      skillEffect(l){return 1 + (0.01 * l)}, //skillEffect = multiplicative effect modifier for skills, affects the "e" value. Can not be affected by "e" or a recursive boost can happen
      skillBaseLevel(l){return 0.1 * l}, //skillLevel = additive level modifier for skills, increases the "l" value. Can not be affected by "e" or a recursive boost can happen
      skillLevel(l){return 1 + (0.01 * l)}, //skillLevel = multiplicative level modifier for skills, increases the "l" value. Can not be affected by "e" or a recursive boosts can happen
    },
    stat2{ //multiple stats can be affected
      effect(l, e) {return 1 + (l / (l + 500) * e)} //scaling can be different
    }
  },
  function(){return `Description text. Current speed: ${this.studyTotal()}`}, //description shown when hovering over this item
  function(){return statValues.value.studyTotal('stat1') >= 10 || this.unlocked} //unlock requirement. Item becomes active when the condition is met. Items can become locked again and stop working but keep their exp and levels.
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

function desc_standard(skill, insert=[], locName=['skillsDesc', skill.id], exclude=[]){
  return `${insert[0] ? `${insert[0]}<br>` : ''}\
${exclude.includes('descr') ? '' : `${loc(locName)}<br>`}\
${insert[1] ? `${insert[1]}<br>` : ''}\
${exclude.includes('statDescr') ? '' : `${statDescr(skill.types)}<br>`}\
${insert[2] ? `${insert[2]}<br>` : ''}\
${exclude.includes('speed') ? '' : `speed: ${format(skills.value[skill.id].studyTotal(), 4, 'eng')}<br>`}\
${insert[3] ? `${insert[3]}<br>` : ''}`.slice(0, -4);
}

function statDescr(types){
  return Object.entries(types).map((entry) => (
    save.value.stats[entry[0]].hidden ? 
      `???: ${format(entry[1]*100, 4, 'eng')}%`
    : 
      `${entry[0]}: ${format(entry[1]*100, 4, 'eng')}%`)
  ).join(' ');
}

export const skills = ref({
  focus:new skill(
    'focus',
    ['basic'],
    {memory:1},
    1000,
    4,
    {
      focus:{
        baseEffect(l){return 1 * l}
      }
    },
    function(){return desc_standard(this)},
    function(){return save.value.skills.memorization.level >= 10}
  ),
  movement:new skill(
    'movement',
    ['basic'],
    {senses:0.5, locomotion:0.3, memory:0.2},
    100,
    1.05,
    {
      locomotion:{
        baseEffect(l, e){ return 0.1 * l * e}
      }
    },
    function(){return desc_standard(this)}
  ),
  scouting:new skill(
    'scouting',
    ['basic'],
    {locomotion:0.55, memory:0.25, senses:0.2},
    100,
    1.05,
    {
      senses:{
        baseEffect(l, e){ return 0.1 * l * e}
      }
    },
    function(){return desc_standard(this)},
    function(){return save.value.skills.movement.level >= 3}
  ),
  deepScouting:new skill(
    'deepScouting',
    ['scouting', 'basic'],
    {senses:0.4, locomotion:0.4, digestion:0.2},
    400,
    1.08,
    {
      senses:{
        effect(l, e){return 1 + (l / (l + 100) * e)},
        baseEffect(l, e){ return 0.05 * l * e}
      },
      locomotion:{
        effect(l, e){return 1 + (l / (l + 100) * 0.5 * e)}
      }
    },
    function(){return desc_standard(this)},
    function(){return save.value.skills.scouting.level >= 15}
  ),
  memorization:new skill(
    'memorization',
    ['senses', 'basic'],
    {senses:0.5, memory:0.5},
    100,
    1.05,
    {
      memory:{
        baseEffect(l, e){return 0.1 * l * e }
      }
    },
    function(){return desc_standard(this)},
    function(){return save.value.skills.movement.level >= 5 && save.value.skills.scouting.level >= 5}
  ),
  digestion:new skill(
    'digestion',
    ['basic'],
    {senses:0.6, locomotion:0.2, memory:0.2},
    100,
    1.05,
    {
      digestion:{
        baseEffect(l, e){ return 0.1 * l * e}
      }
    },
    function(){return desc_standard(this)},
    function(){return save.value.res.nutrients >= 8}
  ),
  efficientDigestion:new skill(
    'efficientDigestion',
    ['basic'],
    {senses:0.3, digestion:0.3, memory:0.4},
    200,
    1.12,
    {
      digestionEfficiency:{
        effect(l, e){ return 1 + (0.01 * l * e)},
        baseEffect(l, e){ return 0.03 * l * e}
      },
      digestion:{
        baseEffect(l, e){ return 0.03 * l * e}
      }
    },
    function(){return desc_standard(this)},
    function(){return save.value.skills.digestion.level >= 15}
  ),
  multitasking:new skill(
    'multitasking',
    ['basic'],
    {memory:0.6, locomotion:0.2, senses:0.2},
    1000,
    1.1,
    {
      multitasking:{
        baseEffect(l, e){ return 0.03 * l * e}
      },
      memory:{
        effect(l, e){return 1 + (l / (l + 60) * e)}
      }
    },
    function(){return desc_standard(this)},
    function(){return save.value.skills.focus.level >= 2 }
  ),
  scavenger:new skill(
    'scavenger',
    ['basic'],
    {locomotion:0.4, digestion:0.4, ability:0.2},
    1200,
    1.1,
    {
      scavenger:{
        baseEffect(l, e){ return 1 * l * e}
      },
      digestion:{
        baseEffect(l, e){ return 0.1 * l * e}
      },
      senses:{
        baseEffect(l, e){ return 0.1 * l * e}
      }
    },
    function(){return desc_standard(this)},
    function(){return save.value.skills.deepScouting.level >= 10 && save.value.skills.efficientDigestion.level >= 10 }
  ),
  rival1Study:new skill(
    'rival1Study',
    ['basic'],
    {senses:0.3, locomotion:0.2, memory:0.2, rivals:0.3},
    300,
    1.1,
    {
      rivals:{
        effect(l, e){ return 1 + (l / (l + 100) * 0.5 * e)},
        baseEffect(l, e){return 0.05 * l * e}
      }
    },
    function(){return desc_standard(this,undefined, ['skillsDesc', (refValues.value.rivalAttacks ? 'rival1Study_alt' : 'rival1Study')])},
    function(){return save.value.rivals.rival1.unlocked}
  ),
  rival2Study:new skill(
    'rival2Study',
    ['basic'],
    {senses:0.2, locomotion:0.15, memory:0.2, rivals:0.45},
    700,
    1.1,
    {
      rivals:{
        effect(l, e){ return 1 + (l / (l + 100) * 0.5 * e)},
        baseEffect(l, e){return 0.05 * l * e}
      }
    },
    function(){return desc_standard(this)},
    function(){return save.value.rivals.rival2.unlocked}
  ),
  bodyHardening:new skill(
    'bodyHardening',
    ['basic', 'combat'],
    {senses:0.2, rivals:0.8},
    800,
    1.1,
    {
      defense:{
        baseEffect(l, e){return 0.04 * l * e}
      }
    },
    function(){return desc_standard(this, {1:`You currently are ${format((1 - (1 / statValues.value.jobTotal('defense'))) * 100, 4, 'eng')}% protected.`})},
    function(){return refValues.value.rivalAttacks >= 1}
  ),
  attack:new skill(
    'attack',
    ['basic', 'combat'],
    {digestion:0.6, rivals:0.4},
    1200,
    1.1,
    {
      attack:{
        baseEffect(l, e){return 0.1 * l * e}
      },
      digestion:{
        baseEffect(l, e){return 0.15 * l * e}
      }
    },
    function(){return desc_standard(this)},
    function(){return refValues.value.rivalAttacks >= 3}
  ),
  aggression:new skill(
    'aggression',
    ['basic', 'combat'],
    {locomotion:0.4, rivals:0.3, attack:0.3},
    1500,
    1.1,
    {
      attackSpeed:{
        baseEffect(l, e){return 0.1 * l * e}
      },
      locomotion:{
        baseEffect(l, e){return 0.1 * l * e}
      }
    },
    function(){return desc_standard(this)},
    function(){return save.value.skills.attack.level >= 3}
  ),
  evasion:new skill(
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
    function(){return desc_standard(this, {2:loc(['skillsDesc', 'evasion_1'], format((1-statValues.value.jobTotal('delayAttack'))*100, 4, 'eng'))})},
    function(){return save.value.skills.rival1Study.level >= 12 && save.value.skills.rival2Study.level >= 8 }
  ),
  rivalBehavior:new skill(
    'rivalBehavior',
    ['basic'],
    {memory:0.4, rival2:0.2},
    5000,
    1.15,
    {
      combat:{
        effect(l, e){return 1 + (0.15 * l * e)}
      },
      memory:{
        effect(l, e){return 1 + (0.1 * l * e)}
      }
    },
    function(){return desc_standard(this)},
    function(){return save.value.skills.rival1Study.level >= 24 && save.value.skills.rival2Study.level >= 16 }
  ),
  abilities:new skill(
    'abilities',
    ['basic', 'ability'],
    {memory:0.3, rivals:0.2, ability:0.2, senses:0.3},
    10000,
    1.08,
    {
      ability:{
        baseEffect(l, e){return 0.1 * l * e}
      }
    },
    function(){return desc_standard(this)},
    function(){return save.value.skills.movement.level >= 50 && save.value.skills.memory.level >= 50 && save.value.rivals.rival2.unlocked }
  ),
  confusion:new skill(
    'confusion',
    ['basic', 'ability'],
    {ability:0.3, memory:0.3, rivals:0.3, senses:0.1},
    10000,
    1.12,
    {
      mindControl:{
        baseEffect(l, e){return (0.1 * l * e)}
      },
      ability:{
        baseEffect(l, e){return (0.05 * l * e)}
      }
    },
    function(){return desc_standard(this)},
    function(){return save.value.skills.abilities.level >= 1 }
  ),
  mimicry:new skill(
    'mimicry',
    ['basic', 'ability'],
    {senses:0.3, ability:0.3, rivals:0.3, memory:0.1},
    10000,
    1.12,
    {
      shapeShifting:{
        baseEffect(l, e){return (0.1 * l * e)}
      },
      ability:{
        baseEffect(l, e){return (0.05 * l * e)}
      }
    },
    function(){return desc_standard(this)},
    function(){return save.value.skills.abilities.level >= 3 }
  ),
  test1:new skill(
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
    function(){return desc_standard(this)},
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
    function(){return desc_standard(this)},
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
    function(){return desc_standard(this)},
    function(){return true}
  )
});

statValues.value.initialize(values.stats, skills.value);
export const skillsOrder = Object.keys(skills.value);