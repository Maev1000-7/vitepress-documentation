<template>
  <div class="chart-selector">
    <label class="ml-2 mr-2 chart-selector-label">Тип данных:</label>
    <TextCombobox v-model="dataType" :values="dataTypeList" :width="100" />
    <label class="ml-5 mr-2 chart-selector-label">Развертка сигнала:</label>
    <TextCombobox v-model="signalDrawMode" :values="signalDrawModeList" :width="100" />
    <label class="ml-5 mr-2 chart-selector-label">Отрисовка линий:</label>
    <TextCombobox v-model="lineDrawType" :values="lineDrawTypeList" :width="100" />
  </div>
  <div ref="canvasWrap" class="canvas-wrap"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, Ref, onBeforeUnmount, watch } from "vue";
import {
  JagmMeasurerChartContentGroup,
  JagmDoubleSvgMeasurer,
  JagmSingleSvgMeasurer,
  JagmSignalsChartProvider
} from "@incartdev/jagm-chart";
import { RequestSignalGenerator, SignalGenerator } from "@incartdev/signal-generator-js";
import TextCombobox from "@/components/examples/TextCombobox.vue";
import { TextComboboxItem } from "@/components/examples/text-combobox-item";
import { clearAllData, updateChartPanelWidth } from "@/ts/update-chart-data";
import { createVisProvider, initOfflineVisProvider } from "@/ts/setup-vis-provider";
import lowFreqGeneratorSettings from "./generators/LowFreqGeneratorSettings.json";
import highFreqGeneratorSettings from "./generators/HighFreqGeneratorSettings.json";
import rollRegularVisSettings from "./visualizators/RollRegularVisualizatorSettings.json";
import scrollRegularVisSettings from "./visualizators/ScrollRegularVisualizatorSettings.json";
import rollColumnVisSettings from "./visualizators/RollColumnVisualizatorSettings.json";
import scrollColumnVisSettings from "./visualizators/ScrollColumnVisualizatorSettings.json";
import { createDataProvider } from "@/ts/create-data-provider";
import { createRequestDataGenerator, initRequestDataGenerator } from "@/ts/create-data-generator";

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

let chartDataProvider = createDataProvider(dataType.value.id);
let visProvider = createVisProvider(chartDataProvider);
let chartProvider: JagmSignalsChartProvider | undefined = undefined;
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

async function initOfflineChart(): Promise<void> {
  if (!canvasWrap.value) {
    return;
  }
  chartProvider = await initOfflineVisProvider({
    visProvider,
    chartDataProvider,
    canvasWrap: canvasWrap.value,
    visualizatorSettings: getVisualizatorSettings(),
    setDataFunc: updateChartData,
    onDataProviderInitialized: async () => {
      dataGenerator = await createRequestDataGenerator(
        dataType.value.id,
        getDataGeneratorSettings(),
        chartDataProvider
      );
    },
    initFunc: async () => {
      if (!(dataGenerator instanceof RequestSignalGenerator)) {
        throw new TypeError(`dataGenerator has wrong type`);
      }
      await initRequestDataGenerator(dataGenerator, visProvider, chartDataProvider);
    }
  });
  if (dataGenerator === undefined) {
    throw new ReferenceError(`dataGenerator is undefined`);
  }
  dataGenerator.start();
  await setUpMeasurers();
}

async function setUpMeasurers(): Promise<void> {
  if (chartProvider === undefined) {
    return;
  }
  const contentGroups = chartProvider.charts;
  let measurerGroup: JagmMeasurerChartContentGroup | undefined = undefined;
  for (const item of contentGroups) {
    const measurerContentGroup = item.findContentGroup("measurer");
    if (measurerContentGroup !== undefined && measurerContentGroup instanceof JagmMeasurerChartContentGroup) {
      measurerGroup = measurerContentGroup;
      break;
    }
  }
  if (measurerGroup === undefined) {
    return;
  }
  const mlToPx = measurerGroup.millisecondsToPixels.bind(measurerGroup);
  let qrs: JagmDoubleSvgMeasurer | undefined = undefined;
  let qt: JagmSingleSvgMeasurer | undefined = undefined;
  const foundQrs = measurerGroup.findByName("QRS");
  if (foundQrs !== undefined && foundQrs instanceof JagmDoubleSvgMeasurer) {
    qrs = foundQrs;
  }
  const foundQt = measurerGroup.findByName("QT");
  if (foundQt !== undefined && foundQt instanceof JagmSingleSvgMeasurer) {
    qt = foundQt;
  }
  if (mlToPx) {
    await qt?.move(mlToPx(6000));
    await qrs?.move({ leftLinePosition: mlToPx(0), rightLinePosition: mlToPx(200) });
  }
}

async function updateChartData(chartProvider: JagmSignalsChartProvider): Promise<void> {
  await clearAllData(chartDataProvider, chartProvider);
  const chartPanelWidth = updateChartPanelWidth("ecg", chartDataProvider, chartProvider);
  if (chartPanelWidth < 0 || !(dataGenerator instanceof RequestSignalGenerator)) {
    return;
  }
  await dataGenerator.generateData(chartPanelWidth);
  visProvider.refreshGraphics();
}

async function changeChart(): Promise<void> {
  await stopVisualization();
  if (lastDataType !== dataType.value.id) {
    chartDataProvider = createDataProvider(dataType.value.id);
    visProvider = createVisProvider(chartDataProvider);
    lastDataType = dataType.value.id;
  }
  await initOfflineChart();
}

async function stopVisualization(): Promise<void> {
  dataGenerator?.stop();
  dataGenerator = undefined;
  await visProvider.clear();
}

async function install(): Promise<void> {
  await nextTick();
  await initOfflineChart();
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
  margin-bottom: 5px;
}
</style>
