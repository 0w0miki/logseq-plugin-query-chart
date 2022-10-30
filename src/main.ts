import '@logseq/libs';
import { BlockEntity } from '@logseq/libs/dist/LSPlugin.user';
import { proxyQuery, getPluginDir } from './utils';

async function getChartProp(renderBlock: BlockEntity) {
  const childBlock = renderBlock!.children![0] as BlockEntity;
  const optionText: string = childBlock.content;
  const grandBlock = childBlock!.children![0] as BlockEntity;
  const data = await proxyQuery(grandBlock.content);

  return {optionText, data};
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

    logseq.provideModel({
      async refreshChart() {
        const iframe = parent.document.querySelector(`.query-chart-iframe[data-uuid="${uuid}"]`) as HTMLIFrameElement;
        iframe.contentWindow?.postMessage(await getChartProp(renderBlock), '*');
      }
    });

    logseq.provideStyle(`
    .query-chart-iframe {
      width: 100%;
      height: 100%;
      margin: 0;
    }
    `)

    logseq.provideUI({
      key: `${chartId}`,
      slot,
      reset: true,
      template: `
      <iframe class="query-chart-iframe"
        src="${getPluginDir()}/inline.html"
        data-name="${chartId}"
        data-uuid="${uuid}"
        data-frame="${logseq.baseInfo.id}_iframe"
        sandbox="allow-scripts"
      >
      </iframe>
      <button data-on-click="refreshChart">Refresh Chart</button>
      `,
      style: { flex: 1 },
    });
  });
}

logseq.ready(main).catch(console.error);