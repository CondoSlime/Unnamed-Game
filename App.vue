<script setup>
import StudyElem from './components/StudyElem.vue';
import Tooltip from './components/Tooltip.vue';
import TooltipMain from './components/TooltipMain.vue';
import ProgressBar from './components/Progressbar.vue';
import {ref, onMounted, onUnmounted, computed} from 'vue';
import {save, initGame, saveGame, loadGame, exportGame, importGame, resetGame} from './Save.js';
import {format} from './Functions.js';
import loc from './Localization.js';
import {statValues, skills, skillsOrder, values, refValues, study, formulas} from './Values.js';

/*save.stats = deepClone(entry);
save.rivals = deepClone(rivalsBase);
for(let [index, entry] of Object.entries(skills.value)){
    save.skills[index] = {level:0, exp:0}
}*/
const gameSpeed = values.misc.gameSpeed;
initGame();
checkValues();
let gameTimer;
let autoSaveTimer;
const webWorker = { w: false, s:false };
onMounted(() => {
  if (window.Worker){
    webWorker.w = new Worker(new URL("./Loop.js", import.meta.url));
    webWorker.w.addEventListener('message', function(){
        gameLoop();
    }, false);
    webWorker.s = true;
  }
  if(webWorker){
    webWorker.w.postMessage({ loop:"start", period: 1000 * gameSpeed });
  }
  else{
    gameTimer = setInterval(() => gameLoop(), 1000 * gameSpeed)
  }
  autoSaveTimer = setInterval(() => autoSave(), 60000);
})
function gameLoop(){
  for(let i=0;i<study.value.order.length; i++){
    const activeVal = study.value.order[i];
    skills.value[activeVal].advance(gameSpeed * 10); //level up activated skills
    if(skills.value[activeVal].capped){
      study.value.switch(activeVal);
    }
  }
  for(let [index, entry] of Object.entries(skills.value)){
    entry.update(); //check if new skills can be unlocked. Can lock skills again if the ['relock'] tag for said skill is set.
    //also checks for whether skill effect is updated, which changes how how skills affect stats
  }
  //console.log(statValues.value.allStats());
  //console.log(skills.movement.value.convertExp(200, 10), skills.movement.value.convertLevel(2));
  const senses = statValues.value.jobTotal('senses');
  const digestion = statValues.value.jobTotal('digestion');
  const size = save.value.res.size;
  const attack = statValues.value.jobTotal('attack');
  const aggression = statValues.value.jobTotal('attackSpeed');
  const nutrAction = save.value.misc.nutrAction;
  if(senses > 1){ /*find nutrients based on senses */
    //Nutrients found is equal to 1% of your senses stats (0.03 scoutSpeed)
    let amount = formulas.nutrientGathering();
    save.value.res.nutrients += amount;
    if(nutrAction === 'scouting'){
      if(refValues.value.advanceTimer('nutrAction') && digestion > 1 && (amount * values.timers.nutrAction / gameSpeed) <= save.value.res.nutrients){ //timer = ~30 seconds, 300 advamces
        save.value.misc.nutrAction = 'digestion'; //only start a digestion timer if you have at least 200 instances (20s) worth of nutrient production
      }
    }
  }
  if(digestion > 1){ /*digest nutrients to grow in size */
    //digestion is equal to 1% of your digestion stat
    
    const amount = formulas.nutrientDigestion();
    save.value.res.nutrients -= amount;
    save.value.res.size += amount * formulas.digestToSizeEff();
    if(nutrAction === 'digestion'){
      if(refValues.value.advanceTimer('nutrAction') && senses > 1 && (amount * values.timers.nutrAction / gameSpeed) >= save.value.res.nutrients){ //timer = ~30 seconds, 300 advances
        save.value.misc.nutrAction = 'scouting'; //only start a scouting timer if you have below 200 instances (20s) worth of nutrient production
      }
    }
  }
  /*if(deepExplore > 1){
    deep exploration raises your nutrients cap over time
    the higher the difference between nutrients amount and cap, the more nutrients come back over time
    each point of deep nutrient cap lowers expansion by 1% compoundingly as well as lowering by -0.01 speed (not below 0)
    let found = (deepExplore - 1) * values.deepExploreSpeed;
    if(deepNutrients >= 250){
      found *= 0.99 ** (deepNutrients - 250)
    }
    if(deepNutrients >= 500){
      found -= (deepNutrients - 500) * 0.01
    }
    if(found > 0){
      save.value.res.deepNutrients += found;
    }

  }*/
  /*if(digestion > 1 && nutrients > 0){
    //absorb nutrients equal to 1% of your digestion above 1
    //absorbtion is multiplied by the log2 value of available nutrients. (additively +1x per 2x nutrients)
    //or 1% of your digestion above 1 if nutrients are too low.
    //digestion rate is capped at your digestion multiplier;
    let amount = Math.max((digestion - 1) / 100, Math.max(1, Math.log2(nutrients)) * (digestion - 1) * values.misc.digestSpeed);
    amount = Math.min(amount, nutrients, digestion);
    save.value.res.nutrients -= amount;
    save.value.res.size += amount * statValues.value.digestToSizeEff();
  }*/
  if(size > 1){ //Lose 1% of your size every second.
    const sizeLoss = formulas.passiveSizeLoss();
    save.value.res.size -= sizeLoss;
  }
  /*if(nutrientsCap > nutrientsAvail){ //nutrients come back over time
    save.value.res.nutrientsAvail += (nutrientsCap - nutrientsAvail) * 0.001
  }*/
  const rival1 = save.value.rivals.rival1;
  const rival2 = save.value.rivals.rival2;
  if(size >= 25 && !rival1.unlocked){ //rival 1 unlock
    save.value.rivals.rival1.unlocked = true;
  }
  if(save.value.rivals.self.attacks >= 2){
    save.value.rivals.rival2.unlocked = true;
  }
  for(let i=0;i<values.rivalNames.length;i++){ //['rival1', 'rival2']
    const rivalName = values.rivalNames[i];
    const otherRivalName = values.rivalNames[(i+1)%2];
    const currRival = save.value.rivals[rivalName];
    const otherRival = save.value.rivals[otherRivalName];
    currRival.size += formulas.rivalPassiveSizeGain(rivalName);
    if(currRival.unlocked && save.value.skills[`rival1Study`].level >= 1){ //both rivals can attack when the first rival is first studied
      let attackTimer = refValues.value.advanceTimer(`${rivalName}Attack`, formulas.rivalAttackSpeed(rivalName), ['subtract']);
      if(attackTimer){ //rival attacks
        save.value.rivals[rivalName].attacks++;
        refValues.value.rivals[rivalName].warn = true;
        let isConfused = save.value.rivals[rivalName].confuse >= refValues.value.rivals[rivalName].confuseMax;
        let isFooled = save.value.rivals.self.mimicry >= refValues.value.rivals.self.mimicryMax;
        if(isConfused){
          //rival attacks other rival.
          //rivals attacking each other does not cause them to grow.
          currRival.confuse -= refValues.value.rivals[rivalName].confuseMax;
          let stolen = formulas.attackSizeStolen(rivalName, otherRivalName);
          stolen = Math.min(stolen, save.value.rivals[otherRivalName].size);
          save.value.rivals[otherRivalName].size -= stolen;
          save.value.rivals[rivalName].stolen = stolen;
          save.value.rivals[rivalName].lastTarget = 'rival';
        }
        else if(isFooled){ //rival is fooled by your mimicry and does not attack.
          save.value.rivals.self.mimicry -= refValues.value.rivals.self.mimicryMax;
          save.value.rivals[rivalName].stolen = 0;
          save.value.rivals[rivalName].lastTarget = 'fooled';
        }
        else{
          //rival attacks you
          let stolen = formulas.attackSizeStolen(rivalName, 'you');
          stolen = Math.min(stolen, save.value.res.size-1);
          save.value.res.size -= stolen;
          save.value.rivals[rivalName].size += formulas.rivalSizeGain(rivalName, stolen);
          save.value.rivals[rivalName].stolen = stolen;
          save.value.rivals[rivalName].lastTarget = "you";
        }
        if(otherRival.unlocked){
          let confuseMult = 1;
          if(currRival.lastTarget === 'fooled'){
            confuseMult = 2; //when a rival is fooled by mimicry, applied confusion is doubled.
          }
          if(otherRival.alive){
            currRival.confuse += formulas.rivalConfuseGain(rivalName) * confuseMult;
          }
          else{
            currRival.confuse = 0; //no rival to attack, no confusion
          }
        }
      }
    }
  }
  if(attack > 0){
    const target = ['rival1', 'rival2'].find((a) => save.value.rivals[a].alive);
    if(target){
      let attackTimer = refValues.value.advanceTimer('selfAttack', gameSpeed * aggression, ['subtract']);
      if(attackTimer){ //attack one of your rivals. Always attacks rival 1 followed by rival 2 if rival 1 is gone.
        save.value.rivals.self.attacks++;
        let stolen = formulas.attackSizeStolen('you', target);
        save.value.rivals[target].size -= stolen
        save.value.res.size += stolen;
        save.value.rivals.self.stolen = stolen;
        save.value.rivals.self.lastTarget = target;
        save.value.rivals.self.mimicry += formulas.mimicryGain();
        save.value.rivals.self.mimicry = Math.min(refValues.value.rivals.self.mimicryMax, save.value.rivals.self.mimicry);
      }
    }
  }
  checkValues();
};
onUnmounted(() => {
  if(save.value.settings.autoSave){ //does not actually trigger on site exit. Does trigger in development when reloading the build.
    saveGame();
  }
  if(webWorker){
    webWorker.w.postMessage({ loop:"stop" });
    webWorker.s = false;
  }
  else{
    clearInterval(gameTimer);
  }
  clearInterval(autoSaveTimer);
})

