<script setup>
import StudyElem from './components/StudyElem.vue';
import Tooltip from './components/Tooltip.vue';
import TooltipMain from './components/TooltipMain.vue';
import ProgressBar from './components/Progressbar.vue';
import {ref, onMounted, onUnmounted, computed} from 'vue';
import {save, initGame, saveGame, loadGame, exportGame, importGame, resetGame} from './Save.js';
import {format} from './Functions.js';
import loc from './Localization.js';
import {statValues, skills, skillsOrder, values, refValues, initRefValues, skillLockByTag, study, formulas} from './Values.js';

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
  for(let i=study.value.order.length-1;i>=0; i--){
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
  const gathering = formulas.nutrientGathering();
  const digestion = formulas.nutrientDigestion();
  const size = save.value.res.size;
  const attack = statValues.value.effectTotal('attack');
  const aggression = statValues.value.effectTotal('attackSpeed');
  const nutrAction = save.value.misc.nutrAction;

  if(save.value.skills.scouting.level >= 1 || save.value.res.nutrients > 0){
    save.value.res.nutrients += gathering; //find nutrients
    if(nutrAction === 'scouting'){
      if(refValues.value.advanceTimer('nutrAction')){ //cycle from gathering into digestion after 30s
        save.value.misc.nutrAction = 'digestion';
      }
    }

    save.value.res.nutrients -= digestion; //digest nutrients into size
    save.value.res.size += formulas.digestSizeGain(digestion);
    if(nutrAction === 'digestion'){
      if(refValues.value.advanceTimer('nutrAction')){ //cycle from gathering into digestion after 30s
        save.value.misc.nutrAction = 'scouting';
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
    if(currRival.unlocked && currRival.alive && save.value.skills[`rival1Study`].level >= 1){ //both rivals can attack when the first rival is first studied
      currRival.size += formulas.rivalPassiveSizeGain(rivalName);
      let attackTimer = refValues.value.advanceTimer(`${rivalName}Attack`, formulas.rivalAttackSpeed(rivalName), ['subtract']);
      if(attackTimer){ //rival attacks
        save.value.rivals[rivalName].attacks++;
        refValues.value.rivals[rivalName].warn = true;
        let isConfused = save.value.rivals[rivalName].confuse >= refValues.value.rivals[rivalName].confuseMax;
        let isFooled = save.value.rivals.self.mimicry >= refValues.value.rivals.self.mimicryMax;
        if(isConfused){
          //rival attacks other rival.
          //rivals attacking each other does not cause them to grow.
          //if other rival is dead, it does not attack instead.
          currRival.confuse = 0;
          if(otherRival.alive){
            let stolen = formulas.attackSizeStolen(rivalName, otherRivalName);
            stolen = Math.min(stolen, save.value.rivals[otherRivalName].size);
            save.value.rivals[otherRivalName].size -= stolen;
            save.value.rivals[rivalName].stolen = stolen;
            save.value.rivals[rivalName].lastTarget = 'rival';
          }
          else{
            save.value.rivals[rivalName].stolen = 0;
            save.value.rivals[rivalName].lastTarget = 'confused';
          }
        }
        else if(isFooled){ //rival is fooled by your mimicry and does not attack.
          save.value.rivals.self.mimicry = 0;
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
        if(currRival.lastTarget === 'fooled'){
          currRival.confuse += formulas.rivalConfuseGain(rivalName) * 2; //when a rival is fooled by mimicry, apply 2x your confusion to them.
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
        save.value.rivals[target].confuse += formulas.rivalConfuseGain(target);
        if(target === 'rival1' && save.value.rivals.rival2.unlocked){
          save.value.rivals.rival2.confuse += formulas.rivalConfuseGain('rival2') / 2; //apply half confusion to non-target rivals.
        }
        save.value.rivals.self.mimicry = Math.min(refValues.value.rivals.self.mimicryMax, save.value.rivals.self.mimicry);
      }
    }
  }
  checkValues();
  /*<div class="attackProgress" :style="{background: `conic-gradient(${false ? 'transparent' : '#228822'} ${save.timers.selfAttack / values.timers.selfAttack * 360}deg, transparent 0deg)`}">
            </div>
            <svg style="width:100%; height:100%; overflow:visible; min-height:50px; min-width:50px; top:50%; left:50%; transform:translate(-50%, -50%); position:absolute;" preserveAspectRatio="xMinYMin meet" viewBox="0 0 100 100">
              <circle r="50" cx="50" cy="50" style="fill:none; stroke: red; stroke-width: 10px; stroke-dasharray: 100 999; stroke-dashoffset: 0; transform-origin:0 0;"></circle>
            </svg>*/
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
      save.value.rivals[rivalName].confuse = 0;
      save.value.timers[`${rivalName}Attack`] = 0;
    }
    if(!currRival.alive){ //dead rivals grant a bonus to nutrients
      statValues.value.effect.scouting[`effect_deceased_${rivalName}`] = 1.5;
      statValues.value.effect.nutrientDigestion[`effect_deceased_${rivalName}`] = 1.5;
    }
    else{
      delete statValues.value.effect.scouting[`effect_deceased_${rivalName}`];
      delete statValues.value.effect.nutrientDigestion[`effect_deceased_${rivalName}`];
    }
  }
  if(!save.value.rivals.rival1.alive){
    refValues.value.rivals.rival2.confuseGain = 1;
  }
  else{
    refValues.value.rivals.rival2.confuseGain = values.rivals.rival2.baseConfuseGain;
  }
  if(!refValues.value.rivalsAlive){
    save.value.timers.selfAttack = 0;
    save.value.rivals.self.mimicry = 0;
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
    const tags = refValues.value.stats[refValues.value.showStat];
    result += `<div style="font-size:1.5rem;">${loc(`statDesc_${refValues.value.showStat}`)}</div>`;
    result += `<div style="font-size:1.35rem;">Total: ${format(statValues.value.effectTotal(refValues.value.showStat), 4, 'eng')}</div>`;
    result += `<div class="statTitle">Base modifiers</div>`;
    for(let [index, entry] of Object.entries(statValues.value.baseEffect[refValues.value.showStat])){
      /*if(index === 'base'){
        result += `<div>Base: ${entry}</div>`;
      }
      else{
        result += `<div>${loc(`${index}`) || index}: ${format(entry, 4, 'eng')}`;
      }*/
      if(entry !== 0 || index === "base"){
        result += `<div>${loc(`${index}`) || index}: ${format(entry, 4, 'eng')}`;
      }
    }
    result += `<div class="statTitle">Multiplicative modifiers</div>`;
    for(let [index, entry] of Object.entries(statValues.value.effect[refValues.value.showStat])){
      if(entry !== 1){
        result += `<div>${loc(`${index}`) || index}: +${format((entry-1) * 100, 4, 'eng')}%`;
      }
    }
    if(tags.study){
      const studyPenalty = formulas.studyPenalty();
      const sizeBonus = formulas.sizeBonus();
      if(studyPenalty != 1){
        result += `<div>Split focus: -${format((1-studyPenalty) * 100, 4, 'eng')}%</div>`;
      }
      if(sizeBonus != 1){
        result += `<div>Size: +${format((sizeBonus-1) * 100, 4, 'eng')}%</div>`;
      }
    }
  }
  return result;
})
const lastUnlocked = computed(() => {
  //items are unknown if not unlocked and hidden completely if there are no unlocked ones after it.
  const last = skillsOrder.findLastIndex((index) => skills.value[index].unlocked);
  return last;
});
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
});

