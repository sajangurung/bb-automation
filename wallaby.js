module.exports = function() {
    return {
        files: [
            'src/*.ts',
            { pattern: 'src/__mocks__/*.json', instrument: true, load: true, ignore: false },
            { pattern: 'src/**/*.spec.ts', ignore: true },
            { pattern: 'src/**/*.int.ts', ignore: true }
        ],
        tests: [
            'src/**/*.spec.ts'
            // enable to run integration tests with wallaby
            // 'src/**/*.int.ts'
        ],
        env: {
            type: 'node',
            runner: 'node'
        },
        testFramework: 'jest'
    };
};
