<script setup>
import {ref, onMounted, onUnmounted, onUpdated, useTemplateRef, watch, watchEffect} from 'vue'
import {tooltipContent} from './Tooltip.js';
const props = defineProps(['text', 'style', 'pos', 'class', 'full']);
const tooltipRef = useTemplateRef('elem');
const showTooltip = () => {
  tooltipContent.value.content = props.text;
  tooltipContent.value.class = props.class;
  tooltipContent.value.style = props.style;
  tooltipContent.value.pos = props.pos || "bottom"
  tooltipContent.value.originElem = tooltipRef.value;
}
const clearTooltip = () => {
  tooltipContent.value.content = "";
  tooltipContent.value.class = "";
  tooltipContent.value.style = "";
  tooltipContent.value.pos = "";
  tooltipContent.value.originElem = "";
}
onUpdated(() => {
  if(tooltipContent.value.originElem === tooltipRef.value){
    tooltipContent.value.content = props.text;
    tooltipContent.value.class = props.class;
    tooltipContent.value.style = props.style;
    tooltipContent.value.pos = props.pos || "bottom"
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
