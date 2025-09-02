# Requirements Document

## Introduction

This feature enables accounting administrators to create, register, and edit comprehensive accounting rules that guide AI-powered receipt processing and categorization. The system must handle complex PCA (accounting software) integration rules including account codes, tax calculations, department assignments, and invoice requirements. The rule management system ensures consistent and accurate automated processing of receipt data while maintaining flexibility for rule updates and modifications.

## Requirements

### Requirement 1

**User Story:** As an accounting administrator, I want to create and manage account assignment rules based on expense types and merchant patterns, so that the AI can automatically assign correct account codes directly without using categories.

#### Acceptance Criteria

1. WHEN an administrator accesses the rule management interface THEN the system SHALL display all current account assignment rules organized by debit account codes (724-福利厚生費, 726-旅費交通費, 727-通信費, etc.)
2. WHEN an administrator creates a new account assignment rule THEN the system SHALL require debit account code, account name, auxiliary code (optional for 車両費 and 租税公課 only), auxiliary name (optional), and tax calculation mode
3. WHEN an administrator saves an account assignment rule THEN the system SHALL validate that the rule conditions (expense type patterns, merchant patterns, keywords) are specific enough to avoid conflicts
4. IF an account assignment rule is for 車両費 (729) THEN the system SHALL require auxiliary code selection (001-課税事業者 or 002-免税事業者) based on invoice compliance
5. WHEN the system processes receipt data THEN the AI SHALL use expense type recognition and merchant analysis to directly assign account codes without intermediate category classification

### Requirement 2

**User Story:** As an accounting administrator, I want to configure tax calculation rules based on account codes and invoice compliance, so that the AI can correctly apply tax codes without relying on expense categories.

#### Acceptance Criteria

1. WHEN an administrator defines tax rules THEN the system SHALL support tax codes Q5 (仕入10%), Q6 (仕入8%軽), QD (仕入10%控80), QE (仕入8%軽控80), P0 (非仕入), and 00 (対象外)
2. WHEN a tax rule is created THEN the system SHALL require tax code, tax description, applicable account codes, and invoice compliance requirements
3. WHEN the AI processes receipts THEN the system SHALL automatically assign tax codes based on account code and detected invoice compliance (Q5/Q6 for compliant, QD/QE for non-compliant)
4. IF the assigned account code is 738 (租税公課) THEN the system SHALL automatically assign tax code P0 (非仕入) regardless of other conditions
5. WHEN credit account 111 (現金) is assigned THEN the system SHALL assign tax code 00 (対象外) for the credit side

### Requirement 3

**User Story:** As an accounting administrator, I want to manage department and branch office mappings, so that expenses can be correctly allocated based on the uploading user's department information.

#### Acceptance Criteria

1. WHEN an administrator configures department rules THEN the system SHALL support mapping of department codes to department names for all branch offices
2. WHEN a department mapping is created THEN the system SHALL require both department code and department name
3. WHEN the AI processes receipts THEN the system SHALL automatically assign the department code based on the uploading user's department information
4. WHEN cash account assignments are made THEN the system SHALL automatically assign the corresponding branch office auxiliary code (001-札幌支店, 002-仙台事業所, etc.) based on the user's department
5. WHEN user department information is available THEN the system SHALL use it to determine both the department code and corresponding cash account auxiliary code

### Requirement 4

**User Story:** As an accounting administrator, I want to define transaction description formatting rules based on expense types derived from account assignments, so that all processed receipts have consistent and informative descriptions.

#### Acceptance Criteria

1. WHEN description formatting rules are configured THEN the system SHALL enforce the format "[expense_type ABC株式会社]" where expense_type is derived from the assigned account name and company name follows
2. WHEN the AI processes receipts THEN the system SHALL extract vendor/company names and determine expense type from account assignment (福利厚生費, 旅費交通費, etc.) to populate the description template
3. WHEN a description is generated THEN the system SHALL ensure it includes both the expense type derived from account name (駐車場代, etc.) and the vendor company name
4. IF vendor information cannot be extracted THEN the system SHALL flag the transaction for manual description entry
5. WHEN descriptions are saved THEN the system SHALL validate they follow the required format pattern with expense type matching the assigned account

### Requirement 5

**User Story:** As an accounting administrator, I want to configure data validation and formatting rules, so that all exported data meets PCA software requirements.

#### Acceptance Criteria

1. WHEN date formatting rules are applied THEN the system SHALL convert all transaction dates to YYYYMMDD format
2. WHEN tax amount fields are processed THEN the system SHALL leave tax amount fields blank for internal tax calculation mode
3. WHEN amount fields are processed THEN the system SHALL ensure all amounts include tax (tax-inclusive amounts)
4. WHEN input program classification is set THEN the system SHALL automatically assign value "2" for all transactions
5. WHEN data is exported THEN the system SHALL validate that all required fields are populated according to PCA format specifications

### Requirement 6

**User Story:** As an accounting administrator, I want to edit and update existing rules, so that the system can adapt to changing accounting requirements and business needs.

#### Acceptance Criteria

1. WHEN an administrator selects an existing rule THEN the system SHALL display all current rule parameters in an editable format
2. WHEN rule modifications are made THEN the system SHALL validate that changes maintain data integrity and don't conflict with existing rules
3. WHEN rules are updated THEN the system SHALL apply changes to future transactions while preserving historical transaction integrity
4. IF rule changes affect existing unprocessed transactions THEN the system SHALL offer to reprocess those transactions with updated rules
5. WHEN rule changes are saved THEN the system SHALL log the modification with timestamp and administrator identification

### Requirement 7

**User Story:** As an accounting administrator, I want to validate rule configurations, so that I can ensure the AI will process receipts correctly before deploying rule changes.

#### Acceptance Criteria

1. WHEN rule validation is triggered THEN the system SHALL check for completeness of all required rule categories (accounts, taxes, departments, formatting)
2. WHEN validation runs THEN the system SHALL identify any missing or conflicting rule definitions
3. WHEN validation completes THEN the system SHALL provide a comprehensive report of rule coverage and potential issues
4. IF validation fails THEN the system SHALL prevent rule deployment and highlight specific issues requiring resolution
5. WHEN validation passes THEN the system SHALL allow administrators to activate the rule set for AI processing