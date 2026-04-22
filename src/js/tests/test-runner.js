import { FeatureTests } from './feature-tests.js';
import { IntegrationTests } from './integration-tests.js';

class TestRunner {
    constructor() {
        try {
            this.featureTests = new FeatureTests();
            this.integrationTests = new IntegrationTests();
            this.results = {
                feature: { passed: 0, failed: 0, total: 0, errors: [] },
                integration: { passed: 0, failed: 0, total: 0, errors: [] }
            };
        } catch (error) {
            console.error('Error initializing TestRunner:', error);
            throw error;
        }
    }

    async runAllTests() {
        console.log('=== Starting Test Suite ===\n');
        
        try {
            // Run feature tests
            console.log('=== Feature Tests ===');
            await this.runFeatureTests();
            
            // Run integration tests
            console.log('\n=== Integration Tests ===');
            await this.runIntegrationTests();
            
            // Print summary
            this.printSummary();
        } catch (error) {
            console.error('Error running tests:', error);
            throw error;
        }
    }

    async runFeatureTests() {
        try {
            const results = await this.featureTests.runAllTests();
            this.results.feature = results;
        } catch (error) {
            console.error('Error running feature tests:', error);
            this.results.feature.errors.push(error);
            throw error;
        }
    }

    async runIntegrationTests() {
        try {
            const results = await this.integrationTests.runAllTests();
            this.results.integration = results;
        } catch (error) {
            console.error('Error running integration tests:', error);
            this.results.integration.errors.push(error);
            throw error;
        }
    }

    printSummary() {
        try {
            console.log('\n=== Test Summary ===');
            
            // Feature Tests Summary
            console.log('\nFeature Tests:');
            console.log(`Total: ${this.results.feature.total}`);
            console.log(`Passed: ${this.results.feature.passed}`);
            console.log(`Failed: ${this.results.feature.failed}`);
            console.log(`Success Rate: ${((this.results.feature.passed / this.results.feature.total) * 100).toFixed(2)}%`);
            
            if (this.results.feature.errors.length > 0) {
                console.log('\nFeature Test Errors:');
                this.results.feature.errors.forEach((error, index) => {
                    console.log(`${index + 1}. ${error.message}`);
                });
            }
            
            // Integration Tests Summary
            console.log('\nIntegration Tests:');
            console.log(`Total: ${this.results.integration.total}`);
            console.log(`Passed: ${this.results.integration.passed}`);
            console.log(`Failed: ${this.results.integration.failed}`);
            console.log(`Success Rate: ${((this.results.integration.passed / this.results.integration.total) * 100).toFixed(2)}%`);
            
            if (this.results.integration.errors.length > 0) {
                console.log('\nIntegration Test Errors:');
                this.results.integration.errors.forEach((error, index) => {
                    console.log(`${index + 1}. ${error.message}`);
                });
            }
            
            // Overall Summary
            const totalTests = this.results.feature.total + this.results.integration.total;
            const totalPassed = this.results.feature.passed + this.results.integration.passed;
            const totalFailed = this.results.feature.failed + this.results.integration.failed;
            
            console.log('\nOverall Summary:');
            console.log(`Total Tests: ${totalTests}`);
            console.log(`Total Passed: ${totalPassed}`);
            console.log(`Total Failed: ${totalFailed}`);
            console.log(`Overall Success Rate: ${((totalPassed / totalTests) * 100).toFixed(2)}%`);
            
            // Test Coverage
            console.log('\nTest Coverage:');
            this.printCoverageReport();
        } catch (error) {
            console.error('Error printing test summary:', error);
            throw error;
        }
    }

    printCoverageReport() {
        try {
            const features = [
                'Undo/Redo System',
                'Text Tool',
                'Bezier/Path Curve Tool',
                'Shape Selection & Resize Handles',
                'Multi-select & Drag',
                'Layer Management UI',
                'Delete Shape',
                'Onboarding/Help Overlay',
                'Tool Feedback'
            ];

            console.log('\nFeature Coverage:');
            features.forEach(feature => {
                const covered = this.isFeatureCovered(feature);
                console.log(`${covered ? '✅' : '❌'} ${feature}`);
            });

            // Print coverage statistics
            const totalFeatures = features.length;
            const coveredFeatures = features.filter(feature => this.isFeatureCovered(feature)).length;
            console.log(`\nCoverage: ${((coveredFeatures / totalFeatures) * 100).toFixed(2)}% (${coveredFeatures}/${totalFeatures} features)`);
        } catch (error) {
            console.error('Error printing coverage report:', error);
            throw error;
        }
    }

    isFeatureCovered(feature) {
        try {
            // Check if feature is covered by tests
            const featureTests = [
                'StateManager initialization',
                'LayerManager initialization',
                'CanvasManager initialization',
                'SelectionTool initialization',
                'TextTool initialization',
                'BezierTool initialization',
                'Layer operations',
                'Tool switching',
                'Layer visibility',
                'Layer groups',
                'Undo/redo functionality',
                'State history',
                'Keyboard shortcuts',
                'Tool buttons',
                'Layer panel'
            ];

            return featureTests.some(test => test.toLowerCase().includes(feature.toLowerCase()));
        } catch (error) {
            console.error('Error checking feature coverage:', error);
            return false;
        }
    }
}

// Run all tests when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        const runner = new TestRunner();
        runner.runAllTests();
    } catch (error) {
        console.error('Error running tests:', error);
    }
}); 