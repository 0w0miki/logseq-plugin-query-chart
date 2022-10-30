<template>
  <Doughnut
    :chart-options="chartOptions"
    :chart-data="chartData"
    :chart-id="chartId"
    :dataset-id-key="datasetIdKey"
    :css-classes="cssClasses"
    :styles="styles"
    :width="width"
    :height="height"
  />
</template>

<script setup lang="ts">
import { ref, PropType, computed } from 'vue';
import { Doughnut } from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  CategoryScale,
  LinearScale,
  Plugin,
ChartData
} from 'chart.js';

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  ArcElement,
  CategoryScale,
  LinearScale
);

const props = defineProps({
    chartId: {
      type: String,
      default: 'doughnut-chart'
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
    },
    plugins: {
      type: Array as PropType<Plugin<'doughnut'>[]>,
      default: () => []
    }
});

const chartOptions = ref({ responsive: true, maintainAspectRatio: false });

const chartData = computed(() => {
  return props.data as ChartData<"doughnut", number[], unknown>;
});
</script>