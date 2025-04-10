<script setup>
import Tooltip from './Tooltip.vue';
import Progressbar from './Progressbar.vue';
import {computed, watch, ref} from 'vue'
import {format} from '../Functions.js'
import loc from '../Localization.js';
const props = defineProps(['item', 'study']);
const study = props.study;
const item = props.item;
let storedLevel = item.level;
let delay = false;
const lingeringExpBar = computed(() => {
    /*const bar = Math.min(100, item.expPercent);
    const level = item.level;
    if(level > storedLevel && !delay){
      delay = true;
      storedLevel = level;
      setTimeout(() => {
        delay = false;
      }, 50) //keep progress bar filled briefly
    }
    return delay ? 100 : bar;*/
    return Math.max(0, Math.min(100, (item.expPercent - 5) * 1.1));
})
/*<div class="progressBar">
  <div class="progress" :style="`width:${lingeringExpBar}%`"></div>
  <div class="progressText">{{format(item.exp, 4, 'eng')}}/{{format(item.required(), 4, 'eng')}}</div>
</div>*/
</script>

<template>
    <div v-if="item.unlocked" class="studyElem" @click="study.switch(item.id)">
      <Tooltip :text="item.description()" :pos="'top'"/>
      <div class="inner">
        <div class="studyTop">
          <div class="activator">
            <div class="activator-item" :class="{active:study.order.includes(item.id)}"></div>
          </div>
          <div class="title">{{loc(['skills', item.id])}}</div>
          <div class="level">{{format(item.level, 4, 'eng')}}</div>
        </div>
      <div class="studyCenter">
      </div>
      <div class="studyBottom">
        <template v-if="item.levelSpeed > 0.5 && study.order.includes(item.id)">
          <Progressbar :background="'#774444'" :width="`100%`"></Progressbar>
          <div class="progressText">{{format(item.levelSpeed, 4, 'eng')}}/s</div>
        </template>
        <template v-else>
          <Progressbar :background="'#552222'" :width="`${lingeringExpBar}%`"></Progressbar>
          <div class="progressText">{{format(item.exp, 4, 'eng')}}/{{format(item.required(), 4, 'eng')}}</div>
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
.activator{
    width:calc(100%/6);
    display:flex;
    align-items:center;
    padding-left:10px;
}
.activator-item{
    height:40px;
    aspect-ratio:1/1;
    border:1px solid #777777;
    border-radius:3px;
}
.activator-item.active{
    background:#444400;
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