const selfInfo = computed(() => {
  let content = '';
  if(!refValues.value.rivalAttacks){
    content += loc('self_status');
  }
  else if(!save.value.skills.attack.level){
    content += loc('self_status_2');
  }
  else if(!refValues.value.rivalsAlive){
    content += loc('self_status_3');
  }
  else{
    content += loc('self_status_combat');
    if(save.value.rivals.self.lastTarget){
      content += `<br>${loc('self_status_combat_2', format(save.value.rivals.self.stolen, 4, 'eng'), loc(`${save.value.rivals.self.lastTarget}_name`))}`;
    }
  }
  return content;
});

const rival1Info = computed(() => {
  const rival = save.value.rivals.rival1;
  let content = '';
  if(!refValues.value.rivalAttacks){
    content += loc('rival1_desc');
  }
  else if(save.value.rivals.rival1.alive){
    content += loc('rival1_desc_alt');
  }
  else{
    content += loc('rival_desc_dead');
  }
  if(rival.alive){
    content += `<br>${loc('rival_mass', format(rival.size, 4, 'eng'))}`;
    if(rival.attacks){
      content += '<br>';
      if(rival.lastTarget === 'you'){
        content += loc('rival_desc_attack_self', format(rival.stolen, 4, 'eng'));
      }
      else if(rival.lastTarget === 'rival'){
        content += loc('rival_desc_attack_rival', format(rival.stolen, 4, 'eng'));
      }
      else if(rival.lastTarget === 'fooled' && !statValues.value.effectTotal('mindControl')){
        content += loc('rival_desc_attack_fooled');
      }
      else if(rival.lastTarget === 'fooled'){
        content += loc('rival_desc_attack_fooled_2');
      }
      else if(rival.lastTarget === 'confused'){
        content += loc('rival_desc_attack_confused');
      }
    }
  }
  return content;
})
const rival2Info = computed(() => {
  const rival = save.value.rivals.rival2;
  let content = '';
  if(save.value.rivals.rival1.alive){
    content += loc('rival2_desc');
  }
  else if(rival.alive){
    content += loc('rival2_desc_2');
  }
  else{
    content += loc('rival_desc_dead');
  }
  if(rival.alive){
    content += `<br>${loc('rival_mass', format(rival.size, 4, 'eng'))}`;
    if(rival.attacks){
      content += '<br>';
      if(rival.lastTarget === 'you'){
        content += loc('rival_desc_attack_self', format(rival.stolen, 4, 'eng'));
      }
      else if(rival.lastTarget === 'rival'){
        content += loc('rival_desc_attack_rival', format(rival.stolen, 4, 'eng'));
      }
      else if(rival.lastTarget === 'fooled' && !statValues.value.effectTotal('mindControl')){
        content += loc('rival_desc_attack_fooled');
      }
      else if(rival.lastTarget === 'fooled'){
        content += loc('rival_desc_attack_fooled_2');
      }
      else if(rival.lastTarget === 'confused'){
        content += loc('rival_desc_attack_confused');
      }
    }
  }
  return content;
});
const mimicColor = computed(() => {
  const mimicPercent = save.value.rivals.self.mimicry >= refValues.value.rivals.self.mimicryMax;
  const rival1AttackPercent = save.value.timers.rival1Attack / values.timers.rival1Attack;
  const rival2AttackPercent = save.value.timers.rival2Attack / values.timers.rival2Attack;
  if(mimicPercent >= 1){
    return {
      mimicRival1:(save.value.rivals.rival1.alive && rival1AttackPercent >= rival2AttackPercent),
      mimicRival2:(save.value.rivals.rival2.alive &&rival2AttackPercent > rival1AttackPercent),
    }
  }
  else{
    return {};
  }
})
</script>

