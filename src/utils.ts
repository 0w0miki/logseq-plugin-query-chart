import { getYYYMMDD } from "logseq-dateutils";
import chrono from "chrono-node";

// Generate unique identifier
export const uniqueIdentifier = () => Math.random()
  .toString(36)
  .replace(/[^a-z]+/g, '');

export const isNum = (x: any): boolean => {
  return (x !== null) &&
         (x !== '') &&
         !isNaN(Number(x.toString()));
}

const isAdvQuery = (content: string): boolean => {
  return /#\+BEGIN_QUERY.*#\+END_QUERY/s.test(content);
}

const isDSLQuery = (content: string): boolean => {
  return false;
}

const isDateInput = (input: string) => {
  return /today|yesterday|\dd(-before|-after)?/.test(input);
}

const dslQuery = async (content: string) => {
  let results: any[] | null;
  try {
    results = await logseq.DB.q(content);
    return results;
  } catch (error) {
    console.log(error);
  }
}

const advQuery = async (content: string) => {
  let inputs: any;

  // Remove unnecessary syntax
  content = content
    .replace("#+BEGIN_QUERY", "")
    .replace("#+END_QUERY", "");

  // parse inputs
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
    if (results?.length > 0) {
      return results[0].map((_: any, colIndex: number) => results.map(row => row[colIndex]));
    } else {
      return;
    }
  } catch (error) {
    console.log(error);
  }
}

export const proxyQuery = async (content: string) => {
  if (isDSLQuery(content)) {
    return await dslQuery(content);
  }

  if (isAdvQuery(content)) {
    return await advQuery(content);
  }
  return;
}

export const getPluginDir = () => {
  const pluginSrc = (<HTMLIFrameElement>parent.document.getElementById(`${logseq.baseInfo.id}_iframe`)).src;
  const index = pluginSrc.lastIndexOf("/");
  return pluginSrc.substring(0, index);
}