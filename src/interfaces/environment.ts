const environment = {
    category: { name: 'PRODUCTION' },
    restrictions: {
      admin_only: false,
      type: 'deployment_restrictions_configuration'
    },
    uuid: '{593bfa49-3a77-4da5-8038-f93ee425b735}',
    environment_lock_enabled: true,
    lock: {
      type: 'deployment_environment_lock_open',
      name: 'OPEN',
      lock_opener: [Object]
    },
    deployment_gate_enabled: false,
    rank: 2,
    change_request_config: { configured: false },
    hidden: false,
    type: 'deployment_environment',
    slug: 'string',
    environment_type: {
      type: 'deployment_environment_type',
      name: 'Production',
      rank: 2
    },
    name: 'PRODUCTION'
  }
}

export type Environment = typeof environment;