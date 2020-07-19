import { writeFile as fsWriteFile, readFile as fsReadFile, readdir as fsReaddir } from "fs";
import { promisify } from "util";

import { BitbucketService, Paginated } from "./bitbucket.service";
import { Repository } from "./interfaces/repository";
import { Config } from "./config";

import { Environment } from "./interfaces/environment";
import { cleanRepoName, mapStage, splitFullName } from "./util";
import * as _ from "lodash";

const writeFile = promisify(fsWriteFile);
const readFile = promisify(fsReadFile);
const readDir = promisify(fsReaddir);

export class App {
  private bitbucket: BitbucketService;

  constructor() {
    this.bitbucket = new BitbucketService();
  }

  /**
   * Script to run post release
   * Creates release prs
   * Creates new branches
   * Updates new branch to be default development branch
   */
  async runPostRelease() {
    const title = "merge release";
    const source = "release/1.1.12";
    const destination = "master";
    const newBranchName = "release/1.1.13";
    const target = source;

    // Get all repositories
    const repositories = await this.getAllRepositories(Config.PROJECTS);
    console.log("Found repositories", repositories.length);

    const prPromises = repositories.map((repo: Repository) =>
      this.bitbucket.createPullRequests(repo.slug, source, destination, title)
    );
    await Promise.all(prPromises);
    console.log("Finished creating pull requests");

    const createNewBranchPromises = repositories.map((repo: Repository) =>
      this.bitbucket.createNewBranches(repo.slug, target, newBranchName)
    );
    await Promise.all(createNewBranchPromises);
    console.log("Finished creating new branches");

    const updateBranchingModelPromises = repositories.map((repo: Repository) =>
      this.bitbucket.updateBranchingModel(repo.slug, newBranchName)
    );
    await Promise.all(updateBranchingModelPromises);
    console.log("Finished updating branching model");
  }

  async runDeploymentMigration() {
    // await this.copyToFileAndGetConfigs();
    const repositoriesToMigrateTo = await this.getAllRepositories(Config.PROJECTS_TO_MIGRATE);
    console.log("Repositories", repositoriesToMigrateTo.length);

    const repoFolderKey = "./repo-dump/";
    const files: string[] = await readDir(repoFolderKey);
    const parsedFiles = files.map((file) => splitFullName(file));

    for (const targeRepo of repositoriesToMigrateTo) {
      // lowerCase repo name
      const repoName = cleanRepoName(targeRepo.name);
      for (const file of parsedFiles) {
        const [repoId, stage, appName, fullName] = file;
        // name doesn't match for my findex
        const appNameInLowerCase = appName.toLowerCase();
        const isMyFindex = repoName === "my findex" && appNameInLowerCase === "client portal";
        const isSameday = repoName === "sameday" && appNameInLowerCase === "same day tax";
        const isSameRepo = repoName === appNameInLowerCase;
        if (!isMyFindex && !isSameRepo && !isSameday) {
          continue;
        }
        const fullPath = `${repoFolderKey}${fullName}`;
        // await this.migrateRepositoryVariables(repoId, targeRepo.uuid);
        await this.migrateEnvironmentVariables(targeRepo, stage, fullPath);
      }
    }
  }

  async migrateRepositoryVariables(source: string, target: string) {
    const sourceVars = await this.bitbucket.listVariablesForRepo(source);
    const targetVars = await this.bitbucket.listVariablesForRepo(target);
    console.log(
      `received: total source variables ${sourceVars.values.length}, total target variables ${targetVars.values.length}`
    );
    const comparator = (a: any, b: any) => a.key === b.key;
    const uniqueVarsToCreate = _.differenceWith(sourceVars.values, targetVars.values, comparator);
    console.log(`total variables to create ${uniqueVarsToCreate.length}`);
    const unsecuredVars = uniqueVarsToCreate.filter((value: any) => !value.secured);
    const createVars = unsecuredVars.map((variable: any) =>
      this.bitbucket.createPipelineVariable(target, variable.key, variable.value, variable.secured)
    );

    await Promise.all(createVars);
  }

