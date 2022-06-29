var asana = require("asana");
var axios = require("axios");
let results = { _response: { next_page: { offset: "start" } } };
let untagged = [];
let messages = [];
let start = 0;
let max = 10;
let totalCount = 0;
const STACKOVERFLOW_KEY = process.env.STACKOVERFLOW_KEY;
const ASANA_PAT = process.env.ASANA_PAT;
const PROJECT_CODE = "1201979315672216";
const CAT_CODE = "1201993867608147";
const LINK_CODE = "1201993867608143";
const NOT_FOUND_CODE = "1202225109115305";
const AUTO_CODE = "1202489324805983";
const TRUE_CODE = "1202489324805984";
const client = asana.Client.create().useAccessToken(ASANA_PAT);

// 1: Loop through the paginated response of asana for a list of project tasks.
// 2: Collect all the un-categorised tasks to loop through
// 3: Visit the link and see if there is no longer a question to answer
// 4: Tag the task with the appropriate name ("NotFound")
// 5: Also tag as auto-tagged = TRUE so we know it was auto-tagged
// TODO: Adapt this so we can categorise based on the occurence of keywords

async function main() {
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

    results = await client.projects.tasks(PROJECT_CODE, params);
    // untagged = [...untagged, results._response.data.filter( r => r.custom_fields )]
    results._response.data.forEach((task) => {
      const tags = task.custom_fields.filter((cf) => cf.gid === CAT_CODE);
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
  console.log("process untagged: ", untagged.length);
  let counter = 0;
  for (let ut of untagged) {
    console.log(counter);
    const link = ut.custom_fields.filter((l) => l.gid === LINK_CODE);
    if (link[0].text_value === null) {
      console.log("Skip repost");
    } else {
      await processStackOverflow(ut, link, messages);
    }
    console.log(JSON.stringify(ut, null, 2));
    counter++;
  }
  console.log(messages);
}

async function processStackOverflow(ut, link, messages) {
  const segments = link[0].text_value.split("/"); // Split to get Question ID
  const url = `https://api.stackexchange.com/2.3/questions/${segments[4]}?order=desc&sort=activity&site=stackoverflow&filter=withbody&key=${STACKOVERFLOW_KEY}`;
  const resp = await axios.get(url);
  if (resp.data.items.length === 0) {
    await client.tasks.updateTask(ut.gid, {
      custom_fields: { [CAT_CODE]: NOT_FOUND_CODE, [AUTO_CODE]: TRUE_CODE },
    });
    messages.push(segments[4]);
  }

  const waitTime = resp.data.backoff ? (resp.data.backoff + 1) * 1000 : 200;
  await new Promise((resolve) => setTimeout(resolve, waitTime)); // Stop backoff violation error
}

main();
