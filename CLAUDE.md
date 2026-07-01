# Claude Code Handover

Use `CODEX.md` as the shared agent handover contract for this repository.

The same launch rules apply to Claude Code:

- work only from `main` or a direct branch from it (this repo was split off the
  `halajobe` monorepo; `flutter-seeker-campus` does not exist here)
- backend-only changes belong here; web / admin / mobile changes belong in the
  three sibling repos listed in `CODEX.md`
- preserve unrelated user/developer changes
- do not claim mock AI as real AI
- do not claim manual/admin subscriptions as online payment
- do not call an APK fresh unless it was built from the current source
- record exact test, build, screenshot, and blocker evidence in repo docs
