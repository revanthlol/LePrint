#!/bin/bash
# LePrint Pi Agent - Agent Setup
# Sourced by scripts/install.sh — do not run directly

DEFAULT_CLOUD_URL="https://justpri.duckdns.org"
DEFAULT_FRONTEND_URL="https://leprint.in"

upsert_env_var() {
    local key="$1"
    local value="$2"

    if [ -f ".env" ] && grep -qE "^${key}=" .env; then
        sed -i "s|^${key}=.*|${key}=${value}|" .env
    else
        echo "${key}=${value}" >> .env
    fi
}

enforce_env_defaults() {
    if [ ! -f ".env" ]; then
        return 0
    fi

    # Always enforce LePrint production endpoints (no prompts).
    upsert_env_var "CLOUD_URL" "${DEFAULT_CLOUD_URL}"
    upsert_env_var "FRONTEND_URL" "${DEFAULT_FRONTEND_URL}"

    # Ensure essentials exist (don't overwrite user-specific values if present).
    if ! grep -qE "^KIOSK_ID=" .env; then
        local default_kiosk_id
        default_kiosk_id="$(id -un 2>/dev/null || echo "${USER:-kiosk_1}")"
        upsert_env_var "KIOSK_ID" "${default_kiosk_id}"
    fi
    if ! grep -qE "^PRINTER_NAME=" .env; then
        upsert_env_var "PRINTER_NAME" "auto"
    fi
    if ! grep -qE "^POLL_INTERVAL=" .env; then
        upsert_env_var "POLL_INTERVAL" "5000"
    fi
    if ! grep -qE "^QR_SERVER_PORT=" .env; then
        upsert_env_var "QR_SERVER_PORT" "3000"
    fi
}

generate_env_file() {
    print_step "Creating .env configuration..."
    echo ""
    echo -e "${WHITE}Configuration:${NC}"
    echo ""

    CLOUD_URL="$DEFAULT_CLOUD_URL"
    FRONTEND_URL="$DEFAULT_FRONTEND_URL"

    print_info "Backend URL: ${CLOUD_URL}"
    print_info "Frontend URL: ${FRONTEND_URL}"
    echo ""

    DEFAULT_KIOSK_ID="$(id -un 2>/dev/null || echo "${USER:-kiosk_1}")"
    read -p "Kiosk ID for printer detection (default: ${DEFAULT_KIOSK_ID}): " KIOSK_ID
    KIOSK_ID=${KIOSK_ID:-$DEFAULT_KIOSK_ID}

    read -p "Printer name -(leave blank for auto-detect): " PRINTER_NAME
    PRINTER_NAME=${PRINTER_NAME:-auto}

    cat > .env << EOF
# Cloud Backend
CLOUD_URL=$CLOUD_URL

# Frontend URL for QR code
FRONTEND_URL=$FRONTEND_URL

# Kiosk Configuration
KIOSK_ID=$KIOSK_ID
PRINTER_NAME=$PRINTER_NAME

# Polling Configuration
POLL_INTERVAL=5000

# QR Server
QR_SERVER_PORT=3000
EOF

    enforce_env_defaults
    print_success "Configuration saved to .env"
}

cleanup_legacy_services() {
    if ! has_systemd; then
        return 0
    fi

    print_section "Cleaning Up Legacy Services"

    local legacy_units=("directprint-agent" "directprint-qr")
    local legacy_files=(
        "/etc/systemd/system/directprint-agent.service"
        "/etc/systemd/system/directprint-qr.service"
    )

    for unit in "${legacy_units[@]}"; do
        if systemctl is-active --quiet "$unit" 2>/dev/null; then
            print_step "Stopping legacy service: ${unit}"
            sudo systemctl stop "$unit" || true
            print_success "Stopped ${unit}"
        fi

        if systemctl is-enabled --quiet "$unit" 2>/dev/null; then
            print_step "Disabling legacy service: ${unit}"
            sudo systemctl disable "$unit" || true
            print_success "Disabled ${unit}"
        fi
    done

    for file in "${legacy_files[@]}"; do
        if [ -f "$file" ]; then
            print_step "Removing legacy unit file: $(basename "$file")"
            sudo rm -f "$file"
            print_success "Removed $file"
        fi
    done

    sudo systemctl daemon-reload || true
    print_success "Legacy cleanup complete"
}

