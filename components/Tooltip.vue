<script setup>
import {ref, onMounted, onUnmounted, onUpdated, useTemplateRef, watch, watchEffect} from 'vue'
import {tooltipContent} from './Tooltip.js';
const props = defineProps(['text', 'img', 'style', 'pos', 'class', 'full']);
const tooltipRef = useTemplateRef('elem');
const showTooltip = () => {
  tooltipContent.value.content = props.text;
  tooltipContent.value.img = props.img;
  tooltipContent.value.class = props.class;
  tooltipContent.value.style = props.style;
  tooltipContent.value.originElem = tooltipRef.value;
}
const clearTooltip = () => {
  tooltipContent.value.content = "";
  tooltipContent.value.img = "";
  tooltipContent.value.class = "";
  tooltipContent.value.style = "";
  tooltipContent.value.originElem = "";
}
onUpdated(() => {
  if(tooltipContent.value.originElem === tooltipRef.value){
    tooltipContent.value.content = props.text;
    tooltipContent.value.img = props.img;
    tooltipContent.value.class = props.class;
    tooltipContent.value.style = props.style;
  }
})
/*<template class="tooltipElem" ref="elem" @mouseenter.capture.self="showTooltip" @mouseleave.capture.self="clearTooltip">
  <slot></slot>
</template>*/
</script>

<template>
  <span class="tooltipElem" ref="elem" @mouseenter="showTooltip" @mouseleave.capture.self="clearTooltip">
  </span>
</template>

<style>
.tooltipElem{
  position:absolute;
  top:0;
  left:0;
  width:100%;
  height:100%;
  z-index:500;
}
/*.full{
  width:100%;
  height:100%;
}*/
</style>
