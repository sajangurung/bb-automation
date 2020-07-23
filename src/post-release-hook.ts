import { Config } from "./config";
import { Repository } from "./interfaces/repository";
import { BitbucketService } from "./bitbucket.service";

export type PostReleaseConfig = {
  /**
   * PR title
   */
  title: string;
  /**
   * Branch to create PR from (release)
   */
  source: string;
  /**
   * Branch to create PR to (master)
   */
  destination: string;
  /**
   * New Branch to create
   */
  newBranch: string;
  /**
   * New branch to branch from
   */
  target: string;
};

export class PostReleaseTrigger extends BitbucketService {
  async run(postReleaseConfig: PostReleaseConfig) {
    const { source, destination, title, target, newBranch } = postReleaseConfig;
    // Get all repositories
    const repositories = await this.getAllRepositories(Config.PROJECTS);
    console.log("Found repositories", repositories.length);

    console.log("Creating pull requests");
    const createPrs = repositories.map((repo: Repository) =>
      this.createPullRequests(repo.slug, source, destination, title)
    );
    await Promise.all(createPrs);
    console.log("Finished creating pull requests");

    console.log("Creating new branches");
    const createNewBranches = repositories.map((repo: Repository) =>
      this.createNewBranches(repo.slug, target, newBranch)
    );
    await Promise.all(createNewBranches);
    console.log("Finished creating new branches");

    console.log("Updating branching model");
    const updateBranchingModel = repositories.map((repo: Repository) =>
      this.updateBranchingModel(repo.slug, newBranch)
    );
    await Promise.all(updateBranchingModel);
    console.log("Finished updating branching model");
  }
}
