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
    try {
      const { data, status } = await this.client.repositories.list({
        workspace: this.workspace,
        sort: "-updated_on",
        page,
        pagelen: this.pageLength,
      });
      if (status === 200) {
        return data;
      }

      throw new Error(`something went wrong, status is ${status}`);
    } catch (err) {
      console.log(this.parseError(err));
    }
  }

  async createNewBranches(repo_slug: string, target: string, name: string) {
    const body = {
      name,
      target: {
        hash: target,
      },
    };
    try {
      await this.client.refs.createBranch({
        _body: body,
        repo_slug,
        workspace: this.workspace,
      });
    } catch (err) {
      console.log(this.parseError(err));
    }
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
    try {
      await this.client.repositories.createPullRequest({
        _body: body,
        repo_slug,
        workspace: this.workspace,
      });
    } catch (err) {
      return this.parseError(err);
    }
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

    try {
      await this.client.repositories.updateBranchingModelSettings({
        _body: body,
        repo_slug,
        workspace: this.workspace,
      });
    } catch (err) {
      console.log(this.parseError(err));
    }
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
    try {
      const { data, status } = await this.client.repositories.listEnvironments({
        repo_slug,
        workspace: this.workspace,
        pagelen: this.pageLength,
      });

      if (status === 200) {
        return data;
      }
    } catch (err) {
      console.log(this.parseError(err));
    }
  }

  async listEnvironmentVariables(repo_slug: string, environment_uuid: string, page: number = 1) {
    try {
      const { data, status } = await this.client.repositories.listDeploymentVariables({
        repo_slug,
        environment_uuid,
        workspace: this.workspace,
        page,
        pagelen: this.pageLength,
      });

      return data;
    } catch (err) {
      console.log(this.parseError(err));
    }
  }

  async createDeploymentVariable(
    repo_slug: string,
    environment_uuid: string,
    key: string,
    value: string,
    secured: boolean
  ) {
    try {
      const _body = { key, value, secured };
      const { data } = await this.client.pipelines.createDeploymentVariable({
        _body,
        environment_uuid,
        repo_slug,
        variable_uuid: "dummy", // this is dumb
        workspace: this.workspace,
      });

      return data;
    } catch (err) {
      console.log(err);
      console.log(this.parseError(err));
    }
  }

  async updateDeploymentVariable(
    repo_slug: string,
    environment_uuid: string,
    variable_uuid: string,
    key: string,
    value: string,
    secured: boolean
  ) {
    try {
      const _body = { key, value, secured };
      const { data } = await this.client.pipelines.updateDeploymentVariable({
        _body,
        environment_uuid,
        repo_slug,
        variable_uuid,
        workspace: this.workspace,
      });

      return data;
    } catch (err) {
      console.log(this.parseError(err));
    }
  }

  async updateEnvironmentVariables(
    repo_slug: string,
    environment_uuid: string,
    variable_uuid: string
  ) {
    try {
      const _body = {};
      const { data } = await this.client.repositories.updateDeploymentVariable({
        _body,
        environment_uuid,
        repo_slug,
        variable_uuid,
        workspace: this.workspace,
      });

      return data;
    } catch (err) {
      console.log(this.parseError(err));
    }
  }

  async listVariablesForRepo(repo_slug: string, page: string = "1") {
    try {
      const { data, error } = await this.client.pipelines.listVariablesForRepo({
        repo_slug,
        workspace: this.workspace,
        page,
        pagelen: this.pageLength,
      });
      return data;
    } catch (err) {
      console.log(this.parseError(err));
    }
  }

  async createPipelineVariable(repo_slug: string, key: string, value: string, secured: boolean) {
    try {
      const _body = { key, value, secured };
      const { data, headers } = await this.client.repositories.createPipelineVariable({
        _body,
        repo_slug,
        workspace: this.workspace,
      });
      return data;
    } catch (err) {
      console.log(this.parseError(err));
    }
  }

  async update(repo_slug: string, variable_uuid: string) {
    try {
      const _body = {};
      const { data, headers } = await this.client.pipelines.updateVariable({
        _body,
        repo_slug,
        variable_uuid,
        workspace: this.workspace,
      });
    } catch (err) {
      console.log(this.parseError(err));
    }
  }

  async createEnvironment(repo_slug: string, name: string, environmentType: EnvironmentType) {
    try {
      const _body = {
        environment_type: {
          type: "deployment_environment_type",
          name: environmentType,
        },
        name,
      };
      const { data, status, error } = await this.client.deployments.createEnvironment({
        _body,
        repo_slug,
        workspace: this.workspace,
      });
      console.log(status, error);
      return data;
    } catch (err) {
      console.log(this.parseError(err));
    }
  }

  async updateEnvironment(repo_slug: string, environment_uuid: string, name: string) {
    try {
      const _body = {
        name,
      };
      const { data, headers } = await this.client.deployments.updateEnvironment({
        _body,
        environment_uuid,
        repo_slug,
        workspace: this.workspace,
      });
    } catch (err) {
      console.log(this.parseError(err));
    }
  }

  private async parseError(response: any) {
    const { message, error, headers, request, status } = response;
    return error;
  }
}
