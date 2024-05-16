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

let synthesizedCount = countCompilable(path.join('contracts', 'src', 'synthesized', 'governance'), "Governance");
//let synthesizedCount = countCompilable(path.join('contracts', 'src', 'synthesized', 'prizedist'), "PrizeDistribution");
//let synthesizedCount = countCompilable(path.join('contracts', 'src', 'synthesized', 'auction'), "MultiStageAuction");
//let synthesizedCount = countCompilable(path.join('contracts', 'src', 'synthesized', 'escrow'), "Escrow");
//let synthesizedCount = countCompilable(path.join('contracts', 'src', 'synthesized', 'productorder'), "ProductOrder");

//let synthesizedCount = countCompilable(path.join('contracts', 'src', 'testset'), "Governance");
