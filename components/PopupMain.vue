<script setup>
import popup from '../Popup.js';
import {computed} from 'vue';
const option1Selected = computed(() => {
  return (popup.value.option1Selected || (() => {}));
})
const option2Selected = computed(() => {
  return (popup.value.option2Selected || (() => {}));
})
const backgroundClass = computed(() => {
  return popup.backgroundClass || {};
})
</script>

<template>
  <template v-if="popup.active">
    <div class="popupBackground" :class="backgroundClass">
    </div>
    <div class="popupContent">
      <div class="content" v-html="popup.content"></div>
      <div class="buttons">
        <div class="button style-1" @click="popup.active = false; option1Selected()" v-html="popup.option1 || 'ok'"></div>
        <div v-if="popup.option2" class="button style-1" @click="popup.active = false; option2Selected()" v-html="popup.option2 || 'ok'"></div>
      </div>
    </div>
  </template>
</template>

<style>
.popupBackground{
  position:absolute;
  width:100%;
  height:100%;
  top:0;
  left:0;
  opacity:0.5;
  background:#000000;
  z-index:1000;
}
.popupContent{
  position:absolute;
  top:50%;
  left:50%;
  transform:translate(-50%, -50%);
  background:#000000;
  border:1px solid #FFFFFF;
  z-index:1001;
  min-width:200px;
  .content{
    padding:10px;
  }
}
.popupBackground.dark{
  background:
}
.buttons{
  min-height:30px;
  padding-bottom:4px;
  display:flex;
  justify-content:center;
  gap:10px;
  .button{
    min-width:60px;
  }
}
</style>