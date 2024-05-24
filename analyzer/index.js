require('module-alias/register');
const getLogger = require('@lib/logging/logger').getLogger;
const analyzerIndexLogger = getLogger('analyzerIndexLogger');
const { countCompilable } = require('@analyzer/counter');
const path = require('path');

let contracts = [
    "Governance",
    "PrizeDistribution",
    "MultiStageAuction",
    "Escrow",
    "ProductOrder"
]


// let countSynthesizedCompilables = () => {
//     contracts.map(async (contract) => {
//         synthesizedCount = countCompilable(path.join('contracts', 'src', 'synthesized'), contract);
//         analyzerIndexLogger.info(`${contract} has ${synthesizedCount} many`)
//     })
// }

// countSynthesizedCompilables();

//let synthesizedCount = countCompilable(path.join('contracts', 'src', 'synthesized', 'Governance'), "Governance");
//let synthesizedCount = countCompilable(path.join('contracts', 'src', 'synthesized', 'PrizeDistribution'), "PrizeDistribution");
//let synthesizedCount = countCompilable(path.join('contracts', 'src', 'synthesized', 'MultiStageAuction'), "MultiStageAuction");
//let synthesizedCount = countCompilable(path.join('contracts', 'src', 'synthesized', 'Escrow'), "Escrow");
let synthesizedCount = countCompilable(path.join('contracts', 'src', 'synthesized', 'ProductOrder'), "ProductOrder");

//let synthesizedCount = countCompilable(path.join('contracts', 'src', 'testset'), "Governance");