function checkValues(){ //check state of values. Run once on page load too.
  for(let i=0;i<values.rivalNames.length;i++){ //['rival1', 'rival2']
    const rivalName = values.rivalNames[i];
    const currRival = save.value.rivals[rivalName];
    if(currRival.size <= 0){
      save.value.rivals[rivalName].alive = false;
    }
    if(!currRival.alive){ //dead rivals grant a bonus to nutrients
      statValues.value.jobEffect.senses[`effect_deceased_${rivalName}`] = 1.5;
      statValues.value.jobEffect.digestion[`effect_deceased_${rivalName}`] = 1.5;
    }
    else{
      delete statValues.value.jobEffect.senses[`effect_deceased_${rivalName}`];
      delete statValues.value.jobEffect.digestion[`effect_deceased_${rivalName}`];
    }
  }
  if(refValues.value.rivalAttacks >= 1){
    refValues.value.stats.rivals.hidden = false; //rival first reveals itself to be hostile, unhide the "rivals" stat.
  }
}
function autoSave(){
  if(save.value.settings.autoSave){
    saveGame();
    console.log("Saved game!");
  }
}
const statRows = computed(() => {
  //stat breakdown
  let result = '';
  if(refValues.value.showStat){
    result += `<div style="font-size:1.5rem;">${loc(`stat_${refValues.value.showStat}`)}</div>`;
    result += `<div style="font-size:1.35rem;">Study rate: ${format(statValues.value.studyTotal(refValues.value.showStat), 4, 'eng')}</div>`;
    result += `<div style="font-size:1.35rem;">Non-study rate: ${format(statValues.value.jobTotal(refValues.value.showStat), 4, 'eng')}</div>`;
    result += `<div class="statTitle">Base speed</div>`;
    for(let [index, entry] of Object.entries(statValues.value.baseEffect[refValues.value.showStat])){
      if(index === 'base'){
        result += `<div>Base: ${entry}</div>`;
      }
      else{
        result += `<div>${loc(`${index}`) || index}: ${format(entry, 4, 'eng')}`;
      }
    }
    result += `<div class="statTitle">Multiplicative modifiers</div>`;
    for(let [index, entry] of Object.entries(statValues.value.effect[refValues.value.showStat])){
      if(entry !== 1){
        result += `<div>${loc(`${index}`) || index}: +${format((entry-1) * 100, 4, 'eng')}%`;
      }
    }
    result += `<div>Split focus: -${format((1 - formulas.studyPenalty()) * 100, 4, 'eng')}%</div>`;
    result += `<div>Size: +${format((formulas.sizeBonus()-1) * 100, 4, 'eng')}%</div>`;
    result += `<div class="statTitle">Multiplicative study modifiers</div>`;
    for(let [index, entry] of Object.entries(statValues.value.studyEffect[refValues.value.showStat])){
      if(entry !== 1){
        result += `<div>${loc(`${index}`) || index}: +${format((entry-1) * 100, 4, 'eng')}%`;
      }
    }
    result += `<div class="statTitle">Multiplicative non-study modifiers</div>`;
    for(let [index, entry] of Object.entries(statValues.value.jobEffect[refValues.value.showStat])){
      if(entry !== 1){
        result += `<div>${loc(`${index}`) || index}: +${format((entry-1) * 100, 4, 'eng')}%`;
      }
    }
  }
  return result;
})
const lastUnlocked = computed(() => {
  //items are unknown if not unlocked and hidden completely if there are no unlocked ones after it.
  const last = skillsOrder.findLastIndex((index) => skills.value[index].unlocked);
  return last;
})
const nutrientsDesc = computed(() => {
  let desc = ``;
  const nutrients = formulas.nutrientGathering();
  const digestion = formulas.nutrientDigestion();
  if(nutrients > 0){
    desc += loc('resDesc_nutrients_1', format(nutrients / gameSpeed, 4, 'eng'));
  }
  if(digestion > 0){
    if(desc){
      desc += '<br>';
    }
    desc += loc('resDesc_nutrients_2', format(digestion / gameSpeed, 4, 'eng'))
  }
  return desc;
})
const rival1AttackInfo = computed(() => {
  const rival = save.value.rivals.rival1;
  if(rival.attacks){
    if(rival.lastTarget === 'you'){
      return loc('rival_desc_attack', format(rival.stolen, 4, 'eng'));
    }
    else if(rival.lastTarget === 'rival'){
      return loc('rival_desc_attack_1', format(rival.stolen, 4, 'eng'));
    }
    else if(rival.lastTarget === 'fooled' && !statValues.value.jobTotal('mindControl')){
      return loc('rival_desc_attack_2');
    }
    else if(rival.lastTarget === 'fooled'){
      return loc('rival_desc_attack_3');
    }
  }
  return '';
})
const rival2Info = computed(() => {
  const rival = save.value.rivals.rival2;
  let content = '';
  if(save.value.rivals.rival1.alive){
    content += loc('rival2_desc');
  }
  else{
    content += loc('rival2_desc_2');
  }
  if(rival.attacks){
    content += '<br>';
    if(rival.lastTarget === 'you'){
      content += loc('rival_desc_attack', format(rival.stolen, 4, 'eng'));
    }
    else if(rival.lastTarget === 'rival'){
      content += loc('rival_desc_attack_1', format(rival.stolen, 4, 'eng'));
    }
    else if(rival.lastTarget === 'fooled' && !statValues.value.jobTotal('mindControl')){
      content += loc('rival_desc_attack_2');
    }
    else if(rival.lastTarget === 'fooled'){
      content += loc('rival_desc_attack_3');
    }
  }
  return content;
});
</script>

