---
layout: doc
---


::: info
Версия 1.3
:::


<ClientOnly>
  <DoubleGrid />
  <hr />
  <SingleGrid />
  <hr />
  <OfflineSimpleChartDev />
  <hr />
  <SimpleOnlineChartDev />
</ClientOnly>

<script setup>
import { defineAsyncComponent } from 'vue'

// Динамический импорт скрывает код от Node.js во время сборки SSR
const DoubleGrid = defineAsyncComponent(() =>
  import('@/components/examples/ChartElements/Grid/Double/index.js')
)

const SingleGrid = defineAsyncComponent(() =>
  import('@/components/examples/ChartElements/Grid/Single/index.js')
)

const OfflineSimpleChartDev = defineAsyncComponent(() =>
  import('@/components/examples/Offline/SimpleChart/index.js')
)

const SimpleOnlineChartDev = defineAsyncComponent(() =>
  import('@/components/examples/Online/SimpleChart/index.js')
)
</script>


