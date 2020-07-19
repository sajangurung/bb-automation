export const cleanRepoName = (repoName: string) => {
  const split = repoName.split("-");
  const filter = split.filter((word) => !["portal", "backend"].includes(word));
  return filter.join(" ");
};

export const mapStage = (stage: string) => {
  const stageName = stage.toLocaleLowerCase();
  if (["uat"].includes(stageName)) {
    return "Staging";
  } else if (["production"].includes(stageName)) {
    return "Production";
  }
  return "Test";
};

// input "{8fbe1e67-8a41-4719-8d33-cced6d1860ec}~PRODUCTION Client Portal.json";
// output ["{8fbe1e67-8a41-4719-8d33-cced6d1860ec}", "PRODUCTION", "Client Portal"];
export const splitFullName = (fullName: string) => {
  const [repoId, rest] = fullName.split("~");
  const cleanFileName = rest.replace(".json", "");
  const stage = cleanFileName.substr(0, cleanFileName.indexOf(" "));
  const appName = cleanFileName.substr(cleanFileName.indexOf(" ") + 1);
  return [repoId, stage, appName, fullName];
};
