<script setup>
const props = defineProps(['type', 'progress', 'color', 'lineWidth', 'style']);
/*
<ProgressBar2 :type="line-circle" :progress="40" :color="white" :width="'10px'"></ProgressBar2>
<ProgressBar2 :type="circle" :progress="40" :color="green" :style="{opacity:0.5}"></ProgressBar2>
*/
</script>

<template>
  <template v-if="props.type === 'bar'">
    <div class="progressBar" :style="{width:`${props.progress}%`, background:props.color, ...(props.style || {})}">
    </div>
  </template>
  <template v-else-if="props.type === 'circle'">
    <div class="progressBarCircle" :style="{background:`conic-gradient(${props.color} ${props.progress * 3.6}deg, transparent 0deg)`, ...(props.style || {})}">

    </div>
  </template>
  <template v-else-if="props.type === 'line-circle'">
    <svg class="svgProgressBarLineCircle" viewBox="0 0 100 100" :style="{'--lineWidth': `${props.lineWidth}px`}">
      <circle class="progressBarLineCircle" r="50" cx="50" cy="50" :style="{stroke: props.color, strokeDasharray: `${props.progress * Math.PI} 999`, ...(props.style || {})}"></circle>
    </svg>
  </template>
</template>

<style>
.progressBar{
  height:100%;
  position:absolute;
  transition:0.1s;
  left:0;
}
.progressBarCircle{
  width:100%;
  height:100%;
  border-radius:100%;
}
.svgProgressBarLineCircle{
  width:calc(100% - var(--lineWidth) / 2);
  height:calc(100% - var(--lineWidth) / 2);
  overflow:visible;
  position:absolute;
  top:50%;
  left:50%;
  transform:translate(-50%, -50%) rotate(-90deg);
  z-index:1;
}
.progressBarLineCircle{
  fill:none;
  stroke-width:var(--lineWidth);
  stroke-dashoffset: 0;
  transform-origin:0 0;
}
</style>