<script setup>
const props = defineProps(['width', 'background', 'style']);

</script>

<template>
  <div class="progressBar" :style="{width:props.width, background:props.background, ...props.style}">
  </div>
</template>

<style>
.progressBar{
    height:100%;
    position:absolute;
    transition:0.1s;
    left:0;
}
</style>