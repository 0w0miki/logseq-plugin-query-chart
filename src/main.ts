import '@logseq/libs';


const main = async () => {
  logseq.App.showMsg('Hello World!');
}


logseq.ready(main).catch(console.error);