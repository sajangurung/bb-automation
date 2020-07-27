// input "{guid}~STAGENAME APPNAME.json";
// output ["{guid}", "STAGENAME", "APPNAME"];
export const splitFullName = (fullName: string) => {
  const [repoId, rest] = fullName.split("~");
  const cleanFileName = rest.replace(".json", "");
  const stage = cleanFileName.substr(0, cleanFileName.indexOf(" "));
  const appName = cleanFileName.substr(cleanFileName.indexOf(" ") + 1);
  return [repoId, stage, appName, fullName];
};
