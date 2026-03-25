#!/bin/bash
# LePrint Pi Agent - Node.js Installation
# Sourced by scripts/install.sh — do not run directly

install_nodejs() {
    print_section "Installing Node.js"
    
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_info "Node.js already installed: $NODE_VERSION"
        
        # Check if version is acceptable (v16+)
        MAJOR_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$MAJOR_VERSION" -ge 16 ]; then
            print_success "Node.js version is acceptable"
            return 0
        else
            print_warning "Node.js version too old, upgrading..."
        fi
    fi
    
    print_step "Installing Node.js 18.x..."
    
    if [ "$PKG_MANAGER" = "pacman" ]; then
        # Arch Linux
        $INSTALL_CMD nodejs npm git
    elif [ "$PKG_MANAGER" = "apt" ]; then
        # Ubuntu/Debian/Raspberry Pi OS
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        $INSTALL_CMD nodejs git
    elif [ "$PKG_MANAGER" = "dnf" ] || [ "$PKG_MANAGER" = "yum" ]; then
        # Fedora/RHEL
        curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
        $INSTALL_CMD nodejs git
    fi
    
    # Verify installation
    if command -v node &> /dev/null; then
        print_success "Node.js installed: $(node --version)"
    else
        print_error "Node.js installation failed"
        exit 1
    fi
}
