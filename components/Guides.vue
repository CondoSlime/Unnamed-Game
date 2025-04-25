<script setup>
import loc from '../Localization.js';
import StudyElem from './SkillElem.vue';
import images from '../Images.js';
import img from './images/Skill_hover_explanation.png';
const props = defineProps(['id']);
console.log(images);
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
console.log(img);
</script>

<template>
  <div v-if="props.id === 'basics'" style="padding:30px;">
    <div>{{ loc('guide_basics_1') }}</div>
    <div>{{ loc('guide_basics_2') }}</div>
    <div>{{ loc('guide_basics_3') }}</div>
    <div>{{ loc('guide_basics_4') }}</div>
    <div style="display:inline-block;">
      <div style="position:relative;">
        <StudyElem :skill="exampleSkill" :fake="true" :style="{marginTop:`10px`}"></StudyElem>
      </div>
      <div class="tooltip" style="position:static; display:inline-block; margin:10px;">
        {{loc('skillDesc_exampleSkill')}}<br>
        <span class="tag">{{ loc('tag_basic') }}</span> <span class="tag">{{ loc('tag_ability') }}</span><br>
        <span class="stat">{{ loc('stat_locomotion') }}</span>: 50% <span class="stat">{{ loc('stat_senses') }}</span>: 50%<br>
        {{loc('stat_memory')}}: +3 {{loc('stat_memory')}}: +30% {{loc('stat_memory')}}: +3
      </div>
    </div>
    <div>{{ loc('guide_basics_5') }}</div>
    <div>{{ loc('guide_basics_6') }}</div>
    <div>{{ loc('guide_basics_7') }}</div>
    <div>{{ loc('guide_basics_8') }}</div>
    <div v-html="loc('guide_basics_9', `<span class='skill'>${loc('skill')}</span>`, `<span class='tag'>${loc('tag')}</span>`)"></div>
  </div>
  <template v-else>
    <div>Template ID {{ props.id }} not found!</div>
  </template>
</template>

<style>
</style>