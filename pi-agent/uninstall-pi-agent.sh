#!/bin/bash
# LePrint Pi Agent - Complete Uninstallation Script
# Removes LePrint Pi Agent components but keeps system packages (Node.js, CUPS, etc.)

set -e

VERSION="1.0.0"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m'

print_header() {
  echo ""
  echo -e "${RED}╔════════════════════════════════════════════════╗${NC}"
  echo -e "${RED}║${WHITE}  LePrint - Complete Uninstallation            ${RED}║${NC}"
  echo -e "${RED}║${WHITE}  Version ${VERSION}                                ${RED}║${NC}"
  echo -e "${RED}╚════════════════════════════════════════════════╝${NC}"
  echo ""
}

print_section() {
  echo ""
  echo -e "${CYAN}═══════════════ $1 ═══════════════${NC}"
  echo ""
}

print_success() {
  echo -e "${GREEN}✓${NC} $1"
}

print_error() {
  echo -e "${RED}✗${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}⚠${NC}  $1"
}

print_info() {
  echo -e "${CYAN}ℹ${NC}  $1"
}

print_step() {
  echo -e "${CYAN}→${NC} $1"
}

# Check if running as root
check_root() {
  if [ "$EUID" -eq 0 ]; then
    print_warning "Please don't run as root. Run as normal user with sudo access."
    exit 1
  fi
}

# Confirmation
confirm_uninstall() {
  print_section "What Will Be Removed"

  echo "This script will remove:"
  echo ""
  echo -e "  ${RED}✗${NC} LePrint pi-agent installation"
  echo -e "  ${RED}✗${NC} Agent installation directory (~/LePrint-agent)"
  echo -e "  ${RED}✗${NC} Systemd services (LePrint-agent, LePrint-qr)"
  echo -e "  ${RED}✗${NC} Service configuration files"
  echo -e "  ${RED}✗${NC} Print queue files and temporary data"
  echo -e "  ${RED}✗${NC} Environment configuration (.env files)"
  echo ""
  echo -e "This script will ${GREEN}KEEP${NC}:"
  echo ""
  echo -e "  ${GREEN}✓${NC} Node.js"
  echo -e "  ${GREEN}✓${NC} Git"
  echo -e "  ${GREEN}✓${NC} CUPS (printing system)"
  echo -e "  ${GREEN}✓${NC} LibreOffice"
  echo -e "  ${GREEN}✓${NC} ImageMagick"
  echo -e "  ${GREEN}✓${NC} All system packages and dependencies"
  echo ""

  read -p "Continue with uninstallation? (y/n): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Uninstallation cancelled."
    exit 0
  fi
}

# Stop services
stop_services() {
  print_section "Stopping Services"

  local services=("LePrint-agent" "LePrint-qr" "directprint-agent" "directprint-qr")
  for service in "${services[@]}"; do
    if systemctl is-active --quiet "$service" 2>/dev/null; then
      print_step "Stopping ${service} service..."
      sudo systemctl stop "$service"
      print_success "Stopped ${service}"
    fi
  done
}

# Disable services
disable_services() {
  print_section "Disabling Services"

  local services=("LePrint-agent" "LePrint-qr" "directprint-agent" "directprint-qr")
  for service in "${services[@]}"; do
    if systemctl is-enabled --quiet "$service" 2>/dev/null; then
      print_step "Disabling ${service}..."
      sudo systemctl disable "$service"
      print_success "Disabled ${service}"
    fi
  done
}

# Remove service files
remove_service_files() {
  print_section "Removing Service Files"

  local service_files=(
    "/etc/systemd/system/LePrint-agent.service"
    "/etc/systemd/system/LePrint-qr.service"
    "/etc/systemd/system/directprint-agent.service"
    "/etc/systemd/system/directprint-qr.service"
  )

  for service_file in "${service_files[@]}"; do
    if [ -f "$service_file" ]; then
      print_step "Removing $(basename "$service_file")..."
      sudo rm "$service_file"
      print_success "Removed $service_file"
    fi
  done

  # Reload systemd
  print_step "Reloading systemd daemon..."
  sudo systemctl daemon-reload
  print_success "Systemd reloaded"
}

# Backup configuration
backup_config() {
  print_section "Backing Up Configuration"

  BACKUP_DIR="$HOME/leprint-backup-latest"

  # Check for .env files in various locations
  local found_config=false

  for dir in "$HOME/LePrint-agent" "$HOME/directprint-agent" "/opt/LePrint" "/opt/directprint" "$HOME/directprint"; do
    if [ -f "$dir/.env" ]; then
      if [ "$found_config" = false ]; then
        rm -rf "$BACKUP_DIR"
        mkdir -p "$BACKUP_DIR"
        found_config=true
      fi

      cp "$dir/.env" "$BACKUP_DIR/env-$(basename $dir).backup"
      print_info "Backed up .env from $dir"
    fi
  done

  if [ "$found_config" = true ]; then
    print_success "Configuration backed up to: $BACKUP_DIR"
    echo ""
    print_warning "Save this location if you want to restore settings later:"
    echo -e "          ${CYAN}$BACKUP_DIR${NC}"
    echo ""
  else
    print_info "No configuration files found to backup"
  fi
}

