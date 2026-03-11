#!/usr/bin/env bash
# LePrint Pi Agent - Setup Menu
# Choose: Install/Update or Uninstall

set -e

VERSION="1.0.0"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
WHITE='\033[1;37m'
NC='\033[0m'

print_header() {
  echo ""
  echo -e "${PURPLE}║${WHITE}  LePrint Pi Agent Setup"
  echo -e "${PURPLE}║${WHITE}  Version ${VERSION}"
  echo ""
}

print_menu() {
  echo -e "${CYAN}Choose an option:${NC}"
  echo ""
  echo -e "  ${GREEN}1)${NC} Install / Update LePrint Pi Agent"
  echo -e "  ${GREEN}2)${NC} Uninstall LePrint Pi Agent"
  echo -e "  ${YELLOW}3)${NC} Exit"
  echo ""
}

run_install() {
  echo ""
  exec bash "$SCRIPT_DIR/install-or-update-pi-agent.sh"
}

run_uninstall() {
  echo ""
  exec bash "$SCRIPT_DIR/uninstall-pi-agent.sh"
}

main() {
  print_header

  while true; do
    print_menu
    read -r -p "Enter choice [1-3]: " choice
    case "${choice}" in
      1) run_install ;;
      2) run_uninstall ;;
      3)
        echo ""
        echo "Bye."
        exit 0
        ;;
      *)
        echo ""
        echo -e "${YELLOW}Invalid choice.${NC} Please enter 1, 2, or 3."
        echo ""
        ;;
    esac
  done
}

main "$@"

