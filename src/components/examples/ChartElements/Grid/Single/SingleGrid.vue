<template>
  <div ref="canvasWrap" class="canvas-wrap"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, Ref } from "vue";
import { JagmRawDataProvider } from "@incartdev/jagm-chart";
import { createVisProvider } from "@/ts/setup-vis-provider";
import visualizatorSettings from "./VisualizatorSettings.json";

const canvasWrap: Ref<HTMLElement | null> = ref(null);
const chartDataProvider = new JagmRawDataProvider();
const visProvider = createVisProvider(chartDataProvider);

async function install(): Promise<void> {
  await nextTick();
  if (canvasWrap.value === null) {
    return;
  }
  // Проинициализировать библиотеку конфигурацией и запустить её
  await visProvider.create({
    settings: visualizatorSettings,
    rootHtml: canvasWrap.value
  });
}

onMounted(async () => {
  await install();
});
</script>

<style lang="scss" scoped>
@use "@/scss/vars.scss";
.canvas-wrap {
  height: 200px;
  position: relative;
}
</style>
