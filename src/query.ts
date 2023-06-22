import { getYYYMMDD } from "logseq-dateutils";
import chrono from "chrono-node";
import { BlockEntity } from "@logseq/libs/dist/LSPlugin.user";

interface LogseqInputConvter {
  name: string,
  validateFn: (input: string) => boolean,
  getValue: (input: string) => any,
}

const inputConverters: LogseqInputConvter[] = [
  {
    name: 'date',
    validateFn: (input: string) => {
      return /today|yesterday|\dd(-before|-after)?/.test(input);
    },
    getValue: (input: string) => {
      if (input !== "today" && input !== "yesterday") {
        input = input.replace("d", "days").replace("-", " ")
      }
      return getYYYMMDD(chrono.parse(input)[0].start.date());
    }
  },
  {
    name: 'current-page',
    validateFn: (input: string) => { return input === 'current-page'; },
    getValue: async () => {
      const page = await logseq.Editor.getCurrentPage();
      return `"${page?.name}"`;
    }
  },
]

const addInputConvertWithBlock = (block: BlockEntity) => {
  inputConverters.push(...[
    {
      name: 'query-page',
      validateFn: (input: string) => { return input === 'query-page'; },
      getValue: async () => {
        const page = await logseq.Editor.getPage(block.page.id)
        return `"${page?.name}"`; }
    },
    {
      name: 'current-block',
      validateFn: (input: string) => { return input === 'current-block'; },
      getValue: () => { return block.id; },
    },
    {
      name: 'parent-block',
      validateFn: (input: string) => { return input === 'parent-block'; },
      getValue: () => { return block.parent.id; },
    },
  ])
}

const convertInput = async (input: string) => {
  for (let builtin of inputConverters) {
    if (!builtin.validateFn(input)) {
      continue;
    }
    const ret = await builtin.getValue(input);
    console.debug(`input: ${input} is builtin variable ${builtin.name}. Value: ${ret}`);
    return ret;
  }
  return input;
}

const isAdvQuery = (content: string): boolean => {
  return /#\+BEGIN_QUERY.*#\+END_QUERY/s.test(content);
}

const isDSLQuery = (content: string): boolean => {
  return /^\{\{query .*\}\}$/s.test(content);
}

const dslQuery = async (content: string) => {
  let results: any[] | null;
  // parse query
  const query = content.match(/^\{\{query (.*)\}\}$/s)![1];
  try {
    results = await logseq.DB.q(query);
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
    inputs = await Promise.all(inputsArr.map(async (input: string) => {
      const val = await convertInput(input);
      return val;
    }));
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
      results.sort();
      return results[0].map((_: any, colIndex: number) => results.map(row => row[colIndex]));
    } else {
      return;
    }
  } catch (error) {
    console.log(error);
  }
}

export const proxyQuery = async (block: BlockEntity) => {
  const content: string = block.content;
  addInputConvertWithBlock(block);

  if (isDSLQuery(content)) {
    return await dslQuery(content);
  }

  if (isAdvQuery(content)) {
    return await advQuery(content);
  }
  return;
}