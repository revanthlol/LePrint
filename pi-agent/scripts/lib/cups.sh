#!/bin/bash
# LePrint Pi Agent - CUPS Installation
# Sourced by scripts/install.sh — do not run directly

install_cups() {
    print_section "Installing CUPS (Printing System)"
    
    if command -v lpstat &> /dev/null; then
        print_info "CUPS already installed"
        print_success "CUPS version: $(lpstat -v 2>&1 | head -n1 || echo 'installed')"
        return 0
    fi
    
    print_step "Installing CUPS..."
    
    if [ "$PKG_MANAGER" = "pacman" ]; then
        $INSTALL_CMD cups cups-pdf
    elif [ "$PKG_MANAGER" = "apt" ]; then
        $INSTALL_CMD cups cups-client
    else
        # DNF / YUM
        $INSTALL_CMD cups cups-client
    fi
    
    # Start CUPS service
    print_step "Starting CUPS service..."
    sudo systemctl start cups
    sudo systemctl enable cups
    
    # Add user to lpadmin group (Note: some distros use 'sys' or 'wheel', but lpadmin is standard)
    print_step "Adding user to lpadmin group..."
    sudo usermod -a -G lpadmin $USER || print_warning "Could not add to lpadmin group. You may need to do this manually."
    
    print_success "CUPS installed and running"
}
