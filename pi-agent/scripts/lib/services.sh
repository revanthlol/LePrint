#!/bin/bash
# LePrint Pi Agent - Service Management & Info
# Sourced by scripts/install.sh — do not run directly

show_system_info() {
    print_section "System Information"
    echo -e "${WHITE}OS:${NC}              $OS_NAME"
    echo -e "${WHITE}Distribution:${NC}    $OS"
    echo -e "${WHITE}Package Manager:${NC} $PKG_MANAGER"
    echo -e "${WHITE}Architecture:${NC}    $(uname -m)"
    echo -e "${WHITE}Kernel:${NC}          $(uname -r)"
    echo ""
}

confirm_install() {
    print_section "Installation Overview"
    echo "This script will install:"
    echo ""
    echo "  1. Node.js (v18.x)"
    echo "  2. CUPS (printing system)"
    echo "  3. LibreOffice (document conversion)"
    echo "  4. ImageMagick (image conversion)"
    echo "  5. LePrint Pi Agent"
    echo "  6. System services (auto-start)"
    echo ""
    
    read -p "Continue with installation? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Installation cancelled."
        exit 0
    fi
}

create_systemd_service() {
    print_section "Creating System Services"
    
    if ! has_systemd; then
        print_warning "systemd not detected; skipping service setup."
        return 0
    fi

    print_step "Creating systemd service..."
    
    sudo tee /etc/systemd/system/LePrint-agent.service > /dev/null <<EOF
[Unit]
Description=LePrint Pi Agent
After=network.target cups.service
Requires=cups.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$PI_AGENT_DIR
ExecStart=/usr/bin/node index.js
Restart=always
RestartSec=10

# Environment
Environment=NODE_ENV=production

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=LePrint-agent

[Install]
WantedBy=multi-user.target
EOF
    
    # Reload systemd
    sudo systemctl daemon-reload
    
    print_success "Service created"
    
    # Ask if user wants to enable auto-start
    echo ""
    read -p "Enable auto-start on boot? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sudo systemctl enable LePrint-agent
        print_success "Auto-start enabled"
    fi
    
    # Ask if user wants to start now
    echo ""
    read -p "Start service now? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sudo systemctl start LePrint-agent
        sleep 2
        sudo systemctl status LePrint-agent --no-pager
        print_success "Service started"
    fi
}

create_qr_service() {
    print_section "QR Display Service (Optional)"
    
    echo "The QR display service runs a web server showing the QR code."
    LOCAL_IP=$(ip route get 1.1.1.1 2>/dev/null | awk '{print $7; exit}' || echo "localhost")
    echo "You can access it at http://${LOCAL_IP}:3000"
    echo ""

    if ! has_systemd; then
        print_warning "systemd not detected; skipping QR service setup."
        return 0
    fi

    if [ -f "/etc/systemd/system/LePrint-qr.service" ] || systemctl list-unit-files 2>/dev/null | awk '{print $1}' | grep -qx "LePrint-qr.service"; then
        print_info "LePrint-qr service already installed; updating and restarting..."
    else
        read -p "Install QR display service? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            return 0
        fi
    fi
    
    print_step "Creating QR service..."
    
    sudo tee /etc/systemd/system/LePrint-qr.service > /dev/null <<EOF
[Unit]
Description=LePrint QR Display Server
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$PI_AGENT_DIR
ExecStart=/usr/bin/node qr-server.js
Restart=always
RestartSec=10

# Environment
Environment=NODE_ENV=production
Environment=QR_SERVER_PORT=3000

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=LePrint-qr

[Install]
WantedBy=multi-user.target
EOF
    
    sudo systemctl daemon-reload
    sudo systemctl enable LePrint-qr || true
    sudo systemctl restart LePrint-qr || sudo systemctl start LePrint-qr
    
    print_success "QR service created and started"
}

show_completion() {
    print_section "Installation Complete!"
    
    echo -e "${GREEN}${CHECK}${NC} LePrint Pi Agent is ready!"
    echo ""
    echo -e "${WHITE}Next Steps:${NC}"
    echo ""
    echo -e "  1. ${ARROW} Check service status:"
    echo -e "     ${CYAN}sudo systemctl status LePrint-agent${NC}"
    echo ""
    echo -e "  2. ${ARROW} View logs:"
    echo -e "     ${CYAN}sudo journalctl -u LePrint-agent -f${NC}"
    echo ""
    echo -e "  3. ${ARROW} Restart service:"
    echo -e "     ${CYAN}sudo systemctl restart LePrint-agent${NC}"
    echo ""
    echo -e "  4. ${ARROW} Restart QR service:"
    echo -e "     ${CYAN}sudo systemctl restart LePrint-qr${NC}"
    echo ""
    echo -e "  5. ${ARROW} QR Code (if enabled):"
    LOCAL_IP=$(ip route get 1.1.1.1 2>/dev/null | awk '{print $7; exit}' || hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost")
    echo -e "     ${CYAN}http://${LOCAL_IP}:3000${NC}"
    echo ""
    
    if [ "$PKG_MANAGER" = "apt" ]; then
        print_warning "You may need to log out and back in for group changes to take effect"
    fi
    
    echo ""
    echo -e "${PURPLE}╔════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║${WHITE}  🎉 Setup Complete! Happy Printing! 🖨️         ${PURPLE}║${NC}"
    echo -e "${PURPLE}╚════════════════════════════════════════════════╝${NC}"
    echo ""
}
