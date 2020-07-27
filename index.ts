import { PostReleaseTrigger, PostReleaseConfig } from "./src/post-release-hook";

const postReleaseConfig: PostReleaseConfig = {
  title: "merge release",
  source: "release/1.1.12",
  destination: "master",
  newBranch: "release/1.1.13",
  target: "release/1.1.12",
};

const trigger = new PostReleaseTrigger();
trigger.run(postReleaseConfig);
