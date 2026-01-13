/**
 * Architecture Migration Audit Script
 * 
 * This script audits the codebase to ensure it follows the documented
 * multi-tenancy architecture patterns.
 * 
 * Run with: ts-node scripts/architecture-migration-audit.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface AuditResult {
  file: string;
  issues: string[];
  compliant: boolean;
}

const results: AuditResult[] = [];

// Directories to audit
const ENTITIES_DIR = 'src/database/entities';
const SERVICES_DIR = 'src';
const CONTROLLERS_DIR = 'src';
const DTOS_DIR = 'src';

/**
 * Audit Entity Files
 */
function auditEntities(): void {
  console.log('\n📋 Auditing Entities...\n');
  
  const entityFiles = glob.sync(`${ENTITIES_DIR}/*.entity.ts`);
  
  entityFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    const issues: string[] = [];
    
    // Skip non-tenant entities
    if (content.includes('@Entity(\'users\')') || 
        content.includes('@Entity(\'organizations\')') ||
        content.includes('@Entity(\'apps\')') ||
        content.includes('@Entity(\'packages\')') ||
        content.includes('@Entity(\'permissions\')') ||
        content.includes('@Entity(\'system_settings\')')) {
      return; // Skip platform entities
    }
    
    // Check if entity has organization_id
    if (!content.includes('organization_id')) {
      // Check if it should have organization_id (tenant-aware)
      // Most entities should have it, except platform-level entities
      if (content.includes('@Entity')) {
        // This might be a tenant-aware entity
        // Don't flag as issue automatically - needs manual review
      }
    } else {
      // Entity has organization_id, check for proper patterns
      
      // Check for @Index on organization_id
      if (!content.includes('@Index([\'organization_id\'])') && 
          !content.includes('@Index(["organization_id"])') &&
          !content.includes('@Index([`organization_id`])')) {
        // Check for column-level index
        if (!content.includes('@Index()') || !content.match(/organization_id.*@Index\(\)/s)) {
          issues.push('Missing @Index on organization_id column');
        }
      }
      
      // Check for proper column type
      if (!content.includes('@Column({ type: \'uuid\' })') && 
          !content.includes('@Column({ type: "uuid" })')) {
        const orgIdMatch = content.match(/organization_id[\s\S]{0,200}@Column\([^)]+\)/);
        if (orgIdMatch && !orgIdMatch[0].includes('uuid')) {
          issues.push('organization_id should be type uuid');
        }
      }
      
      // Check for ManyToOne relationship with CASCADE
      if (content.includes('@ManyToOne') && content.includes('organization_id')) {
        if (!content.match(/@ManyToOne[^}]*onDelete:\s*['"]CASCADE['"]/s)) {
          issues.push('Organization relationship should have onDelete: \'CASCADE\'');
        }
      }
    }
    
    if (issues.length > 0) {
      results.push({ file, issues, compliant: false });
      console.log(`❌ ${path.basename(file)}`);
      issues.forEach(issue => console.log(`   - ${issue}`));
    } else if (content.includes('organization_id')) {
      results.push({ file, issues: [], compliant: true });
      console.log(`✅ ${path.basename(file)}`);
    }
  });
}

/**
 * Audit Service Files
 */
function auditServices(): void {
  console.log('\n📋 Auditing Services...\n');
  
  const serviceFiles = glob.sync(`${SERVICES_DIR}/**/*.service.ts`);
  
  serviceFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    const issues: string[] = [];
    
    // Skip if not a tenant-aware service
    if (!content.includes('organization_id') && !content.includes('organizationId')) {
      return;
    }
    
    // Check for methods that should accept organizationId
    const createMethods = content.match(/async\s+create\([^)]+\)/g) || [];
    const findAllMethods = content.match(/async\s+findAll\([^)]+\)/g) || [];
    const findOneMethods = content.match(/async\s+findOne\([^)]+\)/g) || [];
    
    [...createMethods, ...findAllMethods, ...findOneMethods].forEach(method => {
      if (!method.includes('organizationId') && !method.includes('organization_id')) {
        issues.push(`Method should accept organizationId parameter: ${method}`);
      }
    });
    
    // Check for queries that don't filter by organization_id
    if (content.includes('.find(') || content.includes('.findOne(')) {
      const findQueries = content.match(/\.find\([^)]+\)|\.findOne\([^)]+\)/g) || [];
      findQueries.forEach(query => {
        if (!query.includes('organization_id') && !query.includes('organizationId')) {
          // This might be an issue, but could be a valid non-tenant query
          // Only flag if it's in a method that accepts organizationId
          const methodMatch = content.substring(0, content.indexOf(query)).match(/async\s+\w+\([^)]*organizationId/);
          if (methodMatch) {
            issues.push(`Query should filter by organization_id: ${query.substring(0, 50)}...`);
          }
        }
      });
    }
    
    if (issues.length > 0) {
      results.push({ file, issues, compliant: false });
      console.log(`❌ ${path.basename(file)}`);
      issues.forEach(issue => console.log(`   - ${issue}`));
    } else {
      results.push({ file, issues: [], compliant: true });
      console.log(`✅ ${path.basename(file)}`);
    }
  });
}

