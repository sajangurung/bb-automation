const safeParse = (value: string): string[] => {
  try {
    return JSON.parse(value);
  } catch (err) {
    return [];
  }
};

const REPOSITORIES: string = process.env["REPOSITORIES"] || "";
const REPOSITORIES_TO_MIGRATE: string = process.env["REPOSITORIES_TO_MIGRATE"] || "";

export const Config = {
  PROJECTS: safeParse(REPOSITORIES),
  PROJECTS_TO_MIGRATE: safeParse(REPOSITORIES_TO_MIGRATE),
  USERNAME: process.env["USERNAME"] || "",
  APP_PASSWORD: process.env["APP_PASSWORD"] || "",
  WORKSPACE: process.env["WORKSPACE"],
};
