const PROJECT = "1201979315672216";
const CATEGORY = "1201993867608147";
const LINK = "1201993867608143";
const NOT_FOUND = "1202225109115305";
const AUTO = "1202489324805983";
const TRUE = "1202489324805984";
const DATE = "1201993867608145";

const ASANA_CODES = {
  PROJECT,
  CATEGORY,
  LINK,
  NOT_FOUND,
  AUTO,
  TRUE,
  DATE,
};

function getIDFromLink(link) {
  if (link[0].text_value === null) {
    return undefined;
  }
  const segments = link[0].text_value.split("/");
  return segments[4];
}

const Mode = {
  TAG: "TAG",
  DEDUP: "DEDUP",
  STATS: "STATS",
};

// If any of the keywords are matched at least once then we use that category
const Rules = [
  { category: "SDK", keywords: ["sdk"], code: "1202450412427763" },
  {
    category: "APIUsage",
    keywords: [
      "keyconditionexpression",
      "scan",
      "query",
      "getitem",
      "putitem",
      "updateitem",
      "transactwriteitems",
      "transactgetitems",
      "scanforwardindex",
      "transactions",
      "conditionexpression",
      "updateexpression",
      "projectionexpression",
    ],
    code: "1202225109115311",
  },
  { category: "PynamoDB", keywords: ["pynamodb"], code: "1202225109115318" },
  { category: "PartiQL", keywords: ["partiql"], code: "1202450412427753" },
  {
    category: "GraphQL",
    keywords: ["graphql", "appsync"],
    code: "1202452619985946",
  },
  {
    category: "Documentation",
    keywords: ["documentation"],
    code: "1201993867608151",
  },
  {
    category: "Metrics",
    keywords: ["metrics", "cloudwatch"],
    code: "1202225109115328",
  },
  {
    category: "InfrastructureAsCode",
    keywords: ["cdk", "cloudformation"],
    code: "1202225109115333",
  },
  { category: "TTL", keywords: ["ttl"], code: "1202450412427768" },
  {
    category: "Streams-Lambda triggers",
    keywords: ["streams", "lambda", "cdc"],
    code: "1202450412427796",
  },
  { category: "LargeItemSize", keywords: ["400kb"], code: "1202452619985952" },
  {
    category: "DynamoDBMapper",
    keywords: ["dynamodbmapper"],
    code: "1202494201059271",
  },
  {
    category: "GlobalTables",
    keywords: ["multi-active"],
    code: "1202450412427769",
  },
  {
    category: "DataModeling",
    keywords: ["many-to-many"],
    code: "1201993867608149",
  },
];

module.exports = {
  ASANA_CODES,
  getIDFromLink,
  Mode,
  Rules,
};
