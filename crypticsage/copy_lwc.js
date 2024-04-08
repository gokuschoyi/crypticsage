
// Copy code
const fs = require('fs');

const nodeModulesDir = 'node_modules/lightweight-charts'; // target directory
const lightweightChartsDir = 'lightweight-charts'; // source directory

// Create node_modules directory if it doesn't exist
if (!fs.existsSync(nodeModulesDir)) {
    console.log('Creating node_modules directory')
    fs.mkdirSync(nodeModulesDir, { recursive: true });
} else {
    console.log('lightweight-charts directory exists')
}

// Copy lightweight-charts directory to node_modules
if (fs.existsSync(nodeModulesDir)) {
    console.log(`Copying from ${lightweightChartsDir} to ${nodeModulesDir}`)
    try {
        // Copy the directory recursively
        fs.cpSync(lightweightChartsDir, nodeModulesDir, { recursive: true });
        console.log('Directory copied successfully');
    } catch (err) {
        console.error('Error copying directory:', err);
    }
}