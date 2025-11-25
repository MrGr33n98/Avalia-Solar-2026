#!/bin/bash

# Code Quality Check Script
# Executa todas as análises de qualidade de código localmente

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Emojis
CHECK="✓"
CROSS="✗"
INFO="ℹ"
WARN="⚠"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Code Quality Analysis - AB0-1${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if we're in the root directory
if [ ! -d "AB0-1-back" ] || [ ! -d "AB0-1-front" ]; then
    echo -e "${RED}${CROSS} Error: Must be run from project root${NC}"
    exit 1
fi

# Parse command line arguments
RUN_BACKEND=true
RUN_FRONTEND=true
RUN_SECURITY=true
RUN_TESTS=false
AUTO_FIX=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --backend-only)
            RUN_FRONTEND=false
            shift
            ;;
        --frontend-only)
            RUN_BACKEND=false
            shift
            ;;
        --security-only)
            RUN_BACKEND=false
            RUN_FRONTEND=false
            shift
            ;;
        --with-tests)
            RUN_TESTS=true
            shift
            ;;
        --fix)
            AUTO_FIX=true
            shift
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --backend-only    Run only backend checks"
            echo "  --frontend-only   Run only frontend checks"
            echo "  --security-only   Run only security checks"
            echo "  --with-tests      Include test coverage"
            echo "  --fix             Auto-fix issues when possible"
            echo "  --help            Show this help message"
            exit 0
            ;;
        *)
            echo -e "${RED}${CROSS} Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# Initialize counters
TOTAL_ISSUES=0
BACKEND_ISSUES=0
FRONTEND_ISSUES=0
SECURITY_ISSUES=0

# ============================================
# BACKEND ANALYSIS
# ============================================
if [ "$RUN_BACKEND" = true ]; then
    echo -e "${BLUE}${INFO} Analyzing Backend (Ruby/Rails)...${NC}"
    echo ""
    
    cd AB0-1-back
    
    # RuboCop
    echo -e "${YELLOW}Running RuboCop...${NC}"
    if [ "$AUTO_FIX" = true ]; then
        if bundle exec rubocop -a; then
            echo -e "${GREEN}${CHECK} RuboCop: PASSED (with auto-fixes)${NC}"
        else
            RUBOCOP_ISSUES=$?
            BACKEND_ISSUES=$((BACKEND_ISSUES + RUBOCOP_ISSUES))
            echo -e "${RED}${CROSS} RuboCop: FAILED (${RUBOCOP_ISSUES} issues remaining)${NC}"
        fi
    else
        if bundle exec rubocop; then
            echo -e "${GREEN}${CHECK} RuboCop: PASSED${NC}"
        else
            RUBOCOP_ISSUES=$?
            BACKEND_ISSUES=$((BACKEND_ISSUES + RUBOCOP_ISSUES))
            echo -e "${RED}${CROSS} RuboCop: FAILED (${RUBOCOP_ISSUES} issues)${NC}"
            echo -e "${YELLOW}${INFO} Run with --fix to auto-correct${NC}"
        fi
    fi
    echo ""
    
    # Tests with coverage (optional)
    if [ "$RUN_TESTS" = true ]; then
        echo -e "${YELLOW}Running Backend Tests with Coverage...${NC}"
        if RAILS_ENV=test bundle exec rails test; then
            echo -e "${GREEN}${CHECK} Backend Tests: PASSED${NC}"
            
            # Check coverage
            if [ -f "coverage/.last_run.json" ]; then
                COVERAGE=$(ruby -rjson -e "puts JSON.parse(File.read('coverage/.last_run.json'))['result']['line'].round(2)")
                echo -e "${BLUE}${INFO} Test Coverage: ${COVERAGE}%${NC}"
                
                if (( $(echo "$COVERAGE < 70" | bc -l) )); then
                    echo -e "${YELLOW}${WARN} Coverage below 70% threshold${NC}"
                fi
            fi
        else
            echo -e "${RED}${CROSS} Backend Tests: FAILED${NC}"
            BACKEND_ISSUES=$((BACKEND_ISSUES + 1))
        fi
        echo ""
    fi
    
    cd ..
    
    TOTAL_ISSUES=$((TOTAL_ISSUES + BACKEND_ISSUES))
fi

