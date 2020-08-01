// input "{guid}~STAGENAME APPNAME.json";
// output ["{guid}", "STAGENAME", "APPNAME"];
export const splitFullName = (fullName: string) => {
  const cleanFileName = fullName.replace(".json", "");
  const [repoId, repoName, environment] = cleanFileName.split("~");
  return [repoId, repoName, environment, fullName];
};
