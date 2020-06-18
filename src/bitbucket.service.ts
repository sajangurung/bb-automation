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
    this.workspace = "{f9184af2-def1-47eb-9fe2-96d5534435e4}";
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
      console.log(err);
    }
  }

  async createNewBranches(repoSlug: string, name: string) {
    const body = {
      name,
      target: {
        hash: "release/1.1.13",
      },
    };

    try {
      const { data, headers } = await this.client.refs.createBranch({
        _body: body,
        repo_slug: repoSlug,
        workspace: this.workspace,
      });
    } catch (err) {
      console.log(err);
    }
  }
  async createPullRequests(title: string, repoSlug: string, source: string, destination: string) {
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
      const { data, status } = await this.client.repositories.createPullRequest({
        _body: body,
        repo_slug: repoSlug,
        workspace: this.workspace,
      });
      if (status === 201) {
        return data;
      }

      throw Error("Something went wrong");
    } catch (err) {
      console.log(err);
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
          prefix: "hotfix/",
        },
        {
          kind: "release",
          enabled: false,
        },
      ],
    };

    try {
      const { data, status } = await this.client.repositories.updateBranchingModelSettings({
        _body: body,
        repo_slug: repoSlug,
        workspace: this.workspace,
      });

      if (status === 201) {
        return data;
      }
    } catch (err) {
      console.log(err);
    }
  }
}
