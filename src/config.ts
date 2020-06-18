const safeParse = (value: string): string[] => {
  try {
    return JSON.parse(value);
  } catch (err) {
    return [];
  }
};

const REPOSITORIES: string = process.env["PROJECTS"] || "";
export const Config = {
  PROJECTS: safeParse(REPOSITORIES),
  USERNAME: process.env["USERNAME"] || "",
  APP_PASSWORD: process.env["APP_PASSWORD"] || "",
  WORKSPACE: process.env["WORKSPACE"],
};