  async migrateEnvironmentVariables(repository: any, stage: string, fullPath: string) {
    // check given stage exists
    const currentEnvironment = await this.firstOrCreate(repository, stage);
    const variables = await readFile(fullPath, { encoding: "utf-8" });
    const originalVars = JSON.parse(variables);

    const currentVars = await this.bitbucket.listEnvironmentVariables(
      repository.slug,
      currentEnvironment.uuid
    );
    console.log("Total variables in the environment", currentVars.values.length);

    const createComparator = (a: any, b: any) => a.key === b.key;
    const uniqueVarsToCreate = _.differenceWith(originalVars, currentVars.values, createComparator);
    console.log("Total variables to create", uniqueVarsToCreate.length);
    // this overwrites secured variables and sets them as undefined.
    // this should filter out secured variables after running for the first time

    await Promise.all(
      uniqueVarsToCreate.map((envVar: any) => {
        const value = envVar.secured ? "dummy" : envVar.value;
        return this.bitbucket.createDeploymentVariable(
          repository.slug,
          currentEnvironment.uuid,
          envVar.key,
          value,
          envVar.secured
        );
      })
    );

    const updateComparator = (a: any, b: any) =>
      a.key === b.key && !(a.value || "").localeCompare(b.value || "");
    const uniqueVarsToUpdate = _.differenceWith(currentVars.values, originalVars, updateComparator);
    console.log("Total variables to update", uniqueVarsToUpdate.length);

    await Promise.all(
      uniqueVarsToUpdate.map((envVar: any) => {
        const value = envVar.secured ? "dummy" : envVar.value;
        return this.bitbucket.updateDeploymentVariable(
          repository.slug,
          currentEnvironment.uuid,
          envVar.uuid,
          envVar.key,
          value,
          envVar.secured
        );
      })
    );
  }

  async firstOrCreate(repository: any, stage: string): Promise<Environment> {
    const environmentType = mapStage(stage);
    const currentEnvironments = await this.bitbucket.listEnvironments(repository.slug);
    const currentEnvironment = currentEnvironments?.values.filter((environment) =>
      environment.name.toLowerCase().includes(stage.toLowerCase())
    );
    if (currentEnvironment?.length) {
      return currentEnvironment[0];
    }

    return await this.bitbucket.createEnvironment(repository.slug, stage, environmentType);
  }

  async copyToFileAndGetConfigs() {
    const repositories = await this.getAllRepositories(Config.PROJECTS);
    console.log("Repositories", repositories.length);
    // get target repo
    // find deployment config from the file. pattern is stage appName
    // create environment if doesn't exist
    // read config for that environment and createOrUpdate config

    // const appStages = stages.flatMap((stage) => apps.map((app) => `${stage} ${app}`));
    // const newRepositories = await this.getAllRepositories(Config.PROJECTS_TO_MIGRATE);
    // console.log("New Repositories", newRepositories);

    // get all source repo
    // save all deployment config to file
    const enviroments = await Promise.all(
      repositories.map(async (repo) => {
        const enviroments = await this.bitbucket.listEnvironments(repo.slug);
        return enviroments?.values.map((value) => ({ ...value, repo_uuid: repo.uuid }));
      })
    );

    const flattenedEnvironments = enviroments.flatMap((v) => v);
    console.log(
      "getting variables for",
      flattenedEnvironments.map((r) => r?.name)
    );

    const environmentConfigs: { [key: string]: any } = {};
    for (const environment of flattenedEnvironments) {
      if (!environment?.uuid) {
        continue;
      }

      const result = await this.bitbucket.listEnvironmentVariables(
        environment?.repo_uuid,
        environment?.uuid
      );
      console.log(environment.name, result.values.length);
      const key = `${environment.repo_uuid}~${environment.name}`;
      environmentConfigs[key] = result;
      await writeFile(`${key}.json`, JSON.stringify(result));
    }

    return environmentConfigs;
  }

  async getAllRepositories(projects: any): Promise<Repository[]> {
    const result = await this.bitbucket.getRepositories();
    if (result?.values) {
      if (Array.isArray(projects[0])) {
        // multidimensional
        return Promise.all(
          projects.map((project: string[]) => this.filterRepositories(result, project))
        );
      } else {
        return await this.filterRepositories(result, projects);
      }
    }

    return [];
  }

  async filterRepositories(
    result: Paginated<Repository>,
    projects: string[],
    found?: Repository[]
  ): Promise<any> {
    if (!found) {
      found = [];
    }

    for (let i = 0; i < result.values.length; i++) {
      const repo = result.values[i];
      for (let j = projects.length; j >= 0; j--) {
        if (projects[j] === repo.name) {
          found.push(repo);
          projects.splice(j, 1);
        }
      }
    }

    if (projects.length && result.next) {
      const nextPage = parseInt(result.page + 1);
      const nextResult = await this.bitbucket.getRepositories(nextPage);
      if (nextResult) {
        return this.filterRepositories(nextResult, projects, found);
      }
    }

    if (!projects.length) {
      return found;
    }
  }
}
