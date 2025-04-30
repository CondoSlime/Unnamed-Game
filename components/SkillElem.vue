<script setup>
import Tooltip from './Tooltip.vue';
import Progressbar from './Progressbar.vue';
import {computed, watch, ref} from 'vue';
import {format} from '../Functions.js';
import loc from '../Localization.js';
const props = defineProps(['skill', 'study', 'style', 'fake']);
const study = props.study;
const skill = props.skill;
const style = props.style || {};
let delay = false;
const activated = ref(false);
const lingeringExpBar = computed(() => {
    /*const bar = Math.min(100, skill.expPercent);
    const level = skill.level;
    if(level > storedLevel && !delay){
      delay = true;
      storedLevel = level;
      setTimeout(() => {
        delay = false;
      }, 50) //keep progress bar filled briefly
    }
    return delay ? 100 : bar;*/
    //return Math.max(0, Math.min(100, (skill.expPercent - 5) * 1.1));
    return Math.min(100, skill.expPercent);
})
const fakeRequired = computed(() => {
  return skill.expMax * (skill.scaling ** skill.level);
})
/*<div class="progressBar">
  <div class="progress" :style="`width:${lingeringExpBar}%`"></div>
  <div class="progressText">{{format(skill.exp, 4, 'eng')}}/{{format(skill.required(), 4, 'eng')}}</div>
</div>*/
/*{{ skill.level>skill.maxLevel ? ` (${skill.maxLevel})` : `` }}*/
</script>

<template>
  <div v-if="!skill.fake && skill.unlocked" class="studyElem skillElem" :class="{active:study.order('skill').includes(skill.id)}" @click="study.switch('skill', skill.id)" :style="style">
    <Tooltip :text="skill.hasOwnProperty('description') ? skill.description() : ''" :img="skill.src" />
    <div class="inner">
      <div class="studyTop">
        <div class="activator">
          <div class="activator-study"></div>
        </div>
        <div class="title skill">{{loc(`skill_${skill.id}`)}} <span class="danger" v-if="skill.tags.includes('danger')">!</span></div>
        <div class="level" v-if="!skill.capped">{{format(skill.level, 4, 'eng')}}</div>
        <div class="level capped" v-else>{{format(skill.maxLevel, 4, 'eng')}}</div>
      </div>
      <div class="sstudyCenter">
      </div>
      <div class="studyBottom">
        <template v-if="skill.levelSpeed > 0.5 && study.order('skill').includes(skill.id)">
          <Progressbar :type="'bar'" :class="'fast'" :progress="100"></Progressbar>
          <div class="progressText">{{format(skill.levelSpeed, 4, 'eng')}}/s</div>
        </template>
        <template v-else-if="skill.capped">
          <Progressbar :type="'bar'" :class="'fast'" :progress="100"></Progressbar>
          <div class="progressText">MAX</div>
        </template>
        <template v-else>
          <Progressbar :type="'bar'" :progress="lingeringExpBar"></Progressbar>
          <div class="progressText">{{format(skill.exp, 4, 'eng')}}/{{format(skill.required(), 4, 'eng')}}</div>
        </template>
      </div>
    </div>
  </div>
  <div v-else-if="!skill.unlocked" class="studyElem locked">
    <div>?</div>
  </div>
  <div v-else-if="skill.fake && skill.unlocked" class="studyElem fake skillElem" :class="{active:activated}" :style="style" @click="activated = !activated">
    <Tooltip :text="skill.hasOwnProperty('description') ? skill.description() : ''" :img="skill.src" />
    <div class="inner">
      <div class="studyTop">
        <div class="activator">
          <div class="activator-study"></div>
        </div>
        <div class="title study">{{loc(`skill_${skill.id}`)}}</div>
        <div class="level" v-if="!skill.capped">{{format(skill.level, 4, 'eng')}}</div>
        <div class="level capped" v-else>{{format(skill.maxLevel, 4, 'eng')}}</div>
      </div>
      <div class="studyCenter">
      </div> <!-- Fake skill that's just used to be shown visually. -->
      <div class="studyBottom">
        <template v-if="skill.levelSpeed > 0.5">
          <Progressbar :type="'bar'" :class="'fast'" :progress="100"></Progressbar>
          <div class="progressText">{{format(skill.levelSpeed, 4, 'eng')}}/s</div>
        </template>
        <template v-else-if="skill.capped">
          <Progressbar :type="'bar'" :class="'fast'" :progress="100"></Progressbar>
          <div class="progressText">MAX</div>
        </template>
        <template v-else>
          <Progressbar :type="'bar'" :progress="lingeringExpBar"></Progressbar>
          <div class="progressText">{{format(skill.exp, 4, 'eng')}}/{{format(fakeRequired, 4, 'eng')}}</div>
        </template>
      </div>
    </div>
  </div>
</template>
