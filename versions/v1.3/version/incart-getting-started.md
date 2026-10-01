# А в версии 1.3 решили что будет так
 
:::info
и вот почему
:::

# Создание простейшего графика

В данной статье используется сборщик [Vite](https://vitejs.dev/).

## Создание проекта

Для создания vite-проекта потребуется выполнить следующие команды в CLI.

::: code-group

```sh [JavaScript]
$ npm create vite@latest my-app --template vanilla my-app
$ cd my-app

$ npm install
$ npm run dev
```

```sh [React]
$ npm create vite@latest my-app --template react my-app
$ cd my-app

$ npm install
$ npm run dev
```

```sh [Vue]
$ npm create vite@latest my-app --template vue my-app
$ cd my-app

$ npm install
$ npm run dev
```

:::

### Установка библиотеки

Для установки библиотеки необходимо выполнить шаги из пункта [УСТАНОВКА]().

## Offline-график

### Конфигурация графика

Для настройки отображения графика необходимо создать файл конфигурации.

::: info
Подробнее о файле конфигурации в разделе [Файл конфигурации]().
:::

В директории с исходным кодом проекта необходимо создать файл `VisualSettings.json`. Далее, необходимо [скопировать]() конфигурацию графика в файл `VisualSettings.json`.

### Инициализация графика

::: code-group

```js [JavaScript]
// main.js

import { JagmRootProvider } from "@incartdev/jagm-core";
import {
  JagmRawLineSignalData,
  JagmRawSignalsChartProvider,
} from "@incartdev/jagm-chart";
import { RawOfflineVisualizatorConfigJsUnpacker } from "@incartdev/jagm-visualizator";

import VisualConfig from "./VisualConfig.json";

export const init = async () => {
  // Получение ссылок на DOM элементы контейнера
  const canvasRef = document.querySelector(".canvas-wrap");

  // Создать экземпляр класса для рисования графиков
  const visProvider = new JagmRootProvider(
    new RawOfflineVisualizatorConfigJsUnpacker(),
  );

  // Создание тестовых данных для отображения на графическом полотне
  // Происходит генерация графика синуса с частотой 500Гц и амплитудой 1000
  const plotData = Array.from(
    { length: 5000 },
    (_, index) => Math.sin((index * Math.PI) / 250) * 1000,
  );
  const signalData = new JagmRawLineSignalData(plotData);

  // Инициализация создания графических элементов
  await visProvider.create({
    settings: VisualConfig,
    rootHtml: canvasRef,
  });

  // Создание контроллера графических элементов библиотеки
  const chartProvider = new JagmRawSignalsChartProvider(visProvider.builder);

  // Добавление сгенерированных данных на графическое полотно
  chartProvider.signalObjectGroups.forEach(async (signalGroup) => {
    await signalGroup.addSignalData(0, 0, 0, signalData);
  });

  // Обновление графика
  visProvider.refreshGraphics();
};
```

```jsx [React]
// src/graph/graph.jsx

import React, { useRef, useEffect } from "react";
import { JagmRootProvider } from "@incartdev/jagm-core";
import {
  JagmRawLineSignalData,
  JagmRawSignalsChartProvider,
} from "@incartdev/jagm-chart";
import { RawOfflineVisualizatorConfigJsUnpacker } from "@incartdev/jagm-visualizator";

import VisualConfig from "./VisualConfig.json";

// Стилизация графика
const canvasWrapStyle = {
  height: "400px",
  width: "400px",
  position: "relative",
};

export const Graph = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const init = async () => {
      // Создать экземпляр класса для рисования графиков
      const visProvider = new JagmRootProvider(
        new RawOfflineVisualizatorConfigJsUnpacker(),
      );

      // Создание тестовых данных для отображения на графическом полотне
      // Происходит генерация графика синуса с частотой 500Гц и амплитудой 1000
      const plotData = Array.from(
        { length: 5000 },
        (_, index) => Math.sin((index * Math.PI) / 250) * 1000,
      );
      const signalData = new JagmRawLineSignalData(plotData);

      // Инициализация создания графических элементов
      await visProvider.create({
        settings: VisualConfig,
        rootHtml: canvasRef.current,
      });

      // Создание контроллера графических элементов библиотеки
      const chartProvider = new JagmRawSignalsChartProvider(visProvider.builder);

      // Добавление сгенерированных данных на графическое полотно
      chartProvider.signalObjectGroups.forEach(async (signalGroup) => {
        await signalGroup.addSignalData(0, 0, 0, signalData);
      });

      // Обновление графика
      visProvider.refreshGraphics();
    };

    init();
  }, []);

  return (
    <div className="canvas-wrap" style={canvasWrapStyle} ref={canvasRef} />
  );
};
```

```vue [Vue]
<!-- src/graph/graph.vue -->

<template>
  <div class="canvasWrap" ref="canvasWrap"></div>
</template>

<script setup>
import { onMounted, ref, nextTick } from "vue";
import { JagmRootProvider } from "@incartdev/jagm-core";
import {
  JagmRawLineSignalData,
  JagmRawSignalsChartProvider,
} from "@incartdev/jagm-chart";
import { RawOfflineVisualizatorConfigJsUnpacker } from "@incartdev/jagm-visualizator";

import VisualConfig from "./VisualConfig.json";

const canvasWrap = ref(null);

onMounted(() => {
  const init = async () => {
    await nextTick();
    // Создать экземпляр класса для рисования графиков
    const visProvider = new JagmRootProvider(
      new RawOfflineVisualizatorConfigJsUnpacker(),
    );

    // Создание тестовых данных для отображения на графическом полотне
    // Происходит генерация графика синуса с частотой 500Гц и амплитудой 1000
    const plotData = Array.from(
      { length: 5000 },
      (_, index) => Math.sin((index * Math.PI) / 250) * 1000,
    );
    const signalData = new JagmRawLineSignalData(plotData);

    // Инициализация создания графических элементов
    await visProvider.create({
      settings: VisualConfig,
      rootHtml: canvasWrap.value,
    });

    // Создание контроллера графических элементов библиотеки
    const chartProvider = new JagmRawSignalsChartProvider(
      visProvider.builder,
    );

    // Добавление сгенерированных данных на графическое полотно
    chartProvider.signalObjectGroups.forEach(async (signalGroup) => {
      await signalGroup.addSignalData(0, 0, 0, signalData);
    });

    // Обновление графика
    visProvider.refreshGraphics();
  };

  init();
});
</script>

<style scoped>
.canvasWrap {
  height: 400px;
  width: 400px;
  position: relative;
}
</style>
```

:::

Далее описаны дополнительные шаги для каждого фреймворка.

::: code-group

```html [JavaScript]
<!-- index.html -->

<div class="vis-wrap" id="wrapRef">
  <div class="canvas-wrap" id="canvasWrap"></div>
</div>

<script type="module">
  import { init } from "./main.js";
  document.addEventListener("DOMContentLoaded", () => {
    init();
  });
</script>

<style>
  .canvas-wrap {
    height: 100%;
    width: 100%;
    position: absolute;
  }
  .vis-wrap {
    position: relative;
    height: 500px;
    width: 500px;
  }
</style>
```

```jsx [React]
// src/main.jsx

import React from "react";
import ReactDOM from "react-dom/client";
import { Graph } from "./graph/graph.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Graph />
  </React.StrictMode>,
);
```

```js [Vue]
// src/main.js

import { createApp } from "vue";
import Graph from "./graph/graph.vue";

createApp(Graph).mount("#app");
```

:::

::: warning
Важно отметить, что контейнер **НЕ** должен быть нулевой высоты. В противном случае график не будет отображён из-за отсутствия места.
:::

::: warning
Важно отметить, что у `script` должен быть прописан `type=module`.
:::

<!-- <OfflineJsDocContent /> -->
<!-- <OfflineReactDocContent /> -->
<!-- <OfflineVueDocContent /> -->