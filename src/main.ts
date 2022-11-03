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

  logseq.provideStyle(`
  .query-chart-container {
    align-items: center
  }
  .query-chart-iframe {
    width: 100%;
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

    logseq.provideModel({
      async refreshChart() {
        const iframe = parent.document.querySelector(`.query-chart-iframe[data-uuid="${uuid}"]`) as HTMLIFrameElement;
        iframe.contentWindow?.postMessage(await getChartProp(renderBlock), '*');
      }
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
        <button class="query-chart-btn" data-on-click="refreshChart">Refresh Chart</button>
      </div>
      `,
      style: { flex: 1 },
    });
  });
}

logseq.ready(main).catch(console.error);