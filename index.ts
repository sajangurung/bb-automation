import { PostReleaseTrigger, PostReleaseConfig } from "./src/post-release-hook";
import { PreReleaseHook, PreReleaseConfig } from "./src/pre-release-hook";

const postReleaseConfig: PostReleaseConfig = {
  title: "merge release",
  source: "release/1.1.12",
  destination: "master",
  newBranch: "release/1.1.13",
  target: "release/1.1.12",
};

// const trigger = new PostReleaseTrigger();
// trigger.run(postReleaseConfig);

const preReleaseConfig: PreReleaseConfig = {
  source: {
    repo: "test-project",
    name: "Test",
    type: "Test",
  },
  target: {
    repo: "test-project-2",
    name: "Staging",
    type: "Staging",
  },
  writeToFile: true,
  deleteInTarget: true,
  readFromFile: "./repo-dump/{679bde9a-eff3-4dab-8b11-ff9b7ec05fb5}~test-project~Test.json",
};
const trigger = new PreReleaseHook();
trigger.run(preReleaseConfig);
