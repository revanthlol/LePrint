#!/bin/bash
# LePrint Pi Agent - Image Tools Installation
# Sourced by scripts/install.sh — do not run directly

install_image_tools() {
    print_section "Installing Image Processing Tools"
    
    # Check ImageMagick
    if command -v convert &> /dev/null; then
        print_info "ImageMagick already installed"
        print_success "ImageMagick version: $(convert --version | head -n1)"
    else
        print_step "Installing ImageMagick..."
        
        if [ "$PKG_MANAGER" = "pacman" ]; then
            $INSTALL_CMD imagemagick
        elif [ "$PKG_MANAGER" = "apt" ]; then
            $INSTALL_CMD imagemagick
        else
            # Fedora/RHEL
            $INSTALL_CMD imagemagick
        fi
        
        if command -v convert &> /dev/null; then
            print_success "ImageMagick installed"
        else
            print_error "ImageMagick installation failed"
            exit 1
        fi
    fi
}
