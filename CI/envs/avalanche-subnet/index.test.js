require('module-alias/register');
const setupAvalancheEnv = require('@envs/avalanche-subnet');

let main = async () => {
    let env = await setupAvalancheEnv();
    console.dir(env)
}

main()
