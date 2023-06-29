import { getYYYMMDD } from "logseq-dateutils";
import * as chrono from "chrono-node";
import { BlockEntity } from "@logseq/libs/dist/LSPlugin.user";

interface LogseqInputConvter {
  name: string,
  validateFn: (input: string) => boolean,
  getValue: (input: string) => any,
}

const relativeReg = /^[+-](\d+)([dwmy])(-(start|end|ms|\d{2}|\d{4}|\d{6}|\d{9}))?$/;
const inputConverters: LogseqInputConvter[] = [
  {
    name: 'timestamp',
    validateFn: (input: string) => { return input === "right-now-ms"; },
    getValue: (input: string) => { return new Date().getTime(); }
  },
  {
    name: 'date',
    validateFn: (input: string) => { return /^today|yesterday|tomorrow$/.test(input); },
    getValue: (input: string) => { return getYYYMMDD(chrono.parse(input)[0].start.date()); }
  },
  {
    name: 'deprecated-date',
    validateFn: (input: string) => { return /^\dd(-before|-after)?$/.test(input); },
    getValue: (input: string) => {
      input = input.replace("d", "days").replace("-", " ");
      return getYYYMMDD(chrono.parse(input)[0].start.date());
    }
  },
  {
    name: 'relative-date',
    validateFn: (input: string) => { return relativeReg.test(input); },
    getValue: (input: string) => {
      let regResult = relativeReg.exec(input)!;
      console.debug(regResult);
      const isAdd: boolean = input[0] === '+';
      const dateNum = Number(regResult[1]);
      const dateUnit = regResult[2];
      const tsOption = regResult[4];
      let op = isAdd
        ? (a: any, b: any) => { return a + b }
        : (a: any, b: any) => { return a - b };
      let date = new Date();

      // Do the date part
      if (dateUnit === 'd') {
        date.setDate(op(date.getDate(), dateNum));
      } else if (dateUnit === 'w') {
        date.setDate(op(date.getDate(), 7 * dateNum))
      } else if (dateUnit === 'm') {
        date.setMonth(op(date.getMonth(), dateNum));
      } else if (dateUnit === 'y') {
        date.setFullYear(op(date.getFullYear(), dateNum));
      }

      if (tsOption !== undefined) {
        // with timestamp
        let hour, minute, second, millisecond;
        if (tsOption === "start" || (tsOption === "ms" && !isAdd)) {
          hour = 0, minute = 0, second = 0, millisecond = 0
        } else if (tsOption === "end" || (tsOption === "ms" && isAdd)) {
          hour = 23; minute = 59; second = 59; millisecond = 999;
        } else {
          hour = Number(tsOption.slice(0, 2));
          minute = Number(tsOption.slice(2, 4));
          second = Number(tsOption.slice(4, 6));
          millisecond = Number(tsOption.slice(6, 9));
        }
        date.setHours(hour); date.setMinutes(minute); date.setSeconds(second); date.setMilliseconds(millisecond);
        return date.getTime();
      } else {
        // without timestamp
        return getYYYMMDD(date);
      }
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