<template>
  <div class="sectionTop">
    <div class="stats">
      <div v-if="save.skills.scouting.unlocked" class="resourceItem">
        <ProgressBar v-if="save.misc.nutrAction === 'scouting'" :width="`${save.timers.nutrAction / values.timers.nutrAction * 100}%`" :background="'#225522'" />
        <ProgressBar v-if="save.misc.nutrAction === 'digestion'" :width="`${100 - (save.timers.nutrAction / values.timers.nutrAction * 100)}%`" :background="'#444411'" />
        <Tooltip :pos="'bottom'" :text="`${loc('resDesc_nutrients')}
        <br>${nutrientsDesc}`"/>
        <span class="front">{{ loc('res_nutrients', format(save.res.nutrients, 4, 'eng')) }}</span>
      </div>
      <div v-if="save.skills.digestion.unlocked" class="resourceItem">
        <Tooltip :pos="'bottom'" :text="`${loc('resDesc_size')}
        <br>${loc('resDesc_size_1', ((formulas.sizeBonus() - 1)*100).toFixed(0))}
        <br>${loc('resDesc_size_2', format(formulas.digestToSizeEff() * 100, 4, 'eng'))}`"/>
        {{loc('res_size', format(save.res.size, 4, 'eng')) }}
      </div>
      <div class="resourceItem">
        <Tooltip :pos="'bottom'" :text="`${loc('resDesc_focus')}
        <br>${loc('resDesc_focus_1')}
        <br>${loc('resDesc_focus_2', format(formulas.studyPenalty() * 100, 4, 'eng'))}`"/>
        {{loc('res_focus', format(study.max, 4, 'eng') - format(study.used, 4, 'eng'), format(study.max, 4, 'eng')) }}
      </div>
      <div v-if="save.rivals.rival1.unlocked" class="resourceItem" @mouseover="refValues.rivals.rival1.warn=false" :class="{deadRival:!save.rivals.rival1.alive}">
        <template v-if="!refValues.rivalAttacks">
          <Tooltip :pos="'bottom'" :text="`${loc('rival1_desc')}`"/>
          {{loc('rival1', format(save.rivals.rival1.size, 4, 'eng')) }}
        </template>
        <template v-else-if="save.rivals.rival1.alive">
          <div class="warnNotif front" v-if="refValues.rivals.rival1.warn" :class="{neutral:save.rivals.rival1.lastTarget !== 'you'}">*</div> <!--notification star after an attack-->
          <ProgressBar v-if="save.skills.rival1Study.level >= 5" :width="`${save.timers.rival1Attack / values.timers.rival1Attack * 100}%`" :background="'#552222'" />
          <ProgressBar :width="`${Math.min(100, save.rivals.rival1.confuse * refValues.rivals.rival1.confuseMax)}%`" :background="'#FF55AA'" :style="{height:'10%', bottom:0}" />
          <Tooltip :pos="'bottom'" :text="`${loc('rival1_desc_alt')}
          <br>${rival1AttackInfo}`"/>
          <span class="front">{{ loc('rival1_alt', format(save.rivals.rival1.size, 4, 'eng')) }}</span>
        </template>
        <template v-else>
          <Tooltip :pos="'bottom'" :text="`${loc('rival_desc_dead')}`"/>
          <span class="front">{{ loc('rival_dead') }}</span>
        </template>
      </div>
      <div v-if="save.skills.attack.level >= 1" class="resourceItem">
        <Tooltip :full="true" :pos="'bottom'" :text="`${loc('self_combat_desc')}
        <!--<br>${format(save.timers.selfAttack, 4, 'eng')}/${values.timers.selfAttack}-->
        ${save.rivals.self.lastTarget ? `<br>${loc('self_combat_desc_2', format(save.rivals.self.stolen, 4, 'eng'), loc(`${save.rivals.self.lastTarget}_name`))}` : ''}`"/>
        <ProgressBar :width="`${save.timers.selfAttack / values.timers.selfAttack * 100}%`" :background="'#225522'" />
        <ProgressBar :width="`${Math.min(100, save.rivals.self.mimicry * refValues.rivals.self.mimicryMax)}%`" :background="'#CCCCCC'" :style="{height:'10%', bottom:0}" />
        <span class="front">{{ "Combat timer" }}</span>
      </div>
      <div v-if="save.rivals.rival2.unlocked" class="resourceItem" @mouseover="refValues.rivals.rival2.warn=false" :class="{deadRival:!save.rivals.rival2.alive}">
        <template v-if="save.rivals.rival2.alive">
          <div class="warnNotif front" v-if="refValues.rivals.rival2.warn" :class="{neutral:save.rivals.rival2.lastTarget !== 'you'}">*</div> <!--notification star after an attack-->
          <ProgressBar v-if="save.skills.rival2Study.level >= 5" :width="`${save.timers.rival2Attack / values.timers.rival2Attack * 100}%`" :background="'#552222'" />
          <ProgressBar :width="`${Math.min(100, save.rivals.rival2.confuse * refValues.rivals.rival2.confuseMax)}%`" :background="'#FF55AA'" :style="{height:'10%', bottom:0}" />
          <Tooltip :pos="'bottom'" :text="`${rival2Info}`"/>
          <span class="front">{{loc('rival2', format(save.rivals.rival2.size, 4, 'eng')) }}</span>
        </template>
        <template v-else>
          <Tooltip :pos="'bottom'" :text="`${loc('rival_desc_dead')}`"/>
          <span class="front">{{ loc('rival_dead') }}</span>
        </template>
      </div>
    </div>
    <div class="menu">
      <div>
        <div class="button style-1" :class="{selected:refValues.screen === 'stats'}" @click="refValues.screen = (refValues.screen !== 'stats' ? 'stats' : 'game')">Stats</div>
      </div>
      <div>
        <div class="button style-1" :class="{selected:refValues.screen === 'settings'}" @click="refValues.screen = (refValues.screen !== 'settings' ? 'settings' : 'game')">Settings</div>
      </div>
      <div>
        <div class="button style-1" @click="save.timers.rival1Attack=values.timers.rival1Attack">
          <Tooltip :text="`Rival 1 timer: ${format(save.timers.rival1Attack, 4, 'eng')}/${values.timers.rival1Attack}`"/>
          Force rival 1 attack
        </div>
      </div>
      <div>
        <div class="button style-1" @click="save.timers.rival2Attack=values.timers.rival2Attack">
          <Tooltip :text="`Rival 2 timer: ${format(save.timers.rival2Attack, 4, 'eng')}/${values.timers.rival2Attack}`"/>
          Force rival 2 attack
        </div>
      </div>
      <div>
        <div class="button style-1" @click="save.timers.selfAttack=values.timers.selfAttack">
          <Tooltip :text="`Rival 2 timer: ${format(save.timers.selfAttack, 4, 'eng')}/${values.timers.selfAttack}`"/>
          Force self attack
        </div>
      </div>
      <div>
        <div class="button style-1" :class="{selected:save.settings.autoSave}" @click="save.settings.autoSave = !save.settings.autoSave">
          {{ save.settings.autoSave ? "Disable" : "Enable" }} Autosave
        </div>
      </div>
      <div>
        <div class="button style-1" @click="console.log(statValues.allSkills())">
          Print skill effects
        </div>
      </div>
      <div>
        <div class="button style-1" @click="console.log(statValues.allStats())">
          Print stat effects
        </div>
      </div>
      <div>
        <div class="button style-1" @click="console.log({...save})">
          Print save
        </div>
      </div>
    </div>
  </div>
  <div class="sectionMain">
    <div class="innerLeft">
      <template v-if="refValues.screen === 'game'">
      </template>
      <template v-else-if="refValues.screen === 'settings'">
      </template>
      <template v-else-if="refValues.screen === 'stats'">
        <div style="display:flex; flex-direction:column">
            <div class="statsItem button style-1" :class="{selected:(refValues.showStat === key)}" v-for="(value, key) in values.stats" :key="key" @click="refValues.showStat = key;">
            <Tooltip :pos="'right'" :text="`Base: ${statValues.baseEffectMods(key)}<br>
            Mult: ${statValues.EffectMods(key)}<br>
            Scaling: ${statValues.creepTotal(key) * 100}%`">
            </Tooltip>
            {{ loc(`stat_${key}`) }}
            </div>
        </div>
      </template>
      <template v-else>
        <div style="font-size:3rem; color:red;">Invalid setting: {{ refValues.screen }}</div>
      </template>
    </div>
    <div class="innerMain">
      <div class="skills" v-if="refValues.screen === 'game'">
        <template v-for="(item, index) in skillsOrder">
          <StudyElem v-if="lastUnlocked >= index" :key="skills[item].id" :skill="skills[item]" :study="study"/>
        </template>
      </div>
      <div class="settings" v-else-if="refValues.screen === 'settings'">
        <textarea id="saveArea" class="saveArea"></textarea>
        <div class="button style-1" @click="saveGame()">Save Game</div>
        <div class="button style-1" @click="exportGame()">Export Save</div>
        <div class="button style-1" @click="importGame()">Import Save</div>
        <div class="button style-1" @click="resetGame()">Reset Save</div>
      </div>
      <template v-else-if="refValues.screen === 'stats'">
        <div class="showStats" v-if="refValues.showStat" v-html="statRows"></div>
      </template>
    </div>
  </div>
  <TooltipMain/>
</template>