/**
 * Audit Controller Files
 */
function auditControllers(): void {
  console.log('\n📋 Auditing Controllers...\n');
  
  const controllerFiles = glob.sync(`${CONTROLLERS_DIR}/**/*.controller.ts`);
  
  controllerFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    const issues: string[] = [];
    
    // Skip if controller doesn't handle tenant-aware resources
    if (!content.includes('organization') && !content.includes('Organization')) {
      return;
    }
    
    // Check for @UseGuards(JwtAuthGuard)
    if (!content.includes('@UseGuards(JwtAuthGuard)') && 
        !content.includes('@UseGuards') ||
        content.includes('@Controller') && !content.includes('@UseGuards')) {
      issues.push('Controller should use @UseGuards(JwtAuthGuard)');
    }
    
    // Check for @CurrentOrganization decorator
    const routeMethods = content.match(/@(Get|Post|Put|Delete|Patch)\([^)]*\)/g) || [];
    const hasOrganizationParams = content.includes('organizationId') || content.includes('organization_id');
    
    if (hasOrganizationParams && routeMethods.length > 0) {
      if (!content.includes('@CurrentOrganization')) {
        issues.push('Controller methods should use @CurrentOrganization decorator');
      }
    }
    
    if (issues.length > 0) {
      results.push({ file, issues, compliant: false });
      console.log(`❌ ${path.basename(file)}`);
      issues.forEach(issue => console.log(`   - ${issue}`));
    } else {
      results.push({ file, issues: [], compliant: true });
      console.log(`✅ ${path.basename(file)}`);
    }
  });
}

/**
 * Audit DTO Files
 */
function auditDTOs(): void {
  console.log('\n📋 Auditing DTOs...\n');
  
  const dtoFiles = glob.sync(`${DTOS_DIR}/**/*.dto.ts`);
  
  dtoFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    const issues: string[] = [];
    
    // Check for organization_id in DTOs
    if (content.includes('organization_id') || content.includes('organizationId')) {
      // Check if it's in a Create or Update DTO
      if (content.includes('Create') || content.includes('Update')) {
        issues.push('DTO should not include organization_id (comes from JWT token)');
      }
    }
    
    if (issues.length > 0) {
      results.push({ file, issues, compliant: false });
      console.log(`❌ ${path.basename(file)}`);
      issues.forEach(issue => console.log(`   - ${issue}`));
    } else {
      results.push({ file, issues: [], compliant: true });
    }
  });
}

/**
 * Generate Summary Report
 */
function generateReport(): void {
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 AUDIT SUMMARY');
  console.log('='.repeat(80) + '\n');
  
  const total = results.length;
  const compliant = results.filter(r => r.compliant).length;
  const nonCompliant = results.filter(r => !r.compliant).length;
  
  console.log(`Total Files Audited: ${total}`);
  console.log(`✅ Compliant: ${compliant}`);
  console.log(`❌ Non-Compliant: ${nonCompliant}\n`);
  
  if (nonCompliant > 0) {
    console.log('Non-Compliant Files:\n');
    results.filter(r => !r.compliant).forEach(result => {
      console.log(`📄 ${result.file}`);
      result.issues.forEach(issue => {
        console.log(`   - ${issue}`);
      });
      console.log('');
    });
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ Audit Complete!');
  console.log('='.repeat(80) + '\n');
  
  // Write report to file
  const reportPath = 'architecture-audit-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`📄 Detailed report saved to: ${reportPath}\n`);
}

// Run audits
console.log('🔍 Starting Architecture Compliance Audit...\n');
console.log('='.repeat(80));

auditEntities();
auditServices();
auditControllers();
auditDTOs();
generateReport();

