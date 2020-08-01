import { Bitbucket } from "bitbucket";
import { APIClient } from "bitbucket/src/plugins/register-endpoints/types";
import { Repository } from "./interfaces/repository";
import { Config } from "./config";
import { Environment } from "./interfaces/environment";

export type EnvironmentType = "Test" | "Staging" | "Production";
export interface Paginated<T> {
  pagelen: string;
  size: string;
  page: string;
  next: string;
  values: Array<T>;
}
export class BitbucketService {
  private client: APIClient;
  private workspace?: string;
  private pageLength: number;
  private readonly configOptions = {
    baseUrl: "https://api.bitbucket.org/2.0",
    auth: {
      type: "apppassword",
      username: Config.USERNAME,
      password: Config.APP_PASSWORD,
    },
  };

  constructor() {
    this.workspace = Config.WORKSPACE;
    this.client = new Bitbucket(this.configOptions);
    this.pageLength = 100;
  }

  async getRepositories(page: number = 1): Promise<Paginated<Repository> | undefined> {
    const { data } = await this.client.repositories.list({
      workspace: this.workspace,
      sort: "-updated_on",
      page,
      pagelen: this.pageLength,
    });
    return data;
  }

  async createNewBranches(repo_slug: string, target: string, name: string) {
    const body = {
      name,
      target: {
        hash: target,
      },
    };
    await this.client.refs.createBranch({
      _body: body,
      repo_slug,
      workspace: this.workspace,
    });
  }
  async createPullRequests(repo_slug: string, source: string, destination: string, title: string) {
    const body = {
      title,
      source: {
        branch: {
          name: source,
        },
      },
      destination: {
        branch: {
          name: destination,
        },
      },
      reviewers: {},
    };

    await this.client.repositories.createPullRequest({
      _body: body,
      repo_slug,
      workspace: this.workspace,
    });
  }

  async updateBranchingModel(repo_slug: string, name: string) {
    const body = {
      development: {
        use_mainbranch: false,
        name,
      },
      production: {
        enabled: true,
        use_mainbranch: true,
      },
      branch_types: [
        {
          kind: "bugfix",
          enabled: true,
          prefix: "bugfix/",
        },
        {
          kind: "feature",
          enabled: true,
          prefix: "feature/",
        },
        {
          kind: "hotfix",
          enabled: true,
          prefix: "hotfix/",
        },
        {
          kind: "release",
          enabled: true,
          prefix: "release/",
        },
      ],
    };

    const { data } = await this.client.repositories.updateBranchingModelSettings({
      _body: body,
      repo_slug,
      workspace: this.workspace,
    });

    return data;
  }

  async listDeployments(repo_slug: string) {
    return await this.client.repositories.listDeployments({
      repo_slug,
      workspace: this.workspace,
      pagelen: this.pageLength,
    });
  }

  async getDeployments(deployment_uuid: string, repo_slug: string) {
    await this.client.repositories.getDeployment({
      deployment_uuid,
      repo_slug,
      workspace: this.workspace,
    });
  }

  async listEnvironments(repo_slug: string): Promise<Paginated<Environment> | undefined> {
    const { data } = await this.client.repositories.listEnvironments({
      repo_slug,
      workspace: this.workspace,
      pagelen: this.pageLength,
    });

    return data;
  }

  async listEnvironmentVariables(repo_slug: string, environment_uuid: string, page: number = 1) {
    const { data } = await this.client.repositories.listDeploymentVariables({
      repo_slug,
      environment_uuid,
      workspace: this.workspace,
      page,
      pagelen: this.pageLength,
    });

    return data;
  }

  async createDeploymentVariable(
    repo_slug: string,
    environment_uuid: string,
    key: string,
    value: string,
    secured: boolean
  ) {
    const _body = { key, value, secured };
    const { data } = await this.client.pipelines.createDeploymentVariable({
      _body,
      environment_uuid,
      repo_slug,
      variable_uuid: "dummy", // this is dumb
      workspace: this.workspace,
    });

    return data;
  }

  async updateDeploymentVariable(
    repo_slug: string,
    environment_uuid: string,
    variable_uuid: string,
    key: string,
    value: string,
    secured: boolean
  ) {
    const _body = { key, value, secured };
    const { data } = await this.client.pipelines.updateDeploymentVariable({
      _body,
      environment_uuid,
      repo_slug,
      variable_uuid,
      workspace: this.workspace,
    });

    return data;
  }

  async deleteDeploymentVariable(
    repo_slug: string,
    environment_uuid: string,
    variable_uuid: string
  ) {
    console.log("deleting");

    const { data } = await this.client.pipelines.deleteDeploymentVariable({
      repo_slug,
      environment_uuid,
      variable_uuid,
      workspace: this.workspace,
    });
    console.log("deleted", data);
    return data;
  }

  async updateEnvironmentVariables(
    repo_slug: string,
    environment_uuid: string,
    variable_uuid: string
  ) {
    const _body = {};
    const { data } = await this.client.repositories.updateDeploymentVariable({
      _body,
      environment_uuid,
      repo_slug,
      variable_uuid,
      workspace: this.workspace,
    });

    return data;
  }

  async listVariablesForRepo(repo_slug: string, page: string = "1") {
    const { data, error } = await this.client.pipelines.listVariablesForRepo({
      repo_slug,
      workspace: this.workspace,
      page,
      pagelen: this.pageLength,
    });
    return data;
  }

  async createPipelineVariable(repo_slug: string, key: string, value: string, secured: boolean) {
    const _body = { key, value, secured };
    const { data } = await this.client.repositories.createPipelineVariable({
      _body,
      repo_slug,
      workspace: this.workspace,
    });
    return data;
  }

  async update(repo_slug: string, variable_uuid: string) {
    const _body = {};
    const { data } = await this.client.pipelines.updateVariable({
      _body,
      repo_slug,
      variable_uuid,
      workspace: this.workspace,
    });

    return data;
  }

  async createEnvironment(repo_slug: string, name: string, environmentType: string) {
    const _body = {
      environment_type: {
        type: "deployment_environment_type",
        name: environmentType,
      },
      name,
    };
    const { data } = await this.client.deployments.createEnvironment({
      _body,
      repo_slug,
      workspace: this.workspace,
    });
    return data;
  }

  async updateEnvironment(repo_slug: string, environment_uuid: string, name: string) {
    const _body = {
      name,
    };
    const { data } = await this.client.deployments.updateEnvironment({
      _body,
      environment_uuid,
      repo_slug,
      workspace: this.workspace,
    });

    return data;
  }

  async getAllRepositories(projects: any): Promise<Repository[]> {
    const result = await this.getRepositories();
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
      const nextResult = await this.getRepositories(nextPage);
      if (nextResult) {
        return this.filterRepositories(nextResult, projects, found);
      }
    }
    console.log(projects);

    if (!projects.length) {
      return found;
    }
  }

  private async parseError(response: any) {
    const { message, error, headers, request, status } = response;
    return error;
  }
}
