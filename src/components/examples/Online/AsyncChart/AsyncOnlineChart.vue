<template>
  <div class="chart-selector">
    <label class="ml-2 mr-2 chart-selector-label">Тип данных:</label>
    <TextCombobox v-model="dataType" :values="dataTypeList" :width="100" />
  </div>
  <div ref="canvasWrap" class="canvas-wrap"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, Ref, watch } from "vue";
import { JagmRawDataProvider } from "@incartdev/jagm-chart";
import { SignalGenerator } from "@incartdev/signal-generator-js";
import signalGeneratorSettings from "./SignalGeneratorSettings.json";
import visualizatorSettings from "./VisualizatorSettings.json";
import TextCombobox from "@/components/examples/TextCombobox.vue";
import { TextComboboxItem } from "@/components/examples/text-combobox-item";
import { createVisProvider, initOnlineVisProvider } from "@/ts/setup-vis-provider";
import { createContinuousDataGenerator } from "@/ts/create-data-generator";
import { createDataProvider } from "@/ts/create-data-provider";

const canvasWrap: Ref<HTMLElement | null> = ref(null);

const dataTypeList: Ref<TextComboboxItem[]> = ref([
  {
    id: "raw",
    text: "Raw"
  },
  {
    id: "prepared",
    text: "Prepared"
  }
]);
const dataType: Ref<TextComboboxItem> = ref(dataTypeList.value[0]);
let lastDataType = dataType.value.id;

let chartDataProvider = createDataProvider(dataType.value.id);
let visProvider = createVisProvider(chartDataProvider);
let dataGenerator: SignalGenerator | undefined = undefined;

watch(dataType, async () => {
  await changeChart();
});

async function initOnlineChart(): Promise<void> {
  if (canvasWrap.value === null) {
    return;
  }
  await initOnlineVisProvider({
    visProvider,
    chartDataProvider,
    canvasWrap: canvasWrap.value,
    visualizatorSettings
  });
  // Raw data arrives uncalibrated; prepared data is already calibrated upstream.
  if (chartDataProvider instanceof JagmRawDataProvider) {
    chartDataProvider.setCalibration(undefined, "ecg", [0], [1000], [0]);
    chartDataProvider.setCalibration(undefined, "reo", [0], [1000], [0]);
  }
  dataGenerator = await createContinuousDataGenerator(
    dataType.value.id,
    signalGeneratorSettings,
    visProvider,
    chartDataProvider
  );
  if (dataGenerator === undefined) {
    return;
  }
  dataGenerator.addListener(chartDataProvider);
  dataGenerator.start();
}

async function changeChart(): Promise<void> {
  await stopVisualization();
  if (lastDataType !== dataType.value.id) {
    chartDataProvider = createDataProvider(dataType.value.id);
    visProvider = createVisProvider(chartDataProvider);
    lastDataType = dataType.value.id;
  }
  await initOnlineChart();
}

async function stopVisualization(): Promise<void> {
  dataGenerator?.stop();
  dataGenerator = undefined;
  await visProvider.clear();
}

async function install(): Promise<void> {
  await nextTick();
  await initOnlineChart();
}

onMounted(async () => {
  await install();
});

onBeforeUnmount(async () => {
  await stopVisualization();
});
</script>

<style lang="scss" scoped>
@use "@/scss/vars.scss";
.canvas-wrap {
  height: 200px;
  position: relative;
}
.chart-selector-label {
  font-size: 0.8em;
}
.chart-selector {
  display: flex;
  flex-direction: row;
  align-items: center;
}
</style>