# Remove installation directories
remove_directories() {
  print_section "Removing Installation Directories"

  # List of possible installation directories
  local dirs=(
    "$HOME/LePrint-agent"
    "$HOME/directprint-agent"
    "$HOME/directprint"
    "/opt/LePrint"
    "/opt/directprint"
  )

  for dir in "${dirs[@]}"; do
    if [ -d "$dir" ]; then
      print_step "Removing $dir..."
      if [[ "$dir" == /opt/* ]]; then
        sudo rm -rf "$dir"
      else
        rm -rf "$dir"
      fi
      print_success "Removed $dir"
    fi
  done
}

# Clean up temporary files
cleanup_temp_files() {
  print_section "Cleaning Up Temporary Files"

  # Remove print queue files
  local temp_dirs=(
    "$HOME/LePrint-agent/print-queue"
    "$HOME/directprint-agent/print-queue"
    "/tmp/leprint*"
    "/tmp/directprint*"
    "/tmp/print-queue*"
  )

  for dir in "${temp_dirs[@]}"; do
    if [ -d "$dir" ] || [ -f "$dir" ]; then
      print_step "Removing temporary files: $dir"
      rm -rf $dir
      print_success "Cleaned up temporary files"
    fi
  done
}

# Remove user from lpadmin group (optional)
remove_user_group() {
  print_section "User Group Cleanup (Optional)"

  if groups $USER | grep -q lpadmin; then
    echo ""
    print_warning "Your user is in the 'lpadmin' group (for CUPS printer management)."
    echo -e "This was likely added by the LePrint installer."
    echo ""
    read -p "Remove user from lpadmin group? (y/n): " -n 1 -r
    echo

    if [[ $REPLY =~ ^[Yy]$ ]]; then
      sudo gpasswd -d $USER lpadmin
      echo -e "Removed $USER from lpadmin group"
      echo -e "You may need to log out and back in for this to take effect"
    else
      echo -e "Keeping user in lpadmin group"
    fi
  else
    echo -e "User not in lpadmin group, nothing to do"
  fi
}

# Check for orphaned processes
check_orphaned_processes() {
  echo ""
  echo -e "${YELLOW}Checking for Running Processes${NC}"

  # Check for any running node processes related to LePrint / pi-agent
  local processes=$(ps aux | grep -i "leprint\|directprint\|pi-agent\|qr-server" | grep -v grep | grep -v uninstall)

  if [ -n "$processes" ]; then
    print_warning "Found running LePrint/DirectPrint processes:"
    echo "$processes"
    echo ""
    read -p "Kill these processes? (y/n): " -n 1 -r
    echo

    if [[ $REPLY =~ ^[Yy]$ ]]; then
      pkill -f "leprint" || true
      pkill -f "directprint" || true
      pkill -f "pi-agent" || true
      pkill -f "qr-server" || true
      print_success "Killed related processes"
    fi
  else
    print_info "No orphaned processes found"
  fi
}

# Remove old Sharp installation (if exists)
cleanup_old_dependencies() {
  print_section "Cleaning Up Old Dependencies"

  # Check for old installations that used Sharp
  for dir in "$HOME/directprint-agent" "$HOME/directprint"; do
    if [ -d "$dir/node_modules/sharp" ]; then
      print_info "Found old Sharp dependency in $dir"
      print_info "This will be removed with the directory"
    fi
  done

  print_info "npm packages will be removed with installation directories"
}

# Show final status
show_completion() {
  print_section "Uninstallation Complete"

  echo -e "${GREEN}✓${NC} LePrint Pi Agent has been removed!"
  echo ""
  echo -e "What was removed:"
  echo -e "  ${RED}✗${NC} All LePrint agent code and files"
  echo -e "  ${RED}✗${NC} Systemd services"
  echo -e "  ${RED}✗${NC} Temporary and cache files"
  echo ""
  echo -e "What was kept (system packages):"
  echo -e "  ${GREEN}✓${NC} Node.js"
  echo -e "  ${GREEN}✓${NC} CUPS"
  echo -e "  ${GREEN}✓${NC} LibreOffice"
  echo -e "  ${GREEN}✓${NC} All other system dependencies"
  echo ""

  # Check if backup was created
  if [ -d "$BACKUP_DIR" ]; then
    print_info "Configuration backup saved to:"
    echo -e "    ${CYAN}$BACKUP_DIR${NC}"
    echo ""
  fi

  print_warning "To reinstall LePrint Pi Agent, run: ./setup.sh"
  echo ""

  echo -e "${RED}╔════════════════════════════════════════════════╗${NC}"
  echo -e "${RED}║${WHITE}  Uninstallation Complete! 👋                   ${RED}║${NC}"
  echo -e "${RED}╚════════════════════════════════════════════════╝${NC}"
  echo ""
}

# Optional: Remove system packages
inform_user() {
  echo "LePrint used these system packages:"
  echo ""
  echo "  • LibreOffice (document conversion)"
  echo "  • CUPS (printing system)"
  echo "  • ImageMagick (image processing)"
  echo ""
  echo "These packages are not removed , because they are used by the linux system and are still useful for you"
  echo ""
  echo "If you want to remove them, run:"
  echo "  sudo apt-get purge libreoffice* cups* imagemagick*"
  echo ""

}

# Main execution
main() {
  print_header

  check_root
  confirm_uninstall

  stop_services
  disable_services
  remove_service_files
  backup_config
  check_orphaned_processes
  cleanup_temp_files
  cleanup_old_dependencies
  remove_directories
  remove_user_group
  show_completion
  inform_user
  echo ""
  print_success "All done! System is clean."
  echo ""
}

# Error handling
trap 'echo -e "\n${RED}Error during uninstallation!${NC}\n"; exit 1' ERR

# Run uninstallation
main "$@"
