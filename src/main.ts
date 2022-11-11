import '@logseq/libs';
import { BlockEntity } from '@logseq/libs/dist/LSPlugin.user';
import { proxyQuery, getPluginDir, isNum } from './utils';
import { isChartType } from './types';

function isOptionTextValid(list: string[]): boolean {
  let noErr = true;
  noErr &&= isChartType(list[0]);
  noErr &&= isNum(list[1]);
  noErr &&= isNum(list[2]);
  return noErr
}

function parseChartOptions(text: String) {
  text = text.replace(/".+?(?<!\\)"/g, match => match.replace(/,/g, '{__}'));

  const list = text.split(',')
      .filter((ele: string) => ele !== '')
      .map((ele: string) => ele.replace('{_}', ',').trim());

  // type, width, height, (color schema), ...labels
  if (!isOptionTextValid(list)) {
    return { chartOption: null, ok: false };
  }
  const chartType = list[0];
  const width = isNum(list[1]) ? Number(list[1]) : 0;
  const height = isNum(list[2]) ? Number(list[2]) : 0;
  let colorScheme = '';
  let chartLabels: string[];
  const regRes = list[3].match(/color:\s*"(.*)"/);
  if (regRes) {
    colorScheme = regRes[1];
    chartLabels = list.slice(4);
  } else {
    chartLabels = list.slice(3);
  }
  return { chartOption: { chartType, width, height, colorScheme, chartLabels }, ok: true };
}


async function getChartProp(renderBlock: BlockEntity) {
  const childBlock = renderBlock!.children![0] as BlockEntity;
  let { chartOption, ok } = parseChartOptions(childBlock.content);
  const grandBlock = childBlock!.children![0] as BlockEntity;
  const data = await proxyQuery(grandBlock.content);

  return { chartInfo: { chartOption, data }, ok };
}

const main = async () => {
  console.debug('Query chart plugin loaded');
  logseq.UI.showMsg('Hello World!');

  // Generate unique identifier
  const uniqueIdentifier = () => Math.random()
    .toString(36)
    .replace(/[^a-z]+/g, '');

  logseq.Editor.registerSlashCommand('query chart', async () => {
    await logseq.Editor.insertAtEditingCursor(
      `{{renderer :query-chart_${uniqueIdentifier()}}}`
    )
  });

  logseq.provideStyle(`
  .query-chart-container {
    align-items: center
  }
  .query-chart-instruction {
    display: block;
  }
  .query-chart-instruction.hide {
    display: none;
  }
  .query-chart-iframe {
    width: 0;
    height: 0;
    margin: 0;
  }
  .query-chart-btn {
    background-color: var(--ls-tertiary-background-color);
    border: 1px solid var(--ls-border-color);
    width: fit-content;
    font-size: 0.8rem;
    padding: 4px 8px;
    margin-top: 10px;
    border-radius: var(--ls-border-radius-medium);
  }
  .query-chart-btn:hover {
    background-color: var(--ls-menu-hover-color);
    border: 1px solid var(--ls-secondary-border-color);
  }
  `)

  logseq.App.onMacroRendererSlotted(async ({slot, payload}) => {
    const uuid = payload.uuid;
    const [type] = payload.arguments;

    if (!type?.startsWith(':query-chart_')) return;
    const id = type.split('_')[1]?.trim();
    const chartId = `query-chart_${id}`;
    const renderBlock = await logseq.Editor.getBlock(uuid, {
      includeChildren: true,
    });

    if (!renderBlock) {
      return;
    }

    const waitIframeReady = async () => {
      let count = 0;
      return new Promise<void>((resolve, reject) => {
        const timer = setInterval(() => {
          if (parent.document.querySelector(`.query-chart-iframe[data-uuid="${uuid}"]`) !== null) {
            clearInterval(timer);
            resolve();
          } else {
            count++;
          }
          if (count > 60 * 5) {
            clearInterval(timer);
            reject('time out');
          }
        }, 200)
      })
    }

    const refreshChart = async () => {
      try {
        await waitIframeReady();
      } catch (error) {
        console.log(error);
        return;
      }

      const iframe = parent.document.querySelector(`.query-chart-iframe[data-uuid="${uuid}"]`) as HTMLIFrameElement;
      let { chartInfo, ok } = await getChartProp(renderBlock);

      if (ok) {
        // modify the size
        parent.document.querySelector(`.query-chart-instruction[data-uuid="${uuid}"]`)?.classList.add('hide');
        iframe.style.width = `${chartInfo.chartOption!.width}px`;
        iframe.style.height = `${chartInfo.chartOption!.height}px`;
        iframe.contentWindow?.postMessage(chartInfo, '*');
      } else {
        parent.document.querySelector(`.query-chart-instruction[data-uuid="${uuid}"]`)?.classList.remove('hide');
      }
    }

    logseq.provideModel({
      refreshChart
    });

    logseq.provideUI({
      key: `${chartId}`,
      slot,
      reset: true,
      template: `
      <div class="flex flex-col query-chart-container">
        <iframe class="query-chart-iframe"
          src="${getPluginDir()}/inline.html"
          data-name="${chartId}"
          data-uuid="${uuid}"
          data-frame="${logseq.baseInfo.id}_iframe"
          sandbox="allow-scripts"
        >
        </iframe>
        <div class="query-chart-instruction hide" data-uuid="${uuid}">
        Incorrect format. Format should be "type, width, height, color scheme, labels". e.g. bar 400, 300, color: "tableau.Tableau10", x, y
        </div>
        <button class="query-chart-btn" data-on-click="refreshChart">Refresh Chart</button>
      </div>
      `,
      style: { flex: 1 },
    });

    refreshChart();
  });
}

logseq.ready(main).catch(console.error);