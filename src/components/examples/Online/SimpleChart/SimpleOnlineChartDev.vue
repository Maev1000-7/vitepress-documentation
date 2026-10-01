<template>
  <div class="chart-selector">
    <label class="ml-2 mr-2 chart-selector-label">Тип данных:</label>
    <TextCombobox v-model="dataType" :values="dataTypeList" :width="100" />
    <label class="ml-5 mr-2 chart-selector-label">Развертка сигнала:</label>
    <TextCombobox v-model="signalDrawMode" :values="signalDrawModeList" :width="100" />
    <label class="ml-5 mr-2 chart-selector-label">Отрисовка линий:</label>
    <TextCombobox v-model="lineDrawType" :values="lineDrawTypeList" :width="100" />
  </div>
  <div class="chart-selector">
    <label class="ml-2 mr-2 chart-selector-label">Обновление изолинии:</label>
    <TextCombobox v-model="isolineUpdate" :values="isolineUpdateList" :width="180" />
  </div>
  <div ref="canvasWrap" class="canvas-wrap"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, Ref, watch } from "vue";
import { SignalGenerator } from "@incartdev/signal-generator-js";
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
const isolineUpdateList: Ref<TextComboboxItem[]> = ref([
  {
    id: "everyScreen",
    text: "Каждый экран"
  },
  {
    id: "everyData",
    text: "Каждую порцию данных"
  }
]);
const isolineUpdate: Ref<TextComboboxItem> = ref(isolineUpdateList.value[0]);
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

watch(isolineUpdate, async () => {
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
  return applyIsolineUpdate(getBaseVisualizatorSettings(), isolineUpdate.value.id);
}

function getBaseVisualizatorSettings(): unknown {
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

// Прописывает выбранный режим обновления изолинии в каждый сигнал конфига визуализатора.
// Импортированный JSON — общий объект, поэтому работаем на копии, чтобы не портить исходник
// при переключении режимов.
function applyIsolineUpdate(settings: unknown, value: string): unknown {
  const clone: unknown = JSON.parse(JSON.stringify(settings));
  const walk = (node: unknown): void => {
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if ((node === null) || (typeof node !== "object")) {
      return;
    }
    const record = node as Record<string, unknown>;
    const signals = record.signals;
    if (Array.isArray(signals)) {
      for (const signal of signals) {
        if ((signal !== null) && (typeof signal === "object")) {
          (signal as Record<string, unknown>).isolineUpdate = value;
        }
      }
    }
    for (const key of Object.keys(record)) {
      walk(record[key]);
    }
  };
  walk(clone);
  return clone;
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
  margin-bottom: 5px;
}
</style>
