<script setup>
import {computed} from 'vue';
import loc from '../Localization.js';
import StudyElem from './SkillElem.vue';
import images from '../Images.js';
import img from './images/Skill_hover_explanation.png';
import {values} from '../Values.js';
import {format} from '../Functions.js';
const props = defineProps(['id']);
const exampleSkill = {
    id:'exampleSkill',
    tags:['basic', 'ability'],
    types:{locomotion:0.5, senses:0.5},
    expMax:100,
    scaling:1.05,
    effects:{
      memory:{
        baseEffect(l, e){return 0.1 * l * e }
      }
    },
    maxLevel:-1,
    level:4,
    exp:10,
    fake:true,
    unlocked:true,
    /*src:images['./components/images/Skill_hover_explanation.png'].default,*/
    /*src:img,*/
    unlockCondition:function(){return true}
};

function spanWrap(className, content){
  return `<span class='${className}'>${content}</span>`;
}
</script>

<template>
  <div class="guide" v-if="props.id === 'basics'">
    <div>{{ loc('guide_basics_1') }}</div>
    <div>{{ loc('guide_basics_2') }}<br>{{ loc('guide_basics_3') }}<br>{{ loc('guide_basics_4') }}</div>
    <div></div>
    <div></div>
    <div style="display:inline-block;">
      <div style="position:relative;">
        <StudyElem :skill="exampleSkill" :fake="true" :style="{marginTop:`10px`}"></StudyElem>
      </div>
      <div class="tooltip" style="position:static; display:inline-block; margin:10px;">
        {{loc('skillDesc_exampleSkill')}}<br>
        <span class="tag">{{ loc('tag_basic') }}</span> <span class="tag">{{ loc('tag_ability') }}</span><br>
        <span class="stat">{{ loc('stat_locomotion') }}</span>: 50% <span class="stat">{{ loc('stat_senses') }}</span>: 50%<br>
        {{loc('stat_memory')}}: +3 {{loc('stat_memory')}}: +30% {{loc('stat_senses')}}: +3
      </div>
    </div>
    <div v-html="`${loc('guide_basics_5')}<br>${loc('guide_basics_6')}<br>${loc('guide_basics_7')}<br>${loc('guide_basics_8')}<br>${loc('guide_basics_9', spanWrap('skill', loc('skill')), spanWrap('tag', loc('tag')))}`"></div>
  </div>


  <div class="guide" v-else-if="props.id === 'expGain'">
    <div>{{ loc('guide_expGain_1') }}<br>{{ loc('guide_expGain_2') }}</div>
    <div class="tooltip" style="position:static; display:inline-block; margin:10px;">
      {{loc('skillDesc_exampleSkill')}}<br>
      <span class="stat">{{ loc('stat_locomotion') }}</span>: 60% <span class="stat">{{ loc('stat_senses') }}</span>: 40%
    </div>
    <div style="height:20px; color:var(--text-dark); width:250px;">
      <div class="inline-flex-center" style="width:60%; height:100%; background:var(--stat-color); border-right:1px solid #777777;">{{ loc('stat_locomotion') }}</div>
      <div class="inline-flex-center" style="width:40%; height:100%; background:var(--skill-color);">{{  loc('stat_senses') }}</div>
    </div>
    <div v-html="`${loc('guide_expGain_3', 1000, 60, spanWrap('stat', loc('stat_locomotion')), 600, 10, 60)}<br>
     ${ loc('guide_expGain_4', 40, spanWrap('stat', loc('stat_senses')), 10, 40)}<br>
     ${ loc('guide_expGain_5', 100) }`"></div>
    <div style="height:20px; color:var(--text-dark); width:250px;">
      <div class="inline-flex-center" style="width:60%; height:100%; background:var(--stat-color); border-right:1px solid #777777;">60s</div>
      <div class="inline-flex-center" style="width:40%; height:100%; background:var(--skill-color);">40s</div>
    </div>
    <div v-html="`${loc('guide_expGain_6')}<br>
      ${loc('guide_expGain_7', 1, 600, 640)}`"></div>
    <div style="height:20px; color:var(--text-dark); width:250px;">
      <div class="inline-flex-center" style="width:60%; height:100%; background:var(--stat-color); border-right:1px solid #777777;"><span class="danger">600s</span></div>
      <div class="inline-flex-center" style="width:40%; height:100%; background:var(--skill-color);">40s</div>
    </div>
  </div>


  <div class="guide" v-else-if="props.id === 'rivals'">
    <div>{{ loc('guide_rivals_1') }}</div>
    <div v-html="`${loc('guide_rivals_2', spanWrap('skill', loc('skill_bodyHardening')))}<br>
      ${loc('guide_rivals_3')}<br>
      ${loc('guide_rivals_4')}<br>
      ${loc('guide_rivals_5')}`"></div>
    <div v-html="`${loc('guide_rivals_6', spanWrap('skill', loc('skill_attack')))}<br>
      ${loc('guide_rivals_7')}<br>
      ${loc('guide_rivals_8')}<br>
      ${loc('guide_rivals_9')}`"></div>
    <div v-html="`${loc('guide_rivals_10', spanWrap('skill', loc('skill_confusion')), spanWrap('skill', loc('skill_mimicry'))) }<br>
      ${ loc('guide_rivals_11', spanWrap('skill', loc('skill_confusion'))) }<br>
      ${ loc('guide_rivals_12') }<br>
      ${ loc('guide_rivals_13') }<br>
      ${ loc('guide_rivals_14', spanWrap('skill', loc('skill_mimicry'))) }<br>
      ${ loc('guide_rivals_15') }`"></div>
  </div>


  <div class="guide" v-else-if="props.id === 'size'">
    <div v-html="`${loc('guide_size_1')}`"></div>
    <div v-html="`${loc('guide_size_2', spanWrap('skill', loc('skill_scouting')), spanWrap('skill', loc('skill_nutrientDigestion')))}<br>
      ${loc('guide_size_3')}<br>
      ${loc('guide_size_4', spanWrap('stat', loc('stat_scouting')), spanWrap('stat', loc('stat_nutrientDigestion')))}<br>
      ${loc('guide_size_5', spanWrap('stat', loc('stat_nutrientDigestion')), spanWrap('stat', loc('stat_scouting')))}`"></div>
    <div v-html="`${loc('guide_size_6', spanWrap('skill', loc('skill_efficientDigestion')))}<br>
      ${loc('guide_size_7', spanWrap('skill', loc('skill_multitasking')))}`"></div>
    <div v-html="`${loc('guide_size_8', format((values.misc.sizeBonus-1) * 100, 4, 'eng'))}<br>
    ${loc('guide_size_9')}`"></div>
  </div>

  <template v-else>
    <div>Template ID {{ props.id }} not found!</div>
  </template>
</template>

<style>
</style>