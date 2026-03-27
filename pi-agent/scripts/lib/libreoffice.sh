#!/bin/bash
# LePrint Pi Agent - LibreOffice Installation
# Sourced by scripts/install.sh — do not run directly

install_libreoffice() {
    print_section "Installing LibreOffice (Document Conversion)"
    
    if command -v libreoffice &> /dev/null; then
        print_info "LibreOffice already installed"
        print_success "LibreOffice version: $(libreoffice --version 2>&1 | head -n1)"
        return 0
    fi
    
    print_step "Installing LibreOffice (headless)..."
    
    if [ "$PKG_MANAGER" = "pacman" ]; then
        $INSTALL_CMD libreoffice-fresh
    elif [ "$PKG_MANAGER" = "apt" ]; then
        $INSTALL_CMD libreoffice-writer --no-install-recommends
    else
        # DNF / YUM don't accept apt flags
        $INSTALL_CMD libreoffice-writer
    fi
    
    # Verify installation
    if command -v libreoffice &> /dev/null; then
        print_success "LibreOffice installed: $(libreoffice --version | head -n1)"
    else
        print_error "LibreOffice installation failed"
        exit 1
    fi
}
