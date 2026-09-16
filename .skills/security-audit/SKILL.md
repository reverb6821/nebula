# Security Guidelines & Audit Skill

This skill defines security standards, code audit procedures, and safe OS interaction guidelines for the **Desktop PC Management Client**. Reference this skill when reviewing code, writing system-level commands, or adding new module capabilities.

---

## When to Use

Reference this skill during:
- Code reviews and pull request audits
- Implementation of new OS commands or subshell executions
- Data persistence and local storage handling
- Dependency updates and security scanning

---

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Vue 3 Frontend                        │
│   Sanitized User Input ──► Parametrized OS Command Builder  │
└──────────────────────────────┬──────────────────────────────┘
                               │ Isolated IPC (runCmd)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Privilege Execution Layer                   │
│   Linux: `pkexec` / Windows: Elevated PowerShell Commands   │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Security Principles

### 1. Command Injection Prevention

Never concatenate raw user input directly into OS commands or terminal strings.

**Dangerous (Vulnerable to Command Injection):**
```typescript
// BAD: User input injected directly into shell execution
await runCmd(`systemctl restart ${userInput}.service`)
```

**Secure Pattern (Sanitization & Whitelisting):**
```typescript
// GOOD: Validate against allowed character sets or known entities
function sanitizeServiceName(name: string): string {
  if (!/^[a-zA-Z0-9_.-]+$/.test(name)) {
    throw new Error('Invalid service name detected')
  }
  return name
}

const safeName = sanitizeServiceName(userInput)
await runCmd(`systemctl restart ${safeName}.service`)
```

### 2. Privileged Execution (Least Privilege)

- Request root/administrator escalation (`pkexec` on Linux, elevated PowerShell on Windows) **only** for write/action commands (`start`, `stop`, `enable`).
- Read-only commands (`list-units`, `Get-Service`) must run under standard user permissions.

```typescript
// Read-only (Unprivileged)
export async function listServices(): Promise<CmdResult> {
  return runCmd('systemctl list-units --type=service --output=json')
}

// Mutating Action (Privileged via pkexec)
export async function stopService(serviceName: string): Promise<CmdResult> {
  const safeName = sanitizeServiceName(serviceName)
  return runCmd(`pkexec systemctl stop ${safeName}.service`)
}
```

### 3. Data Storage & Local State Security

- Do not store sensitive system credentials, SSH keys, or tokens in standard `localStorage`.
- Use Neutralino's secure storage API (`Neutralino.storage`) for app-level settings requiring persistence.

---

## Audit Checklist for PRs

- [ ] **No Command Injection**: All dynamic arguments passed to `runCmd` or `spawnStream` are sanitized or strictly typed.
- [ ] **No Hardcoded Credentials**: API keys, passwords, or tokens are absent from source files.
- [ ] **Input Validation**: Form components (e.g., search bars, process killers) validate parameters prior to execution.
- [ ] **Console Sanitization**: No sensitive OS outputs or environment variables are logged via `console.log`.
- [ ] **Neutralino Guard**: All calls to `@neutralinojs/lib` handle execution safety when `window.NL_PORT` is undefined.

---

## Critical Rules

1. **No Shell Pipe Chaining with Unsanitized Input**: Never execute `sh -c` or complex bash pipes containing raw user strings.
2. **Strict Regex Whitelisting**: Use strict regular expressions when validating system resource identifiers (PIDs, service names, file paths).
3. **Fail-Closed Strategy**: If command parameters fail validation, abort the operation immediately and raise a controlled UI alert.