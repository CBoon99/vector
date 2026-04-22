// Build verification script
console.log('Verifying build configuration...');

// Check webpack configuration
try {
    const webpackConfig = require('../../webpack.config.js');
    console.log('✓ Webpack configuration loaded successfully');
    console.log('  - Entry point:', webpackConfig.entry);
    console.log('  - Output path:', webpackConfig.output.path);
    console.log('  - Plugins:', webpackConfig.plugins.length);
} catch (error) {
    console.error('✗ Webpack configuration error:', error);
}

// Check Netlify configuration
try {
    const fs = require('fs');
    const netlifyConfig = fs.readFileSync('netlify.toml', 'utf-8');
    console.log('✓ Netlify configuration loaded successfully');
    console.log('  - Build command found:', netlifyConfig.includes('npm run build'));
    console.log('  - Publish directory found:', netlifyConfig.includes('dist'));
} catch (error) {
    console.error('✗ Netlify configuration error:', error);
}

// Check static files
try {
    const fs = require('fs');
    const publicDir = 'public';
    const files = fs.readdirSync(publicDir);
    console.log('✓ Static files found:', files);
} catch (error) {
    console.error('✗ Static files error:', error);
}

// Check dependencies
try {
    const packageJson = require('../../package.json');
    console.log('✓ Package.json loaded successfully');
    console.log('  - Dependencies:', Object.keys(packageJson.dependencies).length);
    console.log('  - DevDependencies:', Object.keys(packageJson.devDependencies).length);
} catch (error) {
    console.error('✗ Package.json error:', error);
}

console.log('Build verification complete'); 