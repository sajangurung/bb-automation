# bb-automation

## Project setup

```
npm install
```

### Compiles and hot-reloads for development

```
npm start:nodemon
```

### Getting Started

- Get app password for bitbucket and configure environment variables with it
- Enter release branches name and other details in app.ts
- Run script using `npm start`

### Requirements

- Copy variables from one repository to another

## Flags

Mandatory Flags

- app_username
- app_password
- workspace_id

- source_repo_name
- source_environment_name

- target_repo
- target_environment
- target_stage

Optional flags

| Flag             | Options                    | Default  | Description                                                               |
| ---------------- | -------------------------- | -------- | ------------------------------------------------------------------------- |
| writeToFile      | `source`, `target`, `both` | `target` | this will write the variables to a file                                   |
| readFromFile     | full file path             |          | this will read variables from a file and write to a repository            |
| overwriteSecured | `true`, `false`            | `false`  | if true, this will set secured variables as dummy text                    |
| delete           | `true`, `false`            | `false`  | if true, it will delete variables in target that is not present in source |
