<script setup>
import {ref, onUpdated, useTemplateRef, watch} from 'vue'
import {tooltipContent as TT} from './Tooltip.js';
const tooltipElem = useTemplateRef('elem');
const leftPos = ref(0);
const topPos = ref(0);
let update = false;
/*let compareText = props.text;
const recalc = () => {
  if(tooltipElem.value){
    const rect = tooltipElem.value.getBoundingClientRect(); //get element dimensions
    leftPos.value = Math.max(0, leftPos.value - rect.left); //increase or decrease position if tooltip is about to go off the left side.
    bottomPos.value = Math.max(0, bottomPos.value - rect.bottom); //increase or decrease position if tooltip is about to go off the left side.
  }
}*/
/*const offsets = {
  top:[0, 0.5],
  left:[0.5, 0],
  bottom:[1, 0.5],
  right:[0.5, 1]
}*/

onUpdated(() => { //update tooltip size on text change. Runs after text placed in tooltip.
  /*if(compareText !== props.text){
    compareText = props.text; //only update if text is different to prevent infinite loop.
    recalc();
  }*/
  if(update){
    update--;
    if(TT.value.originElem instanceof Element){
      const rect = TT.value.originElem.getBoundingClientRect(); //get element dimensions
      const TTrect = tooltipElem.value.getBoundingClientRect();
      let posVal;
      /*if(TT.value.pos instanceof Array){ posVal = TT.value.pos; }
      else{ posVal = offsets[TT.value.pos]; }
      topPos.value = Math.max(0, rect.top - TTrect.height * (1 - posVal[0]) + rect.height * posVal[0]);
      if(TT.value.pos === 'top'){ topPos.value -= 10; }
      if(TT.value.pos === 'bottom'){ topPos.value += 10; }
      if(topPos.value + TTrect.height > window.innerHeight){
        topPos.value = window.innerHeight - TTrect.height;
      }
      if(topPos.value < 0){
        topPos.value = 0;
      }
      leftPos.value = Math.max(0, rect.left - TTrect.width * (1 - posVal[1]) + rect.width * posVal[1]);
      if(TT.value.pos === 'left'){ leftPos.value -= 10; }
      if(TT.value.pos === 'right'){ leftPos.value += 10; }
      if(leftPos.value + TTrect.width > window.innerWidth){
        leftPos.value = window.innerWidth - TTrect.width;
      }
      if(leftPos.value < 0){
        leftPos.value = 0;
      }*/
     
      const width = tooltipElem.value.clientWidth;
      const height = tooltipElem.value.clientHeight;
      topPos.value = rect.top - TTrect.height - 10;
      if(topPos.value < 0){
        topPos.value = rect.top + rect.height + 10;
      }
      if(topPos.value + TTrect.height > window.innerHeight){
        topPos.value = window.innerHeight - TTrect.height;
      }
      leftPos.value = rect.left + (rect.width * 0.5) - (TTrect.width * 0.5);
      if(leftPos.value < 0){
        leftPos.value = 0;
      }
      if(leftPos.value + TTrect.width > window.innerWidth){
        leftPos.value = window.innerWidth - TTrect.width;
      }
    }
  }
})
watch((TT.value), () => {
  update = 2; //update twice to ensure dimensions and placement are correct.
})
</script>

<template>
  <div ref="elem" class="tooltip" :class="[TT.pos, TT.class]" v-show="TT.content" v-html="TT.content" :style="{left:`${leftPos}px`, top:`${topPos}px`}"></div>
</template>

<style>
.tooltip{
  position:absolute;
  padding:10px;
  color:#fff;
  border:1px solid #fff;
  background:black;
  z-index:1001;
  pointer-events:none;
  word-break:keep-all;
}
/*.tooltip.top{ transform:translate(0, -10px); }
.tooltip.right{ transform:translate(10px, 0); }
.tooltip.bottom{ transform:translate(0, 10px); }
.tooltip.left{ transform:translate(-10px, 0); }*/
</style>