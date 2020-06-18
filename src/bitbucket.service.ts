import { Bitbucket } from "bitbucket";
import { APIClient } from "bitbucket/src/plugins/register-endpoints/types";
import { Repository } from "./interfaces/repository";
import { Config } from "./config";

export interface Paginated<T> {
  pagelen: string;
  size: string;
  page: string;
  next: string;
  values: T[];
}
export class BitbucketService {
  private client: APIClient;
  private workspace?: string;
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
  }

  async getRepositories(page: string = "1"): Promise<Paginated<Repository> | undefined> {
    try {
      const { data, status } = await this.client.repositories.list({
        workspace: this.workspace,
        sort: "-updated_on",
        page,
      });
      if (status === 200) {
        return data;
      }

      return undefined;
    } catch (err) {
      console.log(this.parseError(err));
    }
  }

  async createNewBranches({
    repoSlug,
    name,
    target,
  }: {
    repoSlug: string;
    name: string;
    target: string;
  }) {
    const body = {
      name,
      target: {
        hash: target,
      },
    };
    try {
      await this.client.refs.createBranch({
        _body: body,
        repo_slug: repoSlug,
        workspace: this.workspace,
      });
    } catch (err) {
      console.log(this.parseError(err));
    }
  }
  async createPullRequests({
    title,
    repoSlug,
    source,
    destination,
  }: {
    title: string;
    repoSlug: string;
    source: string;
    destination: string;
  }) {
    const body = {
      title: title,
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
        repo_slug: repoSlug,
        workspace: this.workspace,
      });
    } catch (err) {
      return this.parseError(err);
    }
  }

  async updateBranchingModel(repoSlug: string, developmentBranch: string) {
    const body = {
      development: {
        use_mainbranch: false,
        name: developmentBranch,
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
        repo_slug: repoSlug,
        workspace: this.workspace,
      });
    } catch (err) {
      console.log(this.parseError(err));
    }
  }

  private async parseError(response: any) {
    return response.error?.error?.message;
  }
}
