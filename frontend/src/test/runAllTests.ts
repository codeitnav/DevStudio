#!/usr/bin/env node

/**
 * Comprehensive test runner for DevStudio Frontend
 * 
 * This script runs all types of tests in sequence:
 * 1. Unit tests (services, utilities, hooks)
 * 2. Component tests (React components)
 * 3. Integration tests (authentication, room workflows)
 * 4. End-to-end tests (complete user journeys)
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

interface TestSuite {
  name: string;
  command: string;
  description: string;
  required: boolean;
}

const testSuites: TestSuite[] = [
  {
    name: 'Unit Tests',
    command: 'npm run test:run -- --reporter=verbose',
    description: 'Running unit tests for services, utilities, and hooks',
    required: true,
  },
  {
    name: 'Coverage Report',
    command: 'npm run test:coverage',
    description: 'Generating test coverage report',
    required: false,
  },
  {
    name: 'Integration Tests',
    command: 'npm run test:integration',
    description: 'Running integration tests for authentication and room workflows',
    required: true,
  },
  {
    name: 'End-to-End Tests',
    command: 'npm run test:e2e',
    description: 'Running end-to-end tests with Playwright',
    required: false, // E2E tests require the dev server to be running
  },
];

interface TestResult {
  name: string;
  success: boolean;
  duration: number;
  error?: string;
}

class TestRunner {
  private results: TestResult[] = [];
  private startTime = Date.now();

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting comprehensive test suite for DevStudio Frontend\n');

    // Check if required dependencies are installed
    this.checkDependencies();

    for (const suite of testSuites) {
      await this.runTestSuite(suite);
    }

    this.printSummary();
  }

  private checkDependencies(): void {
    console.log('📋 Checking test dependencies...');
    
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (!existsSync(packageJsonPath)) {
      throw new Error('package.json not found. Please run this script from the frontend directory.');
    }

    const requiredDeps = [
      'vitest',
      '@testing-library/react',
      '@testing-library/jest-dom',
      '@playwright/test',
    ];

    try {
      const packageJson = require(packageJsonPath);
      const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      for (const dep of requiredDeps) {
        if (!allDeps[dep]) {
          console.warn(`⚠️  Warning: ${dep} not found in dependencies`);
        }
      }
    } catch (error) {
      console.warn('⚠️  Could not verify dependencies');
    }

    console.log('✅ Dependency check complete\n');
  }

  private async runTestSuite(suite: TestSuite): Promise<void> {
    console.log(`🧪 ${suite.description}...`);
    const startTime = Date.now();

    try {
      // Special handling for E2E tests
      if (suite.name === 'End-to-End Tests') {
        console.log('   Note: E2E tests require the development server to be running');
        console.log('   Run "npm run dev" in a separate terminal before running E2E tests');
      }

      execSync(suite.command, { 
        stdio: 'inherit',
        cwd: process.cwd(),
        timeout: 300000, // 5 minutes timeout
      });

      const duration = Date.now() - startTime;
      this.results.push({
        name: suite.name,
        success: true,
        duration,
      });

      console.log(`✅ ${suite.name} completed successfully (${this.formatDuration(duration)})\n`);
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.results.push({
        name: suite.name,
        success: false,
        duration,
        error: errorMessage,
      });

      if (suite.required) {
        console.error(`❌ ${suite.name} failed (${this.formatDuration(duration)})`);
        console.error(`   Error: ${errorMessage}\n`);
        
        // Don't exit immediately, continue with other tests
      } else {
        console.warn(`⚠️  ${suite.name} failed (${this.formatDuration(duration)})`);
        console.warn(`   Error: ${errorMessage}`);
        console.warn('   This test suite is optional and will not fail the build\n');
      }
    }
  }

  private printSummary(): void {
    const totalDuration = Date.now() - this.startTime;
    const successful = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    const requiredFailed = this.results.filter(r => !r.success && this.isRequired(r.name)).length;

    console.log('📊 Test Summary');
    console.log('================');
    console.log(`Total test suites: ${this.results.length}`);
    console.log(`Successful: ${successful}`);
    console.log(`Failed: ${failed}`);
    console.log(`Total duration: ${this.formatDuration(totalDuration)}\n`);

    // Detailed results
    console.log('📋 Detailed Results:');
    for (const result of this.results) {
      const status = result.success ? '✅' : '❌';
      const duration = this.formatDuration(result.duration);
      console.log(`   ${status} ${result.name} (${duration})`);
      
      if (!result.success && result.error) {
        console.log(`      Error: ${result.error}`);
      }
    }

    console.log('\n🎯 Test Coverage:');
    console.log('   - Unit Tests: Services, utilities, hooks, and components');
    console.log('   - Integration Tests: Authentication and room workflows');
    console.log('   - End-to-End Tests: Complete user journeys');

    console.log('\n📈 Next Steps:');
    if (requiredFailed > 0) {
      console.log('   - Fix failing required tests before deploying');
      console.log('   - Review test coverage report for gaps');
      process.exit(1);
    } else {
      console.log('   - All required tests passing! 🎉');
      console.log('   - Review coverage report to identify areas for improvement');
      console.log('   - Consider adding more edge case tests');
      
      if (failed > 0) {
        console.log('   - Optional tests failed - consider fixing for better coverage');
      }
    }
  }

  private isRequired(testName: string): boolean {
    const suite = testSuites.find(s => s.name === testName);
    return suite?.required ?? false;
  }

  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  }
}

// Run the tests if this script is executed directly
if (require.main === module) {
  const runner = new TestRunner();
  runner.runAllTests().catch((error) => {
    console.error('💥 Test runner failed:', error);
    process.exit(1);
  });
}

export { TestRunner };