# ============================================
# FRONTEND ANALYSIS
# ============================================
if [ "$RUN_FRONTEND" = true ]; then
    echo -e "${BLUE}${INFO} Analyzing Frontend (Next.js/TypeScript)...${NC}"
    echo ""
    
    cd AB0-1-front
    
    # ESLint
    echo -e "${YELLOW}Running ESLint...${NC}"
    if [ "$AUTO_FIX" = true ]; then
        if npm run lint -- --fix; then
            echo -e "${GREEN}${CHECK} ESLint: PASSED (with auto-fixes)${NC}"
        else
            ESLINT_ISSUES=$?
            FRONTEND_ISSUES=$((FRONTEND_ISSUES + ESLINT_ISSUES))
            echo -e "${RED}${CROSS} ESLint: FAILED (${ESLINT_ISSUES} issues remaining)${NC}"
        fi
    else
        if npm run lint; then
            echo -e "${GREEN}${CHECK} ESLint: PASSED${NC}"
        else
            ESLINT_ISSUES=$?
            FRONTEND_ISSUES=$((FRONTEND_ISSUES + ESLINT_ISSUES))
            echo -e "${RED}${CROSS} ESLint: FAILED${NC}"
            echo -e "${YELLOW}${INFO} Run with --fix to auto-correct${NC}"
        fi
    fi
    echo ""
    
    # TypeScript check
    echo -e "${YELLOW}Checking TypeScript...${NC}"
    if npm run build > /dev/null 2>&1; then
        echo -e "${GREEN}${CHECK} TypeScript: PASSED${NC}"
    else
        echo -e "${RED}${CROSS} TypeScript: FAILED (compilation errors)${NC}"
        FRONTEND_ISSUES=$((FRONTEND_ISSUES + 1))
    fi
    echo ""
    
    # Tests with coverage (optional)
    if [ "$RUN_TESTS" = true ]; then
        echo -e "${YELLOW}Running Frontend Tests with Coverage...${NC}"
        if npm run test:coverage -- --passWithNoTests; then
            echo -e "${GREEN}${CHECK} Frontend Tests: PASSED${NC}"
            
            # Check coverage
            if [ -f "coverage/coverage-summary.json" ]; then
                COVERAGE=$(node -e "console.log(require('./coverage/coverage-summary.json').total.lines.pct)")
                echo -e "${BLUE}${INFO} Test Coverage: ${COVERAGE}%${NC}"
                
                if (( $(echo "$COVERAGE < 60" | bc -l) )); then
                    echo -e "${YELLOW}${WARN} Coverage below 60% threshold${NC}"
                fi
            fi
        else
            echo -e "${RED}${CROSS} Frontend Tests: FAILED${NC}"
            FRONTEND_ISSUES=$((FRONTEND_ISSUES + 1))
        fi
        echo ""
    fi
    
    cd ..
    
    TOTAL_ISSUES=$((TOTAL_ISSUES + FRONTEND_ISSUES))
fi

# ============================================
# SECURITY ANALYSIS
# ============================================
if [ "$RUN_SECURITY" = true ]; then
    echo -e "${BLUE}${INFO} Running Security Scans...${NC}"
    echo ""
    
    cd AB0-1-back
    
    # Brakeman
    echo -e "${YELLOW}Running Brakeman (Security Scanner)...${NC}"
    if bundle exec brakeman -q --no-pager; then
        echo -e "${GREEN}${CHECK} Brakeman: No security issues found${NC}"
    else
        BRAKEMAN_ISSUES=$?
        SECURITY_ISSUES=$((SECURITY_ISSUES + BRAKEMAN_ISSUES))
        echo -e "${RED}${CROSS} Brakeman: Security issues found${NC}"
        echo -e "${YELLOW}${INFO} Run 'cd AB0-1-back && bundle exec brakeman' for details${NC}"
    fi
    echo ""
    
    # Bundler Audit
    echo -e "${YELLOW}Running Bundler Audit...${NC}"
    if bundle exec bundler-audit check --update; then
        echo -e "${GREEN}${CHECK} Bundler Audit: No vulnerable gems${NC}"
    else
        AUDIT_ISSUES=$?
        SECURITY_ISSUES=$((SECURITY_ISSUES + AUDIT_ISSUES))
        echo -e "${RED}${CROSS} Bundler Audit: Vulnerable dependencies found${NC}"
        echo -e "${YELLOW}${INFO} Update affected gems in Gemfile${NC}"
    fi
    echo ""
    
    cd ..
    
    TOTAL_ISSUES=$((TOTAL_ISSUES + SECURITY_ISSUES))
fi

# ============================================
# SUMMARY
# ============================================
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

if [ "$RUN_BACKEND" = true ]; then
    if [ $BACKEND_ISSUES -eq 0 ]; then
        echo -e "${GREEN}${CHECK} Backend: All checks passed${NC}"
    else
        echo -e "${RED}${CROSS} Backend: ${BACKEND_ISSUES} issues found${NC}"
    fi
fi

if [ "$RUN_FRONTEND" = true ]; then
    if [ $FRONTEND_ISSUES -eq 0 ]; then
        echo -e "${GREEN}${CHECK} Frontend: All checks passed${NC}"
    else
        echo -e "${RED}${CROSS} Frontend: ${FRONTEND_ISSUES} issues found${NC}"
    fi
fi

if [ "$RUN_SECURITY" = true ]; then
    if [ $SECURITY_ISSUES -eq 0 ]; then
        echo -e "${GREEN}${CHECK} Security: No issues found${NC}"
    else
        echo -e "${RED}${CROSS} Security: ${SECURITY_ISSUES} issues found${NC}"
    fi
fi

echo ""

if [ $TOTAL_ISSUES -eq 0 ]; then
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  ${CHECK} ALL CHECKS PASSED!${NC}"
    echo -e "${GREEN}========================================${NC}"
    exit 0
else
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}  ${CROSS} TOTAL ISSUES: ${TOTAL_ISSUES}${NC}"
    echo -e "${RED}========================================${NC}"
    echo ""
    echo -e "${YELLOW}${INFO} Tips:${NC}"
    echo -e "  - Run with --fix to auto-correct issues"
    echo -e "  - Run with --with-tests to check coverage"
    echo -e "  - Check docs/CODE_QUALITY.md for details"
    exit 1
fi
