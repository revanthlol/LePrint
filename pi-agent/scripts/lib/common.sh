#!/bin/bash
# LePrint Pi Agent - Common utilities
# Sourced first by scripts/install.sh

VERSION="1.0.0"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m'

# Emoji
CHECK="${GREEN}✓${NC}"
CROSS="${RED}✗${NC}"
ARROW="${BLUE}→${NC}"
STAR="${YELLOW}★${NC}"

# Print functions
print_header() {
    echo ""
    echo -e "${PURPLE}║${WHITE}  LePrint Pi Agent Setup v${VERSION} "
    echo -e "${PURPLE}║${WHITE}  Universal Installer for All Linux Distros"
    echo ""
}

print_section() {
    echo ""
    echo -e "${CYAN}═══════════════ $1 ═══════════════${NC}"
    echo ""
}

print_success() {
    echo -e "${CHECK} $1"
}

print_error() {
    echo -e "${CROSS} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC}  $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC}  $1"
}

print_step() {
    echo -e "${ARROW} $1"
}

has_systemd() {
    command -v systemctl &> /dev/null
}

detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        OS_VERSION=$VERSION_ID
        OS_NAME=$NAME
    elif [ -f /etc/arch-release ]; then
        OS="arch"
        OS_NAME="Arch Linux"
    else
        OS="unknown"
        OS_NAME="Unknown"
    fi
    
    # Detect package manager
    if command -v pacman &> /dev/null; then
        PKG_MANAGER="pacman"
        INSTALL_CMD="sudo pacman -S --noconfirm"
        UPDATE_CMD="sudo pacman -Sy"
    elif command -v apt-get &> /dev/null; then
        PKG_MANAGER="apt"
        INSTALL_CMD="sudo apt-get install -y"
        UPDATE_CMD="sudo apt-get update"
    elif command -v dnf &> /dev/null; then
        PKG_MANAGER="dnf"
        INSTALL_CMD="sudo dnf install -y"
        UPDATE_CMD="sudo dnf check-update"
    elif command -v yum &> /dev/null; then
        PKG_MANAGER="yum"
        INSTALL_CMD="sudo yum install -y"
        UPDATE_CMD="sudo yum check-update"
    else
        PKG_MANAGER="unknown"
    fi
}

check_root() {
    if [ "$EUID" -eq 0 ]; then
        print_warning "Please don't run as root. Run as normal user with sudo access."
        exit 1
    fi
}

check_sudo() {
    if ! sudo -n true 2>/dev/null; then
        print_info "This script requires sudo access."
        sudo -v
    fi
}

update_system() {
    print_section "Updating System"
    print_step "Running system update..."
    
    if [ "$PKG_MANAGER" = "pacman" ]; then
        $UPDATE_CMD
    else
        $UPDATE_CMD
    fi
    
    print_success "System updated"
}
