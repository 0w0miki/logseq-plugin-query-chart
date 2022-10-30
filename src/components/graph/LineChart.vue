<template>
  <Line
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
import { Line } from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Plugin,
ChartData
} from 'chart.js';

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale
);

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
    },
    plugins: {
      type: Array as PropType<Plugin<'line'>[]>,
      default: () => []
    }
});

const chartOptions = ref({ responsive: true });

const chartData = computed(() => {
  return props.data as ChartData<"line", number[], unknown>;
})
</script>