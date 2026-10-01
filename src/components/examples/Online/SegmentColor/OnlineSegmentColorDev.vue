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
import { ref, onMounted, onBeforeUnmount, nextTick, Ref, watch } from "vue";
import { SignalGenerator } from "@incartdev/signal-generator-js";
import { JagmSignalsChartProvider } from "@incartdev/jagm-chart";
import lowFreqGeneratorSettings from "./generators/LowFreqGeneratorSettings.json";
import highFreqGeneratorSettings from "./generators/HighFreqGeneratorSettings.json";
import rollRegularVisSettings from "./visualizators/RollRegularVisualizatorSettings.json";
import scrollRegularVisSettings from "./visualizators/ScrollRegularVisualizatorSettings.json";
import rollColumnVisSettings from "./visualizators/RollColumnVisualizatorSettings.json";
import scrollColumnVisSettings from "./visualizators/ScrollColumnVisualizatorSettings.json";
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
  dataGenerator = await createContinuousDataGenerator(
    dataType.value.id,
    getDataGeneratorSettings(),
    visProvider,
    chartDataProvider
  );
  if (dataGenerator === undefined) {
    return;
  }
  dataGenerator.addListener(chartDataProvider);
  dataGenerator.start();
  startSegmentTimer();
}

// --- Раскрашенные участки сигнала ---
// Участки задаются в preparedX (физические пиксели, абсолютная шкала от начала записи),
// поэтому они привязаны к данным, а не к экрану: по мере прихода новых данных участок
// уезжает вместе со своим куском сигнала и уходит за край видимой области.
// Раз в SEGMENT_PERIOD_MS раскрашиваем данные, пришедшие с прошлого срабатывания:
// участок берётся ровно от прошлого конца данных до текущего, поэтому полосы точно
// ложатся на «свой» кусок сигнала и не зависят от того, насколько ровно идёт таймер.
// Фазы чередуются (цвет → пропуск → заливка → пропуск), чтобы между полосами
// оставались участки базового цвета и было видно, где какой механизм работает.
const SEGMENT_PERIOD_MS = 700;
const signalSegmentColor = [214, 61, 57, 255];
const areaSegmentColor = [66, 135, 245, 160];

let segmentTimerId: ReturnType<typeof setInterval> | undefined = undefined;
let segmentCounter = 0;
// Конец данных на прошлом срабатывании таймера, отдельно для каждого экрана.
let lastEndPreparedX = new Map<number, number>();

function startSegmentTimer(): void {
  stopSegmentTimer();
  segmentCounter = 0;
  lastEndPreparedX = new Map<number, number>();
  segmentTimerId = setInterval(addNextSegment, SEGMENT_PERIOD_MS);
}

function stopSegmentTimer(): void {
  if (segmentTimerId !== undefined) {
    clearInterval(segmentTimerId);
    segmentTimerId = undefined;
  }
}

function addNextSegment(): void {
  const chartProvider = new JagmSignalsChartProvider(visProvider.builder.getRootObject());
  for (const signalContentGroup of chartProvider.signalObjectGroups) {
    const signalGroup = signalContentGroup.getSignalGroup();
    if (signalGroup === undefined) {
      continue;
    }
    const firstSignalId = signalGroup.getFirstSignalId();
    if (firstSignalId === undefined) {
      continue;
    }
    const endPreparedX = signalGroup.getEndPreparedX();
    const beginPreparedX = lastEndPreparedX.get(signalGroup.screenId);
    lastEndPreparedX.set(signalGroup.screenId, endPreparedX);
    // Первое срабатывание только запоминает точку отсчёта.
    if ((beginPreparedX === undefined) || (endPreparedX <= beginPreparedX)) {
      continue;
    }
    switch (segmentCounter % 4) {
      case 0:
        signalGroup.addSignalColorSegment(
          firstSignalId.channelId,
          firstSignalId.signalId,
          beginPreparedX,
          endPreparedX,
          signalSegmentColor
        );
        break;
      case 2:
        signalGroup.addAreaColorSegment(
          firstSignalId.channelId,
          firstSignalId.signalId,
          beginPreparedX,
          endPreparedX,
          areaSegmentColor
        );
        break;
    }
  }
  ++segmentCounter;
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
  stopSegmentTimer();
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