<template>
  <div class="sectionTop">
    <div class="stats">
      <div class="resourceItem">
        <ProgressBar v-if="save.misc.nutrAction === 'scouting'" :type="'bar'" :progress="(save.timers.nutrAction / values.timers.nutrAction * 100)" :color="'#225522'" />
        <ProgressBar v-if="save.misc.nutrAction === 'digestion'" :type="'bar'" :progress="100 - (save.timers.nutrAction / values.timers.nutrAction * 100)" :color="'#444411'" />
        <Tooltip :text="`${loc('resDesc_nutrients')}
        <br>${nutrientsDesc}`"/>
        <span class="front">{{ loc('res_nutrients', format(save.res.nutrients, 4, 'eng')) }}</span>
      </div>
      <div class="resourceItem">
        <Tooltip :text="`${loc('resDesc_size')}
        <br>${loc('resDesc_size_1', ((formulas.sizeBonus() - 1)*100).toFixed(0))}
        ${save.skills.nutrientDigestion.level >= 1 ? `<br>${loc('resDesc_size_2', format(formulas.digestSizeGain(1) * 100, 4, 'eng'))}` : ''}
        ${formulas.passiveSizeLoss() ? `<br>${loc('resDesc_size_3', format(formulas.passiveSizeLoss() / gameSpeed, 4, 'eng'))}` : ''}`"/>
        {{loc('res_size', format(save.res.size, 4, 'eng')) }}
      </div>
      <div class="resourceItem">
        <Tooltip :text="`${loc('resDesc_focus')}
        <br>${loc('resDesc_focus_1')}
        <br>${loc('resDesc_focus_2', format(formulas.studyPenalty() * 100, 4, 'eng'))}`"/>
        {{loc('res_focus', format(study.max, 4, 'eng') - format(study.used, 4, 'eng'), format(study.max, 4, 'eng')) }}
      </div>
      <!--<div class="resourceItem">
        <template v-if="save.skills.attack.level >= 1 && refValues.rivalsAlive">
          <Tooltip :text="`${loc('self_status_combat')}
          ${save.rivals.self.lastTarget ? `<br>${loc('self_status_combat_2', format(save.rivals.self.stolen, 4, 'eng'), loc(`${save.rivals.self.lastTarget}_name`))}` : ''}`"/>
          <ProgressBar :type="'bar'" :progress="save.timers.selfAttack / values.timers.selfAttack * 100" :color="'#225522'" />
          <ProgressBar :type="'bar'" :progress="Math.min(100, save.rivals.self.mimicry * refValues.rivals.self.mimicryMax)" :color="'#CCCCCC'" :style="{height:'10%', bottom:0}" />
          <span class="front">{{ "Status" }}</span>
        </template>
        <template v-else>
          <Tooltip :text="`${loc(refValues.rivalsAlive ? 'self_status' : 'self_status_2')}`"/>
          <span class="front">{{ "Status" }}</span>
        </template>
      </div>
      <div class="resourceItem" @mouseover="refValues.rivals.rival1.warn=false" :class="{deadRival:!save.rivals.rival1.alive}">
        <template v-if="save.rivals.rival1.unlocked">
          <template v-if="!refValues.rivalAttacks">
            <Tooltip :text="`${loc('rival1_desc')}`"/>
            {{loc('rival1', format(save.rivals.rival1.size, 4, 'eng')) }}
          </template>
          <template v-else-if="save.rivals.rival1.alive">
            <div class="warnNotif front" v-if="refValues.rivals.rival1.warn" :class="{neutral:save.rivals.rival1.lastTarget !== 'you'}">*</div>
            <ProgressBar v-if="save.skills.rival1Study.level >= 15" :type="'bar'" :progress="save.timers.rival1Attack / values.timers.rival1Attack * 100" :color="'#552222'" />
            <ProgressBar :type="'bar'" :progress="Math.min(100, save.rivals.rival1.confuse * refValues.rivals.rival1.confuseMax)" :color="'#FF55AA'" :style="{height:'10%', bottom:0}" />
            <Tooltip :text="`${loc('rival1_desc_alt')}
            <br>${rival1Info}`"/>
            <span class="front">{{ loc('rival1_alt', format(save.rivals.rival1.size, 4, 'eng')) }}</span>
          </template>
          <template v-else>
            <Tooltip :text="`${loc('rival_desc_dead')}`"/>
            <span class="front">{{ loc('rival_dead') }}</span>
          </template>
        </template>
      </div>
      <div class="resourceItem" @mouseover="refValues.rivals.rival2.warn=false" :class="{deadRival:!save.rivals.rival2.alive}">
        <template v-if="save.rivals.rival2.unlocked">
          <template v-if="save.rivals.rival2.alive">
            <div class="warnNotif front" v-if="refValues.rivals.rival2.warn" :class="{neutral:save.rivals.rival2.lastTarget !== 'you'}">*</div>
            <ProgressBar v-if="save.skills.rival2Study.level >= 15" :type="'bar'" :progress="save.timers.rival2Attack / values.timers.rival2Attack * 100" :color="'#552222'" />
            <ProgressBar :type="'bar'" :progress="Math.min(100, save.rivals.rival2.confuse * refValues.rivals.rival2.confuseMax)" :color="'#FF55AA'" :style="{height:'10%', bottom:0}" />
            <Tooltip :text="`${rival2Info}`"/>
            <span class="front">{{loc('rival2', format(save.rivals.rival2.size, 4, 'eng')) }}</span>
          </template>
          <template v-else>
            <Tooltip :text="`${loc('rival_desc_dead')}`"/>
            <span class="front">{{ loc('rival_dead') }}</span>
          </template>
        </template>
      </div>-->
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
        <div class="button style-1" @click="skillLockByTag('basic');">
          Lock/unlock all basic skills
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
        <div class="slimes">
          <div class="self slime">
            <div class="body" :style="{width:`${save.res.size ** 0.75}px`}" :class="mimicColor">
              <div class="attackProgress">
                <ProgressBar :type="'circle'" :progress="save.timers.selfAttack / values.timers.selfAttack * 100" :color="'green'" :style="{opacity:0.3}"></ProgressBar>
                <ProgressBar :type="'line-circle'" :progress="save.rivals.self.mimicry / refValues.rivals.self.mimicryMax * 100" :color="'#CCCCCC'" :lineWidth="5" :style="{opacity:0.5}"></ProgressBar>
                
                <Tooltip :text="selfInfo"/>
              </div>
            </div>
          </div>
          <div v-show="save.rivals.rival1.unlocked" class="rival1 slime">
            <div class="body" :style="{width:`${save.rivals.rival1.size ** 0.75}px`}" :class="{dead:!save.rivals.rival1.alive}">
              <div class="attackProgress">
                <ProgressBar v-if="save.skills.rival1Study.level >= 15" :type="'circle'" :progress="save.timers.rival1Attack / values.timers.rival1Attack * 100" :color="'#882222'" :style="{opacity:0.5}"></ProgressBar>
                <ProgressBar :type="'line-circle'" :progress="save.rivals.rival1.confuse / refValues.rivals.rival1.confuseMax * 100" :color="'#FF55AA'" :lineWidth="5" :style="{opacity:0.5}"></ProgressBar>
                
                <Tooltip :text="rival1Info"/>
                <template v-if="save.rivals.rival1.alive && false">
                  <div class="warnNotif front" v-if="refValues.rivals.rival1.warn" :class="{neutral:save.rivals.rival1.lastTarget !== 'you'}">*</div> <!--notification star after an attack-->
                </template>
              </div>
            </div>
          </div>
          <div v-show="save.rivals.rival2.unlocked" class="rival2 slime">
            <div class="body" :style="{width:`${save.rivals.rival2.size ** 0.75}px`}" :class="{dead:!save.rivals.rival2.alive}">
              <div class="attackProgress">
                <ProgressBar v-if="save.skills.rival2Study.level >= 15" :type="'circle'" :progress="save.timers.rival2Attack / values.timers.rival2Attack * 100" :color="'#882222'" :style="{opacity:0.5}"></ProgressBar>
                <ProgressBar :type="'line-circle'" :progress="save.rivals.rival2.confuse / refValues.rivals.rival2.confuseMax * 100" :color="'#FF55AA'" :lineWidth="5" :style="{opacity:0.5}"></ProgressBar>
                
                <Tooltip :text="rival2Info"/>
                <template v-if="save.rivals.rival2.alive && false">
                  <div class="warnNotif front" v-if="refValues.rivals.rival2.warn" :class="{neutral:save.rivals.rival2.lastTarget !== 'you'}">*</div> <!--notification star after an attack-->
                </template>
              </div>
            </div>
          </div>
        </div>
      </template>
      <template v-else-if="refValues.screen === 'settings'">
      </template>
      <template v-else-if="refValues.screen === 'stats'">
        <div style="display:flex; flex-direction:column">
            <div class="statsItem button style-1" :class="{selected:(refValues.showStat === key)}" v-for="(value, key) in values.stats" :key="key" @click="refValues.showStat = key;">
            <Tooltip :text="`Base: ${statValues.baseEffectMods(key)}<br>
            Mult: ${statValues.effectMods(key)}`">
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