setup_pi_agent() {
    print_section "Setting Up Pi Agent"

    # Define installation directory
    INSTALL_DIR="$HOME/LePrint-agent"
    
    # Check if already installed
    if [ -d "$INSTALL_DIR" ]; then
        print_info "LePrint agent already installed at: $INSTALL_DIR"
        echo ""
        read -p "Update existing installation? (y/n): " -n 1 -r
        echo

        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_step "Updating pi-agent code..."
            cd "$INSTALL_DIR" || { print_error "Failed to cd into $INSTALL_DIR"; exit 1; }

            # Backup current .env
            if [ -f ".env" ]; then
                rm -f .env.backup
                cp .env .env.backup
                print_info "Backed up .env file"
            fi

            # --- Smart Update Logic: sparse-checkout only pi-agent/ ---
            TMP_DIR="$(mktemp -d)"
            print_step "Cloning LePrint repo (sparse: pi-agent/ only)..."

            git clone --depth 1 --filter=blob:none --sparse \
                https://github.com/revanthlol/leprint.git "$TMP_DIR" || {
                print_error "Git clone failed"
                rm -rf "$TMP_DIR"
                exit 1
            }

            cd "$TMP_DIR" && git sparse-checkout set pi-agent && cd "$INSTALL_DIR"

            # Copy updated pi-agent files into install dir
            if [ -d "$TMP_DIR/pi-agent" ]; then
                print_info "Syncing pi-agent files..."
                cp -rf "$TMP_DIR/pi-agent/"* . 2>/dev/null || true
                cp -rf "$TMP_DIR/pi-agent/".* . 2>/dev/null || true
            else
                print_error "pi-agent/ directory not found in cloned repo"
                rm -rf "$TMP_DIR"
                exit 1
            fi

            rm -rf "$TMP_DIR"
            # ----------------------------------------

            # Restore .env
            if [ -f ".env.backup" ]; then
                mv .env.backup .env
                print_info "Restored .env file"
            fi
            enforce_env_defaults

            # Update dependencies
            print_step "Updating dependencies..."
            npm install
            print_success "Pi agent updated!"

            # Restart services if running (optional)
            if systemctl is-active --quiet LePrint-agent 2>/dev/null; then
                echo ""
                read -p "Restart LePrint-agent service now? (y/n): " -n 1 -r
                echo
                if [[ $REPLY =~ ^[Yy]$ ]]; then
                    sudo systemctl restart LePrint-agent
                    print_success "LePrint-agent restarted"
                fi
            fi

            if systemctl is-active --quiet LePrint-qr 2>/dev/null; then
                echo ""
                read -p "Restart LePrint-qr service now? (y/n): " -n 1 -r
                echo
                if [[ $REPLY =~ ^[Yy]$ ]]; then
                    sudo systemctl restart LePrint-qr
                    print_success "LePrint-qr restarted"
                fi
            fi

            # Ask about reconfiguration
            echo ""
            read -p "Reconfigure settings (.env file)? (y/n): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                print_step "Reconfiguring..."
                rm -f .env
                generate_env_file
            fi

            PI_AGENT_DIR="$INSTALL_DIR"
            return 0
        else
            print_info "Skipping update, keeping existing installation."
            PI_AGENT_DIR="$INSTALL_DIR"
            return 0
        fi
    fi

    # ----- Fresh installation flow -----
    print_step "Installing pi-agent..."

    mkdir -p "$INSTALL_DIR"
    cd "$INSTALL_DIR" || { print_error "Failed to cd into $INSTALL_DIR"; exit 1; }

    print_step "Cloning LePrint repo (sparse: pi-agent/ only)..."

    TMP_DIR="$(mktemp -d)"
    git clone --depth 1 --filter=blob:none --sparse \
        https://github.com/revanthlol/leprint.git "$TMP_DIR" || {
        print_error "Git clone failed"
        rm -rf "$TMP_DIR"
        exit 1
    }

    cd "$TMP_DIR" && git sparse-checkout set pi-agent && cd "$INSTALL_DIR"

    if [ -d "$TMP_DIR/pi-agent" ]; then
        cp -rf "$TMP_DIR/pi-agent/"* . 2>/dev/null || true
        cp -rf "$TMP_DIR/pi-agent/".* . 2>/dev/null || true
    else
        print_error "pi-agent/ directory not found in cloned repo"
        rm -rf "$TMP_DIR"
        exit 1
    fi

    rm -rf "$TMP_DIR"

    print_success "Pi agent downloaded"

    # Install dependencies
    print_step "Installing Node.js dependencies..."
    npm install
    print_success "Dependencies installed"

    # Create .env file
    if [ ! -f ".env" ]; then
        generate_env_file
    else
        print_info ".env file already exists, skipping"
        enforce_env_defaults
    fi

    PI_AGENT_DIR="$INSTALL_DIR"
    print_success "Pi Agent setup complete"
}
