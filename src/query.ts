import { getYYYMMDD } from "logseq-dateutils";
import chrono from "chrono-node";

interface LogseqBuiltinInput {
  name: string,
  validateFn: (input: string) => boolean,
  getValue: (input: string) => any,
}

const builtinInputs: LogseqBuiltinInput[] = [
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
    validateFn: (input: string) => {
      return input === 'current-page';
    },
    getValue: async (input: string) => {
      const page = await logseq.Editor.getCurrentPage();
      return page?.name;
    }
  }
]

const convertInput = async (input: string) => {
  for (let builtin of builtinInputs) {
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
  return false;
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