import { BitbucketService } from "./bitbucket.service";
import { writeFile as fsWriteFile, readFile as fsReadFile, readdir as fsReaddir } from "fs";
import { promisify } from "util";
import { splitFullName } from "./util";
import * as _ from "lodash";
import { Environment } from "./interfaces/environment";
import { Repository } from "./interfaces/repository";

const writeFile = promisify(fsWriteFile);
const readFile = promisify(fsReadFile);
const readDir = promisify(fsReaddir);

export type DeploymentEnvironmentType = "Test" | "Staging" | "Production";
export type DeploymentStage = {
  repo: string;
  name: string;
  type: DeploymentEnvironmentType;
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
  /**
   *
   */
  readFromFile?: string;
  /**
   * Delete from target
   */
  deleteInTarget?: boolean;
};

export class PreReleaseHook extends BitbucketService {
  async run(config: PreReleaseConfig) {
    // get source environment
    // check source repo exists
    // check environment exists

    const {
      source,
      target,
      writeToFile,
      deleteInTarget,
      overwriteSecuredVariables,
      readFromFile,
    } = config;

    const repoFolderKey = "./repo-dump/";

    if (!readFromFile) {
      const repositories = await this.getAllRepositories([source.repo]);
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
        if (!environment?.uuid || environment.environment_type.name !== source.type) {
          continue;
        }

        const result = await this.listEnvironmentVariables(
          environment?.repo_uuid,
          environment?.uuid
        );
        console.log(environment.name, result.values.length);
        const key = `${environment.repo_uuid}~${environment.repo_name}~${environment.name}`;
        if (writeToFile) {
          // write the environment variable to a file if flag is on
          await writeFile(`${repoFolderKey}/${key}.json`, JSON.stringify(result.values));
        }
      }
    }

    // get target environment
    // check environment exists otherwise create it
    // create or update variables except for secured.
    // delete if delete flag is on

    const repositoriesToMigrateTo = await this.getAllRepositories([target.repo]);
    console.log("Repositories", repositoriesToMigrateTo.length);

    const files: string[] = await readDir(repoFolderKey);
    const parsedFiles = files.map((file) => splitFullName(file));
    const fileToCopy = parsedFiles.find(
      ([, repoName, type]) => type === source.type && repoName === source.repo
    );

    if (!fileToCopy) {
      console.log("Cannot find the source deployment stage");
      return;
    }

    const [repoId, repoName, type, path] = fileToCopy;

    const fullPath = readFromFile ? readFromFile : path;
    for (const targeRepo of repositoriesToMigrateTo) {
      await this.migrateEnvironmentVariables(targeRepo, target, fullPath, deleteInTarget);
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
  async migrateEnvironmentVariables(
    repository: Repository,
    target: DeploymentStage,
    fullPath: string,
    deleteInTarget?: boolean
  ) {
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

    if (deleteInTarget) {
      const deleteComparator = (a: any, b: any) => a.key === b.key;
      const uniqueVarsToDelete = _.differenceWith(
        currentVars.values,
        originalVars,
        deleteComparator
      );
      console.log("Total variables to delete", uniqueVarsToDelete.length);
      await Promise.all(
        uniqueVarsToDelete.map((envVar: any) =>
          this.deleteDeploymentVariable(repository.slug, currentEnvironment.uuid, envVar.uuid)
        )
      );
    }
  }

  async firstOrCreateEnvironment(
    repository: Repository,
    deploymentStage: DeploymentStage
  ): Promise<Environment> {
    const { name, type } = deploymentStage;
    const currentEnvironments = await this.listEnvironments(repository.slug);
    const currentEnvironment = currentEnvironments?.values.filter((environment) =>
      environment.name.toLowerCase().includes(name.toLowerCase())
    );
    if (currentEnvironment?.length) {
      return currentEnvironment[0];
    }

    return await this.createEnvironment(repository.slug, name, type);
  }
}
