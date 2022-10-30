import { getYYYMMDD } from "logseq-dateutils";
import chrono from "chrono-node";

export const isQuery = (content: string): boolean => {
  return /#\+BEGIN_QUERY.*#\+END_QUERY/s.test(content);
}

const isDateInput = (input: string) => {
  return /today|yesterday|\dd(-before|-after)?/.test(input);
}

export const proxyQuery = async (content: string) => {
  if (!isQuery(content)) {
    return;
  }

  let inputs: any;

  // Remove unnecessary syntax
  content = content
    .replace("#+BEGIN_QUERY", "")
    .replace("#+END_QUERY", "");

  // TODO remove :in and :inputs and replace those variables
  if (content.includes(":inputs [")) {
    inputs = content.slice(content.indexOf(":inputs ["));
    let inputsArr = inputs
                    .match(/:inputs\s+\[(.*)\]/)[1]
                    .match(/(?<=:).*?(?=\s|$)|".*?"|\d+/g);
    inputs = inputsArr.map((input: string) => {
      if (!isDateInput(input)) {
        return input;
      }
      if (input !== "today" && input !== "yesterday") {
        input = input.replace("d", "days").replace("-", " ")
      }
      return getYYYMMDD(chrono.parse(input)[0].start.date());
    });
  }

  // Get text after :query
  const query = content.slice(content.indexOf("[:find"));

  // Pass query through API
  let results: any[];
  try {
    if (!inputs) {
      results = await logseq.DB.datascriptQuery(query);
    } else {
      results = await logseq.DB.datascriptQuery(query, ...inputs);
    }
    return results[0].map((_: any, colIndex: number) => results.map(row => row[colIndex]));
  } catch (error) {
    console.log(error);
  }
}

export const getPluginDir = () => {
  const pluginSrc = (<HTMLIFrameElement>parent.document.getElementById(`${logseq.baseInfo.id}_iframe`)).src;
  const index = pluginSrc.lastIndexOf("/");
  return pluginSrc.substring(0, index);
}