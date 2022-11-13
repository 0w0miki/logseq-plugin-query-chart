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
    return {
      chartOption: null,
      error: 'Incorrect format. Format should be \n'
             + '"type, width, height, color scheme, labels".\n'
             + 'e.g. bar 400, 300, color: "tableau.Tableau10", x, y'
    };
  }
  const chartType = list[0];
  const width = Number(list[1]) > 600 ? 600 : Number(list[1]);
  const height = Number(list[2]) > 600 ? 600 : Number(list[2]);
  let colorScheme = '';
  let chartLabels: string[];
  const regRes = list[3].match(/color:\s*"(.*)"/);
  if (regRes) {
    colorScheme = regRes[1];
    chartLabels = list.slice(4);
  } else {
    chartLabels = list.slice(3);
  }
  return { chartOption: { chartType, width, height, colorScheme, chartLabels }, error: null };
}


async function getChartProp(renderBlock: BlockEntity) {
  const childBlock = renderBlock!.children![0] as BlockEntity;
  let { chartOption, error } = parseChartOptions(childBlock.content);
  const grandBlock = childBlock!.children![0] as BlockEntity;
  const data = await proxyQuery(grandBlock.content);
  if (!error && !data) {
    error = 'Query Failed';
  }
  return { chartInfo: { chartOption, data }, error };
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
  .query-chart-tips {
    background-color: var(--ls-tertiary-background-color);
    border: 1px solid var(--ls-border-color);
    padding: 10px;
    border-radius: var(--ls-border-radius-medium);
    align-items: center;
  }
  .query-chart-tips.hide {
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
      const tips = parent.document.querySelector(`.query-chart-tips[data-uuid="${uuid}"]`) as HTMLElement;
      let { chartInfo, error } = await getChartProp(renderBlock);

      if (!error) {
        // modify the size
        tips.classList.add('hide');
        iframe.style.width = `${chartInfo.chartOption!.width}px`;
        iframe.style.height = `${chartInfo.chartOption!.height}px`;
        iframe.contentWindow?.postMessage(chartInfo, '*');
      } else {
        tips.classList.remove('hide');
        (tips.querySelector('.msg') as HTMLElement)!.innerText = error;
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
        <div class="query-chart-tips hide flex flex-row" data-uuid="${uuid}">
          <span style="color: yellow; font-size: 1.8rem">&#9888</span>
          <span class="msg" style="padding-left: 15px"></span>
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