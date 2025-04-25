<script setup>
import loc from '../Localization.js';
import StudyElem from './StudyElem.vue';
import images from '../Images.js';
import img from './images/Skill_hover_explanation.png';
const props = defineProps(['id']);
console.log(images);
const exampleSkill = {
    id:'exampleSkill',
    tags:['tags'],
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
        <img src="./images/Skill_explanation.png" style="width:100%; height:100%; position:absolute; top:0; left:0; z-index:1;">
        <StudyElem :skill="exampleSkill" :fake="true" :style="{marginTop:`10px`}"></StudyElem>
      </div>
      <img src="./images/Skill_hover_explanation.png" style="margin:15px auto; display:block;">
    </div>
    <div>{{ loc('guide_basics_5') }}</div>
    <div>{{ loc('guide_basics_6') }}</div>
    <div>{{ loc('guide_basics_7') }}</div>
    <div>{{ loc('guide_basics_8') }}</div>
  </div>
  <template v-else>
    <div>Template ID {{ props.id }} not found!</div>
  </template>
</template>

<style>
</style>