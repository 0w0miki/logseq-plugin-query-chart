// Generate unique identifier
export const uniqueIdentifier = () => Math.random()
  .toString(36)
  .replace(/[^a-z]+/g, '');

export const isNum = (x: any): boolean => {
  return (x !== null) &&
         (x !== '') &&
         !isNaN(Number(x.toString()));
}

export const getPluginDir = () => {
  const pluginSrc = (<HTMLIFrameElement>parent.document.getElementById(`${logseq.baseInfo.id}_iframe`)).src;
  const index = pluginSrc.lastIndexOf("/");
  return pluginSrc.substring(0, index);
}