# Branching Strategy

This project uses a simplified **Git Flow** strategy.

## Branch Types

| Branch | Purpose | Merges into |
|--------|---------|------------|
| `main` | Production-ready, tagged releases | — |
| `develop` | Integration branch, always deployable | `main` via PR |
| `feature/*` | Individual features and fixes | `develop` via PR |
| `hotfix/*` | Urgent production patches | `main` AND `develop` |

## Workflow

1. Branch from `develop`: `git checkout -b feature/my-feature develop`
2. Commit often with descriptive messages: `feat: add photo download metrics`
3. Open a PR targeting `develop`. Require at least one review.
4. Merge via **Squash and Merge** to keep `develop` history clean.
5. When `develop` is stable and tested, open a PR from `develop` → `main`.
6. Tag `main` releases: `git tag -a v1.1.0 -m "Release v1.1.0"`

## Commit Message Convention

Format: `<type>(<scope>): <description>`

Types: `feat`, `fix`, `test`, `refactor`, `docs`, `chore`, `perf`

Examples:
- `feat(photos): add AOP logging decorator`
- `test(repository): add unit tests for PhotoRepository`
- `refactor(upload): extract hashtag parsing to pure function`

## Branch Protection Rules (GitHub)

- `main`: Require PR + passing CI before merge. No direct push.
- `develop`: Require PR. Direct push allowed for repo admin only.

## Example PR Description

```
## Summary
- Adds @Log and @Perf decorators to ImageProcessingService
- Decorators are applied to processUpload and processDownload methods

## Testing
- [ ] Unit tests pass: pnpm test:run
- [ ] No TypeScript errors: pnpm typecheck
- [ ] Manual smoke test: upload a photo and verify logs appear in console

## Related outcome
O6 — Aspect-Oriented Programming
```
