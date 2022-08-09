var asana = require("asana");
const { ASANA_CODES } = utils;
const ASANA_PAT = process.env.ASANA_PAT;

async function main() {
  console.log("START");
  const client = asana.Client.create().useAccessToken(ASANA_PAT);
  const params = {
    opt_pretty: true,
    opt_fields: "name,description,custom_fields", // Notes will get the description
  };
  const results = await client.projects.tasks(ASANA_CODES.PROJECT, params);
  const cf = results.data[0].custom_fields.filter(
    (r) => r.gid === "1201993867608147"
  );
  const category_opts = cf[0].enum_options.map((f) => ({
    gid: f.gid,
    name: f.name,
  }));
  console.log("r: ", results);
  console.log("opt: ", category_opts);
}

main();

/*
opt:  [
  { gid: '1201993867608148', name: 'FeatureGap' },
  { gid: '1201993867608149', name: 'DataModeling' },
  { gid: '1201993867608150', name: 'Pricing' },
  { gid: '1201993867608151', name: 'Documentation' },
  { gid: '1202225109115305', name: 'NotFound' },
  { gid: '1202225109115307', name: 'Indexes' },
  { gid: '1202225109115311', name: 'APIUsage' },
  { gid: '1202225109115318', name: 'PynamoDB' },
  { gid: '1202225109115328', name: 'Metrics' },
  { gid: '1202225109115333', name: 'InfrastructureAsCode' },
  { gid: '1202225109115344', name: 'DynamoDBLocal' },
  { gid: '1202225109115349', name: 'AuthIssues' },
  { gid: '1202450620703129', name: 'CompetitorComparison' },
  { gid: '1202450412427750', name: 'Error Handling' },
  { gid: '1202450412427753', name: 'PartiQL' },
  { gid: '1202450412427756', name: 'Miscellaneous' },
  { gid: '1202450412427761', name: 'Question removed' },
  { gid: '1202450412427763', name: 'SDK' },
  {
    gid: '1202450412427766',
    name: 'Integration with other AWS services'
  },
  { gid: '1202450412427768', name: 'TTL' },
  { gid: '1202450412427769', name: 'Global tables' },
  { gid: '1202450412427796', name: 'Streams-Lambda triggers' },
  { gid: '1202451514330395', name: 'StepFunctionsIntegration' },
  { gid: '1202451514330399', name: 'Consistency' },
  { gid: '1202452619985946', name: 'GraphQL' },
  { gid: '1202452619985948', name: 'KCL' },
  { gid: '1202452619985952', name: 'LargeItemSize' },
  { gid: '1202452619985960', name: 'APIGatewayIntegration' },
  { gid: '1202452619985966', name: 'AppSync' },
  { gid: '1202493952224705', name: 'Migration' },
  { gid: '1202494201059271', name: 'DynamoDBMapper' }

*/
