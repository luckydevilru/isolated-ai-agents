# Global Instructions

## Environment
- Isolated Docker container (Debian 12, root)
- Pre-installed: Node 22, Python 3.11, PHP 8.2, Go, GCC
- Working directory: /var/www/ (mounted from host)
- Package managers: npm, yarn, composer, pip, go

## Auto-setup rules
When a command or tool is missing:
1. Try to install it automatically (apt, npm, pip, go install)
2. If installation fails or requires user input (license, auth, paid) — ask the user
3. After installing, verify it works before proceeding

## Restrictions
- No Docker-in-Docker
- Host filesystem is read-only except mounted volumes
- Never modify files outside /var/www/ and /data/
- Prefer apt over manual binary installs when possible

## Project instructions
Each project may have its own AGENTS.md in its root directory.
Project-level instructions override global ones when conflicting.
