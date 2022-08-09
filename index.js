const asana = require("asana");
const axios = require("axios");
const utils = require("./services/utils");
let results = { _response: { next_page: { offset: "start" } } };
let untagged = [];
let allResults = [];
let messages = [];
let start = 0;
let max = 22;
let totalCount = 0;
const STACKOVERFLOW_KEY = process.env.STACKOVERFLOW_KEY;
const ASANA_PAT = process.env.ASANA_PAT;
const { ASANA_CODES, getIDFromLink, Mode, Rules } = utils;
const client = asana.Client.create().useAccessToken(ASANA_PAT);

// 1: Loop through the paginated response of asana for a list of project tasks.
// 2: Collect all the un-tagged tasks to loop through
// 3: Visit the link and see if there is no longer a question to answer
// 4: Tag the task with the appropriate name ("NotFound")
// 5: Also tag as auto-tagged = TRUE so we know it was auto-tagged
// TODO: Develop rules further then tag any unknown as misc

async function main(job) {
  console.log("START");
  while (results._response.next_page && start <= max) {
    const params = {
      opt_pretty: true,
      opt_fields:
        "name,description,custom_fields.enum_value.name,custom_fields.text_value.name", // Notes will get the description
    };
    if (results._response.next_page.offset !== "start") {
      params.offset = results._response.next_page.offset;
    }

    results = await client.projects.tasks(ASANA_CODES.PROJECT, params);
    // console.log("res:", JSON.stringify(results, null, 2));

    results._response.data.forEach((task) => {
      allResults.push(task);

      const tags = task.custom_fields.filter(
        (cf) => cf.gid === ASANA_CODES.CATEGORY
      );
      if (tags.length > 0) {
        if (tags[0].enum_value === null) {
          untagged.push(task); // If enum value is null then it is untagged
        }
      }
    });
    start++;
    totalCount += results.data.length;
    console.log("count: ", results.data.length);
    console.log("total count: ", totalCount);
    console.log("untagged count: ", untagged.length);
  }
  if (job === Mode.DEDUP) {
    await deleteDuplicates(allResults);
  }
  if (job === Mode.TAG) {
    console.log("process untagged: ", untagged.length);
    let counter = 0;
    for (let ut of untagged) {
      console.log(counter);
      const link = ut.custom_fields.filter((l) => l.gid === ASANA_CODES.LINK);
      const date = ut.custom_fields.filter((l) => l.gid === ASANA_CODES.DATE);
      if (link[0].text_value === null) {
        console.log("Skip repost");
      } else {
        await processStackOverflow(ut, link, messages);
      }
      console.log(`Date: ${date[0].text_value}`);
      counter++;
    }
    console.log(`Updated ${messages.length} messages`);
  }
}

async function processStackOverflow(ut, link, messages) {
  // Split to get Question ID
  const url = `https://api.stackexchange.com/2.3/questions/${getIDFromLink(
    link
  )}?order=desc&sort=activity&site=stackoverflow&filter=withbody&key=${STACKOVERFLOW_KEY}`;
  const resp = await axios.get(url);
  if (resp.data.items.length === 0) {
    await client.tasks.updateTask(ut.gid, {
      custom_fields: {
        [ASANA_CODES.CATEGORY]: ASANA_CODES.NOT_FOUND,
        [ASANA_CODES.AUTO]: ASANA_CODES.TRUE,
      },
    });
    console.log(`Tag ${ut.gid} as NOTFOUND`);
    messages.push(link);
  } else {
    // Tag based on rules...
    const matchedRule = determineCategoryFromQuestion(resp.data.items[0]);
    if (matchedRule) {
      console.log(
        `determined to be...${JSON.stringify(
          matchedRule,
          null,
          2
        )} - send API update call`
      );
      await client.tasks.updateTask(ut.gid, {
        custom_fields: {
          [ASANA_CODES.CATEGORY]: matchedRule.code,
          [ASANA_CODES.AUTO]: ASANA_CODES.TRUE,
        },
      });
      messages.push(matchedRule.category);
    }
  }
  const waitTime = resp.data.backoff ? (resp.data.backoff + 1) * 1000 : 200;
  await new Promise((resolve) => setTimeout(resolve, waitTime)); // Stop backoff violation error
}

function determineCategoryFromQuestion(question) {
  const lowerQuestion = question.body.toLowerCase().replace(/:\s*/g, "");
  const allWords = lowerQuestion
    .split(" ")
    .filter((w) => w !== "")
    .map((w) => w.trim());
  for (const rule of Rules) {
    if (rule.keywords.some((r) => allWords.indexOf(r) > -1)) {
      return rule;
    }
  }
  return undefined;
}

async function deleteDuplicates(allResults) {
  const links = allResults.map((d) => {
    const link = d.custom_fields.filter((l) => l.gid === ASANA_CODES.LINK);
    return { gid: d.gid, id: getIDFromLink(link), name: d.name.trim() };
  });

  // Check for duplicates - on a combination of name and ID
  const set = new Set(links.map((i) => `${i.name}#${i.id}`));
  const duplicates = links.filter((item) => {
    if (set.has(`${item.name}#${item.id}`)) {
      set.delete(`${item.name}#${item.id}`);
    } else {
      return item;
    }
  });
  console.log("dup len:", duplicates.length);
  // delete items in the duplicate array
  for (const item of duplicates) {
    await client.tasks.deleteTask(item.gid);
    console.log(`deleting item ${item.gid}`);
  }
}

main(Mode.TAG);
// main(Mode.DEDUP);
// main(Mode.TAG);
