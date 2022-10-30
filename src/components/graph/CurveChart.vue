<template>
  <LineChart
    :chart-options="chartOptions"
    :chart-data="chartData"
    :chart-id="chartId"
    :css-classes="cssClasses"
    :styles="styles"
    :width="width"
    :height="height"
  />
</template>

<script setup lang="ts">
import { ref, PropType, computed } from 'vue';
import LineChart from './LineChart.vue';

const props = defineProps({
    chartId: {
      type: String,
      default: 'line-chart'
    },
    datasetIdKey: {
      type: String,
      default: 'label'
    },
    width: {
      type: Number,
      default: 100
    },
    height: {
      type: Number,
      default: 100
    },
    cssClasses: {
      default: '',
      type: String
    },
    styles: {
      type: Object,
      default: () => {}
    },
    data: {
      type: Object,
      default: () => {}
    }
});

const chartOptions = ref({ responsive: true });

const chartData = computed(() => {
  const tempData = JSON.parse(JSON.stringify(props.data));
  tempData.datasets = tempData.datasets.map((ele: any) => {
    ele.tension = 0.4;
    return ele;
  })
  return tempData;
})
</script>