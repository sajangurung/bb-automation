import { BitbucketService } from "./bitbucket.service";
import { writeFile as fsWriteFile, readFile as fsReadFile, readdir as fsReaddir } from "fs";
import { promisify } from "util";
import { splitFullName, mapStage } from "./util";
import { Config } from "./config";
import * as _ from "lodash";
import { Environment } from "./interfaces/environment";
import { parse } from "path";

const writeFile = promisify(fsWriteFile);
const readFile = promisify(fsReadFile);
const readDir = promisify(fsReaddir);

export type DeploymentStage = {
  name: string;
  stage: string;
  type: string; // Test, Staging, Production
};

export type PreReleaseConfig = {
  source: DeploymentStage;
  target: DeploymentStage;
  writeToFile?: boolean;
  /**
   * This will only log total values that will be read and written
   */
  dryRun?: boolean;
  /**
   * By default will skip writing to secured variables
   * But will set it to dummy values if set as true
   */
  overwriteSecuredVariables?: boolean;
};

export class PreReleaseTrigger extends BitbucketService {
  async run(config: PreReleaseConfig) {
    const { source, target, writeToFile, overwriteSecuredVariables } = config;

    if (writeToFile) {
      this.copyToFile(source);
    }

    this.copyVariables(source, target);
  }

  private async copyToFile(source: DeploymentStage) {
    const repositories = await this.getAllRepositories([source.name]);
    console.log("Repositories", repositories.length);

    const enviroments = await Promise.all(
      repositories.map(async (repo) => {
        const enviroments = await this.listEnvironments(repo.slug);
        return enviroments?.values.map((value) => ({
          ...value,
          repo_uuid: repo.uuid,
          repo_name: repo.name,
        }));
      })
    );

    const flattenedEnvironments = enviroments.flatMap((v) => v);
    console.log(
      "getting variables for",
      flattenedEnvironments.map((r) => r?.name)
    );

    for (const environment of flattenedEnvironments) {
      if (!environment?.uuid) {
        continue;
      }

      const result = await this.listEnvironmentVariables(environment?.repo_uuid, environment?.uuid);
      console.log(environment.name, result.values.length);
      const key = `${environment.repo_uuid}~${environment.repo_name}~${environment.name}`;
      await writeFile(`${key}.json`, JSON.stringify(result));
    }
  }

  private async copyVariables(source: DeploymentStage, target: DeploymentStage) {
    const repositoriesToMigrateTo = await this.getAllRepositories([target.name]);
    console.log("Repositories", repositoriesToMigrateTo.length);

    const repoFolderKey = "./repo-dump/";
    const files: string[] = await readDir(repoFolderKey);
    const parsedFiles = files.map((file) => splitFullName(file));

    const fileToCopy = parsedFiles.find(
      ([, stage, appName]) => stage === source.stage && appName === source.name
    );

    if (!fileToCopy) {
      console.log("Cannot find the source deployment stage");
      return;
    }

    const [repoId, stage, fullName] = fileToCopy;

    for (const targeRepo of repositoriesToMigrateTo) {
      const fullPath = `${repoFolderKey}${fullName}`;
      // await this.migrateRepositoryVariables(repoId, targeRepo.uuid);
      await this.migrateEnvironmentVariables(targeRepo, target, fullPath);
    }
  }

  async migrateRepositoryVariables(source: string, target: string) {
    const sourceVars = await this.listVariablesForRepo(source);
    const targetVars = await this.listVariablesForRepo(target);
    console.log(
      `received: total source variables ${sourceVars.values.length}, total target variables ${targetVars.values.length}`
    );
    const comparator = (a: any, b: any) => a.key === b.key;
    const uniqueVarsToCreate = _.differenceWith(sourceVars.values, targetVars.values, comparator);
    console.log(`total variables to create ${uniqueVarsToCreate.length}`);
    const unsecuredVars = uniqueVarsToCreate.filter((value: any) => !value.secured);
    const createVars = unsecuredVars.map((variable: any) =>
      this.createPipelineVariable(target, variable.key, variable.value, variable.secured)
    );

    await Promise.all(createVars);
  }
  async migrateEnvironmentVariables(repository: any, target: DeploymentStage, fullPath: string) {
    // check given stage exists
    const currentEnvironment = await this.firstOrCreateEnvironment(repository, target);
    const variables = await readFile(fullPath, { encoding: "utf-8" });
    const originalVars = JSON.parse(variables);

    const currentVars = await this.listEnvironmentVariables(
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
        const { key, secured, value } = envVar;
        return this.createDeploymentVariable(
          repository.slug,
          currentEnvironment.uuid,
          key,
          value || "dummy",
          secured
        );
      })
    );

    const updateComparator = (a: any, b: any) =>
      a.key === b.key && !(a.value || "").localeCompare(b.value || "");
    const uniqueVarsToUpdate = _.differenceWith(currentVars.values, originalVars, updateComparator);
    console.log("Total variables to update", uniqueVarsToUpdate.length);

    await Promise.all(
      uniqueVarsToUpdate.map((envVar: any) => {
        const { uuid, key, secured, value } = envVar;
        return this.updateDeploymentVariable(
          repository.slug,
          currentEnvironment.uuid,
          uuid,
          key,
          value || "dummy",
          secured
        );
      })
    );
  }

  async firstOrCreateEnvironment(
    repository: any,
    deploymentStage: DeploymentStage
  ): Promise<Environment> {
    const { stage, type } = deploymentStage;
    const currentEnvironments = await this.listEnvironments(repository.slug);
    const currentEnvironment = currentEnvironments?.values.filter((environment) =>
      environment.name.toLowerCase().includes(stage.toLowerCase())
    );
    if (currentEnvironment?.length) {
      return currentEnvironment[0];
    }

    return await this.createEnvironment(repository.slug, stage, type);
  }

  async firstOrCreateVariable(repository: any, stage: string): Promise<Environment> {
    const environmentType = mapStage(stage);
    const currentEnvironments = await this.listEnvironments(repository.slug);
    const currentEnvironment = currentEnvironments?.values.filter((environment) =>
      environment.name.toLowerCase().includes(stage.toLowerCase())
    );
    if (currentEnvironment?.length) {
      return currentEnvironment[0];
    }

    return await this.createEnvironment(repository.slug, stage, environmentType);
  }
}
