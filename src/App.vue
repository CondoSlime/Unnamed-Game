<script setup>
import StudyElem from './components/StudyElem.vue';
import Tooltip from './components/Tooltip.vue';
import TooltipMain from './components/TooltipMain.vue';
import ProgressBar from './components/Progressbar.vue';
import {ref, onMounted, onUnmounted, computed} from 'vue';
import {save, initSave, saveGame, loadGame, exportGame, importGame, resetGame} from './Save.js';
import {format} from './Functions.js';
import loc from './Localization.js';
import {statValues, skills, skillsOrder, values, refValues, study, formulas} from './Values.js';

/*save.stats = deepClone(entry);
save.rivals = deepClone(rivalsBase);
for(let [index, entry] of Object.entries(skills.value)){
    save.skills[index] = {level:0, exp:0}
}*/
initSave();
loadGame();
for(let [index, entry] of Object.entries(skills.value)){
  entry.update(); //update stats immediately on page load.
}

const gameSpeed = values.misc.gameSpeed;
let gameLoop;
onMounted(() => {
  gameLoop = setInterval(() => {
    for(let i=0;i<study.value.order.length; i++){
      const activeVal = study.value.order[i];
      skills.value[activeVal].advance(gameSpeed * 10); //level up activated skills
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
    const delayAttack = statValues.value.jobTotal('delayAttack');
    const scavenger = statValues.value.jobTotal('scavenger');
    const confusion = statValues.value.jobTotal('mindControl');
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
        if(refValues.value.advanceTimer('nutrAction') && senses > 1 && (amount * values.timers.nutrAction / gameSpeed) > save.value.res.nutrients){ //timer = ~30 seconds, 300 advances
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
    const rivals = ['rival1', 'rival2'];
    for(let i=0;i<rivals.length;i++){
      const rivalName = rivals[i];
      const otherRivalName = rivals[(i+1)%2];
      const currRival = save.value.rivals[rivalName];
      const otherRival = save.value.rivals[otherRivalName];
      if(currRival.unlocked && save.value.skills[`rival1Study`].level >= 1){ //both rivals can attack when the first rival is first researched
        let attackTimer = refValues.value.advanceTimer(`${rivalName}Attack`, formulas.rivalAttackSpeed(rivalName), ['subtract']);
        if(attackTimer){//rival attacks
          save.value.rivals[rivalName].attacks++;
          save.value.stats.rivals.hidden = false; //allow rival stat to show up in tooltips
          refValues.value[`${rivalName}Warn`] = true;
          let isConfused = false;
          if(otherRival.unlocked){
            isConfused = refValues.value.advanceTimer(`${rivalName}Confuse`, formulas.rivalConfuseGain(rivalName));
          }
          if(isConfused){
            //rival attacks other rival.
            let stolen = formulas.attackSizeStolen(rivalName, otherRivalName);
            save.value.rivals[otherRivalName].size -= stolen;
            save.value.rivals[rivalName].size += formulas.rivalSizeGain(rivalName, stolen) //rival size increases diminish based on the size they already have
            save.value.rivals[rivalName].stolen = stolen;
            save.value.rivals[rivalName].lastTarget = 'rival';
          }
          else{
            //rival attacks you
            let stolen = formulas.attackSizeStolen(rivalName, 'you');
            save.value.res.size -= stolen;
            save.value.rivals[rivalName].size += formulas.rivalSizeGain(rivalName, stolen) //rival size increases diminish based on the size they already have
            save.value.rivals[rivalName].stolen = stolen;
            save.value.rivals[rivalName].lastTarget = "you";
          }
        }
      }
    }
    if(attack > 1){
      let attackTimer = refValues.value.advanceTimer('selfAttack', gameSpeed * aggression, ['subtract']);
      if(attackTimer){ //attack one of your rivals. Always attacks rival 1 followed by rival 2 if rival 1 is gone.
        save.value.rivals.self.attacks++;
        let stolen = save.value.rivals.rival1.size / 100 * attack;
        save.value.rivals.rival1.size -= stolen
        save.value.res.size += stolen;
        save.value.rivals.self.stolen = stolen;
      }
    }
  }, 1000 * gameSpeed)
})
onUnmounted(() => {
  if(save.value.settings.autoSave){
    saveGame();
    console.log("Saved game!");
  }
  clearInterval(gameLoop);
})
const statRows = computed(() => {
  //stat breakdown
  let result = '';
  if(refValues.value.showStat){
    result += `<div style="font-size:1.5rem;">${loc(['stats', refValues.value.showStat])}</div>`;
    result += `<div style="font-size:1.35rem;">From skills: ${format(statValues.value.jobTotal(refValues.value.showStat), 4, 'eng')}</div>`;
    result += `<div style="font-size:1.35rem;">Total: ${format(statValues.value.studyTotal(refValues.value.showStat), 4, 'eng')}</div>`;
    result += `<div class="statTitle">Base speed</div>`;
    for(let [index, entry] of Object.entries(statValues.value.baseEffect[refValues.value.showStat])){
      if(index === 'base'){
        result += `<div>Base: 1</div>`;
      }
      else{
        result += `<div>${loc(['skills', index])}: ${format(entry, 4, 'eng')}`;
      }
    }
    result += `<div class="statTitle">Multiplicative effects</div>`;
    for(let [index, entry] of Object.entries(statValues.value.effect[refValues.value.showStat])){
      if(index === 'base'){
        result += `<div>Base: 100%</div>`;
      }
      else{
        result += `<div>${loc(['skills', index])}: +${format((entry-1) * 100, 4, 'eng')}%`;
      }
    }
    result += `<div>Split focus: -${format((1 - formulas.studyPenalty()) * 100, 4, 'eng')}%</div>`;
    result += `<div>Size: +${format((formulas.sizeBonus()-1) * 100, 4, 'eng')}%</div>`;
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
    desc += loc(['res', 'nutrients_desc_1'], format(nutrients / gameSpeed, 4, 'eng'));
  }
  if(digestion > 0){
    if(desc){
      desc += '<br>';
    }
    desc += loc(['res', 'nutrients_desc_2'], format(digestion / gameSpeed, 4, 'eng'))
  }
  return desc;
})
const rival1AttackInfo = computed(() => {
  if(save.value.rivals.rival1.attacks){
    if(save.value.rivals.rival1.lastTarget === 'you'){
      return loc(['rivals', 'rival_desc_attack'], format(save.value.rivals.rival1.stolen, 4, 'eng'));
    }
    else if(save.value.rivals.rival1.lastTarget === 'rival'){
      return loc(['rivals', 'rival_desc_attack_1'], format(save.value.rivals.rival1.stolen, 4, 'eng'));
    }
  }
  return '';
})
const rival2AttackInfo = computed(() => {
  if(save.value.rivals.rival2.attacks){
    if(save.value.rivals.rival2.lastTarget === 'you'){
      return loc(['rivals', 'rival_desc_attack'], format(save.value.rivals.rival2.stolen, 4, 'eng'));
    }
    else if(save.value.rivals.rival2.lastTarget === 'rival'){
      return loc(['rivals', 'rival_desc_attack_1'], format(save.value.rivals.rival2.stolen, 4, 'eng'));
    }
  }
  return '';
})
</script>

<template>
  <div class="sectionTop">
    <div class="stats">
      <div v-if="save.skills.scouting.unlocked" class="resourceItem">
        <ProgressBar v-if="save.misc.nutrAction === 'scouting'" :width="`${save.timers.nutrAction / values.timers.nutrAction * 100}%`" :background="'#225522'" />
        <ProgressBar v-if="save.misc.nutrAction === 'digestion'" :width="`${100 - (save.timers.nutrAction / values.timers.nutrAction * 100)}%`" :background="'#444411'" />
        <Tooltip :pos="'bottom'" :text="`${loc(['res', 'nutrients_desc'])}
        <br>${nutrientsDesc}`"/>
        <span class="front">{{ loc(['res', 'nutrients'], format(save.res.nutrients, 4, 'eng')) }}</span>
      </div>
      <div v-if="save.skills.digestion.unlocked" class="resourceItem">
        <Tooltip :pos="'bottom'" :text="`${loc(['res', 'size_desc'])}
        <br>${loc(['res', 'size_desc_1'], ((formulas.sizeBonus() - 1)*100).toFixed(0))}
        <br>${loc(['res', 'size_desc_2'], format(formulas.digestToSizeEff() * 100, 4, 'eng'))}`"/>
        {{loc(['res', 'size'], format(save.res.size, 4, 'eng')) }}
      </div>
      <div class="resourceItem">
        <Tooltip :pos="'bottom'" :text="`${loc(['res', 'focus_desc'])}
        <br>${loc(['res', 'focus_desc_1'])}
        <br>${loc(['res', 'focus_desc_2'], format(formulas.studyPenalty() * 100, 4, 'eng'))}`"/>
        {{loc(['res', 'focus'], format(study.max, 4, 'eng') - format(study.used, 4, 'eng'), format(study.max, 4, 'eng')) }}
      </div>
      <div v-if="save.rivals.rival1.unlocked" class="resourceItem" @mouseover="refValues.rival1Warn=false">
        <template v-if="!refValues.rivalAttacks">
          <Tooltip :pos="'bottom'" :text="`${loc(['rivals', 'rival1_desc'])}`"/>
          {{loc(['rivals', 'rival1'], format(save.rivals.rival1.size, 4, 'eng')) }}
        </template>
        <template v-else>
          <div class="warnNotif front" v-if="refValues.rival1Warn" :class="{neutral:save.rivals.rival1.lastTarget !== 'you'}">*</div> <!--notification star after an attack-->
          <ProgressBar v-if="save.skills.rival1Study.level >= 5" :width="`${save.timers.rival1Attack / values.timers.rival1Attack * 100}%`" :background="'#552222'" />
            <ProgressBar :width="`${Math.min(100, (save.timers.rival1Confuse + formulas.rivalConfuseGain('rival1')) * 10)}%`" :background="'#994499'" :style="{height:'20%', bottom:0}" />
          <Tooltip :pos="'bottom'" :text="`${loc(['rivals', 'rival1_desc_alt'])}
          <br>${rival1AttackInfo}`"/>
          <span class="front">{{ loc(['rivals', 'rival1_alt'], format(save.rivals.rival1.size, 4, 'eng')) }}</span>
        </template>
      </div>
      <div v-if="save.skills.attack.level >= 1" class="resourceItem">
        <Tooltip :full="true" :pos="'bottom'" :text="`${loc(['rivals', 'self_combat_desc'])}
        <!--<br>${format(save.timers.selfAttack, 4, 'eng')}/${values.timers.selfAttack}-->
        ${save.rivals.self.attacks >= 1 ? `<br>${loc(['rivals', 'self_combat_desc_2'], format(save.rivals.self.stolen, 4, 'eng'), loc(['rivals', 'rival1_name']))}` : ''}`"/>
        <ProgressBar :width="`${save.timers.selfAttack / values.timers.selfAttack * 100}%`" :background="'#225522'" />
        <span class="front">{{ "Combat timer" }}</span>
      </div>
      <div v-if="save.rivals.rival2.unlocked" class="resourceItem" @mouseover="refValues.rival2Warn=false">
        <div class="warnNotif front" v-if="refValues.rival2Warn" :class="{neutral:save.rivals.rival2.lastTarget !== 'you'}">*</div> <!--notification star after an attack-->
        <ProgressBar v-if="save.skills.rival2Study.level >= 5" :width="`${save.timers.rival2Attack / values.timers.rival2Attack * 100}%`" :background="'#552222'" />
        <ProgressBar :width="`${Math.min(100, (save.timers.rival2Confuse + formulas.rivalConfuseGain('rival2')) * 10)}%`" :background="'#994499'" :style="{height:'20%', bottom:0}" />
        <Tooltip :pos="'bottom'" :text="`${loc(['rivals', 'rival2_desc'])}
        <br>${rival2AttackInfo}`"/>
        <span class="front">{{ loc(['rivals', 'rival2'], format(save.rivals.rival2.size, 4, 'eng')) }}</span>
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
            <Tooltip :pos="'right'" :text="`Base: ${statValues.baseEffectMods[key]}<br>
            Mult: ${statValues.effectMods[key]}<br>
            Scaling: ${statValues.creepTotal(key) * 100}%`">
            </Tooltip>
            {{ loc(['stats', key]) }}
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
          <StudyElem v-if="lastUnlocked >= index" :key="skills[item].id" :item="skills[item]" :study="study"/>
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
        <div v-if="refValues.showStat" style="text-align:center;" v-html="statRows"></div>
      </template>
    </div>
  </div>
  <TooltipMain/>
</template>