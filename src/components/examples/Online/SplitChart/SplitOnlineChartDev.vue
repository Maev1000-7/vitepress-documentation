<template>
  <div class="chart-selector">
    <label class="ml-2 mr-2 chart-selector-label">Тип данных:</label>
    <TextCombobox v-model="dataType" :values="dataTypeList" :width="100" />
    <label class="ml-5 mr-2 chart-selector-label">Развертка сигнала:</label>
    <TextCombobox v-model="signalDrawMode" :values="signalDrawModeList" :width="100" />
    <label class="ml-5 mr-2 chart-selector-label">Отрисовка линий:</label>
    <TextCombobox v-model="lineDrawType" :values="lineDrawTypeList" :width="100" />
  </div>
  <div class="canvas-wrap-container">
    <div ref="canvasWrap" class="canvas-wrap"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, Ref, watch } from "vue";
import {
  JagmPreparedDataProvider,
  JagmChartDataProvider,
  JagmRawDataProvider
} from "@incartdev/jagm-chart";
import { SignalGenerator } from "@incartdev/signal-generator-js";
import { createContinuousDataGenerator } from "@/ts/create-data-generator";
import lowFreqGeneratorSettings from "./generators/LowFreqGeneratorSettings.json";
import highFreqGeneratorSettings from "./generators/HighFreqGeneratorSettings.json";
import rollRegularVisSettings from "./visualizators/RollRegularVisualizatorSettings.json";
import scrollRegularVisSettings from "./visualizators/ScrollRegularVisualizatorSettings.json";
import rollColumnVisSettings from "./visualizators/RollColumnVisualizatorSettings.json";
import scrollColumnVisSettings from "./visualizators/ScrollColumnVisualizatorSettings.json";
import TextCombobox from "@/components/examples/TextCombobox.vue";
import { TextComboboxItem } from "@/components/examples/text-combobox-item";
import { createVisProvider, initOnlineVisProvider } from "@/ts/setup-vis-provider";
import { parsePreparedMarks } from "@/ts/marks/parse-prepared-marks";

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
const dataType: Ref<TextComboboxItem> = ref(dataTypeList.value[1]);
const signalDrawModeList: Ref<TextComboboxItem[]> = ref([
  {
    id: "roll",
    text: "Roll"
  },
  {
    id: "scroll",
    text: "Scroll"
  }
]);
const signalDrawMode: Ref<TextComboboxItem> = ref(signalDrawModeList.value[0]);
const lineDrawTypeList: Ref<TextComboboxItem[]> = ref([
  {
    id: "regular",
    text: "Regular"
  },
  {
    id: "column",
    text: "Column"
  }
]);
const lineDrawType: Ref<TextComboboxItem> = ref(lineDrawTypeList.value[1]);
let lastDataType = dataType.value.id;

let chartDataProvider = createDataProvider();
let visProvider = createVisProvider(chartDataProvider);
let dataGenerator: SignalGenerator | undefined = undefined;

watch(dataType, async () => {
  await changeChart();
});

watch(signalDrawMode, async () => {
  await changeChart();
});

watch(lineDrawType, async () => {
  await changeChart();
});

function createDataProvider(): JagmChartDataProvider {
  switch (dataType.value.id) {
    case "raw":
      return new JagmRawDataProvider();
    case "prepared":
      return new JagmPreparedDataProvider(parsePreparedMarks);
  }
  return new JagmRawDataProvider();
}

function getDataGeneratorSettings(): unknown {
  switch (lineDrawType.value.id) {
    case "regular":
      return lowFreqGeneratorSettings;
    case "column":
      return highFreqGeneratorSettings;
  }
  return highFreqGeneratorSettings;
}

function getVisualizatorSettings(): unknown {
  switch (signalDrawMode.value.id) {
    case "roll":
      {
        switch (lineDrawType.value.id) {
          case "regular":
            return rollRegularVisSettings;
          case "column":
            return rollColumnVisSettings;
        }
      }
      break;
    case "scroll":
      {
        switch (lineDrawType.value.id) {
          case "regular":
            return scrollRegularVisSettings;
          case "column":
            return scrollColumnVisSettings;
        }
      }
      break;
  }
  return rollColumnVisSettings;
}

async function initOnlineChart(): Promise<void> {
  if (canvasWrap.value === null) {
    return;
  }
  await initOnlineVisProvider({
    visProvider,
    chartDataProvider,
    canvasWrap: canvasWrap.value,
    visualizatorSettings: getVisualizatorSettings()
  });
  dataGenerator = await createContinuousDataGenerator(dataType.value.id, getDataGeneratorSettings(), visProvider, chartDataProvider);
  if (dataGenerator === undefined) {
    return;
  }
  dataGenerator.addListener(chartDataProvider);
  dataGenerator.start();
}

async function changeChart(): Promise<void> {
  await stopVisualization();
  if (lastDataType !== dataType.value.id) {
    chartDataProvider = createDataProvider();
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
  height: 100%;
  position: relative;
  overflow: hidden;
  width: 100%;
}
.canvas-wrap-container {
  width: 100%;
  height: 600px;
  display: flex;
  justify-content: center;
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
