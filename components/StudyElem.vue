<script setup>
import Tooltip from './Tooltip.vue';
import Progressbar from './Progressbar.vue';
import {computed, watch, ref} from 'vue';
import {format} from '../Functions.js';
import loc from '../Localization.js';
const props = defineProps(['skill', 'study']);
const study = props.study;
const skill = props.skill;
let delay = false;
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
/*<div class="progressBar">
  <div class="progress" :style="`width:${lingeringExpBar}%`"></div>
  <div class="progressText">{{format(skill.exp, 4, 'eng')}}/{{format(skill.required(), 4, 'eng')}}</div>
</div>*/
/*{{ skill.level>skill.maxLevel ? ` (${skill.maxLevel})` : `` }}*/
</script>

<template>
    <div v-if="skill.unlocked" class="studyElem" :class="{active:study.order.includes(skill.id)}" @click="study.switch(skill.id)">
      <Tooltip :text="skill.description()" :pos="'top'"/>
      <div class="inner">
        <div class="studyTop">
          <div class="activator">
            <div class="activator-skill"></div>
          </div>
          <div class="title skill">{{loc(`skill_${skill.id}`)}}</div>
          <div class="level" v-if="!skill.capped">{{format(skill.level, 4, 'eng')}}</div>
          <div class="level capped" v-else>{{format(skill.maxLevel, 4, 'eng')}}</div>
        </div>
      <div class="studyCenter">
      </div>
      <div class="studyBottom">
        <template v-if="skill.levelSpeed > 0.5 && study.order.includes(skill.id)">
          <Progressbar :type="'bar'" :color="'#774444'" :progress="100"></Progressbar>
          <div class="progressText">{{format(skill.levelSpeed, 4, 'eng')}}/s</div>
        </template>
        <template v-else-if="skill.capped">
          <Progressbar :type="'bar'" :color="'#552222'" :progress="100"></Progressbar>
          <div class="progressText">MAX</div>
        </template>
        <template v-else>
          <Progressbar :type="'bar'" :color="'#552222'" :progress="lingeringExpBar"></Progressbar>
          <div class="progressText">{{format(skill.exp, 4, 'eng')}}/{{format(skill.required(), 4, 'eng')}}</div>
        </template>
      </div>
    </div>
  </div>
  <div v-else class="studyElem locked">
    <div>?</div>
  </div>
</template>

<style>
.inner{
    overflow:hidden;
    height:100%;
    border-radius:inherit;
}
.studyTop{
    display:flex;
    height:60%;
}
.studyElem{
  transition: box-shadow 3s;
}
.activator{
    width:calc(100%/6);
    display:flex;
    align-items:center;
    padding-left:10px;
}
.activator-skill{
    height:40px;
    aspect-ratio:1/1;
    border:1px solid #777777;
    border-radius:3px;
}
.active .activator-skill{
    background:#444400;
}
.active{
  box-shadow:0 0 10px 3px #444400;
}
.title{
    width:calc(100%/6*4);
    font-size:1.2rem;
    display:flex;
    align-items:center;
    justify-content:center;
}
.level{
    width:calc(100%/6);
    word-break:break-all;
    display:flex;
    align-items:center;
    justify-content:center;
    font-size:1.2rem;
    flex-shrink:0;
}
.level.capped{
  color:#CCCC99;
}
.studyCenter{
    display:flex;
    height:0%;
}
.studyBottom{
    height:40%;
    position:relative;
}
.progressText{
    height:100%;
    width:100%;
    position:absolute;
    z-index:1;
    display:flex;
    align-items:center;
    justify-content:center;
}
</style>
