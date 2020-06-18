import { BitbucketService, Paginated } from "./bitbucket.service";
import { Repository } from "./interfaces/repository";
import { Config } from "./config";

export class App {
  private bitbucket: BitbucketService;

  constructor() {
    this.bitbucket = new BitbucketService();
  }
  async run() {
    // Get all repositories
    const repositories = await this.getAllRepositories();
    console.log("Found repositories", repositories);

    const prPromises = repositories.map((repo: Repository) =>
      this.bitbucket.createPullRequests("merge release", repo.slug, "release/1.1.12", "master")
    );
    await Promise.all(prPromises);
    console.log("Finished creating pull requests");

    const createNewBranchPromises = repositories.map((repo: Repository) =>
      this.bitbucket.createNewBranches(repo.slug, "release/1.1.15")
    );
    await Promise.all(createNewBranchPromises);
    console.log("Finished creating new branches");

    const updateBranchingModelPromises = repositories.map((repo: Repository) =>
      this.bitbucket.updateBranchingModel(repo.slug, "release/1.1.13")
    );
    await Promise.all(updateBranchingModelPromises);
    console.log("Finished updating branching model");
  }

  async getAllRepositories() {
    const result = await this.getRepositories();
    const projects = Config.PROJECTS;
    const found = [] as Repository[];
    if (result?.values) {
      return await this.filterRepositories(result, projects, found);
    }

    return [];
  }

  async getRepositories(page?: string) {
    return await this.bitbucket.getRepositories(page);
  }

  async filterRepositories(
    result: Paginated<Repository>,
    projects: string[],
    found: Repository[]
  ): Promise<any> {
    for (let i = 0; i < result.values.length; i++) {
      const repo = result.values[i];
      if (projects.includes(repo.name)) {
        found.push(repo);
        if (i >= 0) {
          projects.splice(i, 1);
        }
      }
    }

    if (projects.length && result.next) {
      const nextResult = await this.getRepositories(result.page + 1);
      if (nextResult) {
        return this.filterRepositories(nextResult, projects, found);
      }
    }

    if (!projects.length) {
      return found;
    }
  }
}
