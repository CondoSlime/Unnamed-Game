<script setup>
import Tooltip from './Tooltip.vue';
import Progressbar from './Progressbar.vue';
import {computed, watch, ref} from 'vue';
import {format} from '../Functions.js';
import loc from '../Localization.js';
const props = defineProps(['study', 'structure', 'style', 'fake']);
const study = props.study;
const structure = props.structure;
const style = props.style || {};
let delay = false;
const activated = ref(false);
const lingeringExpBar = computed(() => {
    /*const bar = Math.min(100, study.expPercent);
    const level = study.level;
    if(level > storedLevel && !delay){
      delay = true;
      storedLevel = level;
      setTimeout(() => {
        delay = false;
      }, 50) //keep progress bar filled briefly
    }
    return delay ? 100 : bar;*/
    //return Math.max(0, Math.min(100, (study.expPercent - 5) * 1.1));
    return Math.min(100, structure.expPercent);
})
const fakeRequired = computed(() => {
  return structure.expMax * (structure.scaling ** structure.level);
})
/*<div class="progressBar">
  <div class="progress" :style="`width:${lingeringExpBar}%`"></div>
  <div class="progressText">{{format(study.exp, 4, 'eng')}}/{{format(study.required(), 4, 'eng')}}</div>
</div>*/
/*{{ study.level>study.maxLevel ? ` (${study.maxLevel})` : `` }}*/
console.log(structure.unlocked);
</script>

<template>
  <div v-if="!structure.fake && structure.unlocked" class="studyElem structureElem" :class="{active:study.order('structure').includes(structure.id)}" @click="study.switch('structure', structure.id)" :style="style">
    <Tooltip :text="structure.hasOwnProperty('description') ? structure.description() : ''" :img="structure.src" />
    <div class="inner">
      <div class="studyTop">
        <div class="activator">
          <div class="activator-study"></div>
        </div>
        <div class="title skill">{{loc(`structure_${structure.id}`)}} <span class="danger" v-if="structure.tags.includes('danger')">!</span></div>
        <div class="level">{{format(structure.level, 4, 'eng')}}</div>
      </div>
      <div class="studyCenter">
      </div>
      <div class="studyBottom">
        <template v-if="structure.levelSpeed > 0.5 && study.order('structure').includes(structure.id)">
          <Progressbar :type="'bar'" :progress="100"></Progressbar>
          <div class="progressText">{{format(structure.levelSpeed, 4, 'eng')}}/s</div>
        </template>
        <template v-else>
          <Progressbar :type="'bar'" :progress="lingeringExpBar"></Progressbar>
          <div class="progressText">{{format(structure.exp, 4, 'eng')}}/{{format(structure.required(), 4, 'eng')}}</div>
        </template>
      </div>
    </div>
  </div>
  <div v-else-if="!structure.unlocked" class="studyElem locked">
    <div>?</div>
  </div>
  <div v-else-if="structure.fake && structure.unlocked" class="studyElem fake structureElem" :class="{active:activated}" :style="style" @click="activated = !activated">
    <Tooltip :text="structure.hasOwnProperty('description') ? structure.description() : ''" :img="structure.src" />
    <div class="inner">
      <div class="studyTop">
        <div class="activator">
          <div class="activator-study"></div>
        </div>
        <div class="title study">{{loc(`structure_${structure.id}`)}}</div>
        <div class="level">{{format(structure.level, 4, 'eng')}}</div>
      </div>
      <div class="studyCenter">
      </div> <!-- Fake study that's just used to be shown visually. -->
      <div class="studyBottom">
        <template v-if="structure.levelSpeed > 0.5">
          <Progressbar :type="'bar'" :color="'#774444'" :progress="100"></Progressbar>
          <div class="progressText">{{format(structure.levelSpeed, 4, 'eng')}}/s</div>
        </template>
        <template v-else>
          <Progressbar :type="'bar'" :color="'#552222'" :progress="lingeringExpBar"></Progressbar>
          <div class="progressText">{{format(structure.exp, 4, 'eng')}}/{{format(fakeRequired, 4, 'eng')}}</div>
        </template>
      </div>
    </div>
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
.activator-study{
    height:40px;
    aspect-ratio:1/1;
    border:1px solid #777777;
    border-radius:3px;
}
.active .activator-study{
    background:var(--focus-color);
}
.active{
  box-shadow:0 0 10px 3px var(--focus-color);
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
  color:var(--capped-color);
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
