const result = {
  scm: "git",
  website: "",
  has_wiki: false,
  uuid: "{258393d8-113a-4d6e-b753-10ce24dbabe2}",
  links: {
    watchers: {
      href: "https://api.bitbucket.org/2.0/repositories/findex/nemo/watchers",
    },
    branches: {
      href: "https://api.bitbucket.org/2.0/repositories/findex/nemo/refs/branches",
    },
    tags: {
      href: "https://api.bitbucket.org/2.0/repositories/findex/nemo/refs/tags",
    },
    commits: {
      href: "https://api.bitbucket.org/2.0/repositories/findex/nemo/commits",
    },
    clone: [
      {
        href: "https://fdx-sajangurung@bitbucket.org/findex/nemo.git",
        name: "https",
      },
      {
        href: "git@bitbucket.org:findex/nemo.git",
        name: "ssh",
      },
    ],
    self: {
      href: "https://api.bitbucket.org/2.0/repositories/findex/nemo",
    },
    source: {
      href: "https://api.bitbucket.org/2.0/repositories/findex/nemo/src",
    },
    html: {
      href: "https://bitbucket.org/findex/nemo",
    },
    avatar: {
      href: "https://bytebucket.org/ravatar/%7B258393d8-113a-4d6e-b753-10ce24dbabe2%7D?ts=default",
    },
    hooks: {
      href: "https://api.bitbucket.org/2.0/repositories/findex/nemo/hooks",
    },
    forks: {
      href: "https://api.bitbucket.org/2.0/repositories/findex/nemo/forks",
    },
    downloads: {
      href: "https://api.bitbucket.org/2.0/repositories/findex/nemo/downloads",
    },
    pullrequests: {
      href: "https://api.bitbucket.org/2.0/repositories/findex/nemo/pullrequests",
    },
  },
  fork_policy: "no_forks",
  full_name: "findex/nemo",
  name: "NEMO",
  project: {
    links: {
      self: {
        href: "https://api.bitbucket.org/2.0/workspaces/findex/projects/DEF",
      },
      html: {
        href: "https://bitbucket.org/findex/workspace/projects/DEF",
      },
      avatar: {
        href: "https://bitbucket.org/account/user/findex/projects/DEF/avatar/32?ts=1568247976",
      },
    },
    type: "project",
    name: "Defunct",
    key: "DEF",
    uuid: "{4971c801-08c6-4ffc-a54f-cc87fbfef362}",
  },
  language: "",
  created_on: "2014-07-21T07:23:55.260353+00:00",
  mainbranch: {
    type: "branch",
    name: "master",
  },
  workspace: {
    slug: "findex",
    type: "workspace",
    name: "Findex",
    links: {
      self: {
        href: "https://api.bitbucket.org/2.0/workspaces/findex",
      },
      html: {
        href: "https://bitbucket.org/findex/",
      },
      avatar: {
        href: "https://bitbucket.org/workspaces/findex/avatar/?ts=1543622258",
      },
    },
    uuid: "{b973b22c-dfa5-499c-b25d-43049bb8390a}",
  },
  has_issues: false,
  owner: {
    username: "findex",
    display_name: "Findex",
    type: "team",
    uuid: "{b973b22c-dfa5-499c-b25d-43049bb8390a}",
    links: {
      self: {
        href: "https://api.bitbucket.org/2.0/teams/%7Bb973b22c-dfa5-499c-b25d-43049bb8390a%7D",
      },
      html: {
        href: "https://bitbucket.org/%7Bb973b22c-dfa5-499c-b25d-43049bb8390a%7D/",
      },
      avatar: {
        href: "https://bitbucket.org/account/findex/avatar/",
      },
    },
  },
  updated_on: "2019-09-12T00:33:18.220986+00:00",
  size: 90201063,
  type: "repository",
  slug: "nemo",
  is_private: true,
  description: "",
};
export type Repository = typeof result;
