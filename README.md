# voice-polish

A Claude Code mod that rewrites long, spoken-style (voice-dictated) prompts into clear, structured instructions before the agent reads them.

- Runs on every message of 120+ characters (a `prompt.submit` hook, using the Haiku model).
- Removes filler and false starts, keeps your final correction, fixes obvious speech-recognition errors.
- Never adds requirements you didn't state, and never answers the request itself.
- Attaches your original transcript as hidden context, and prints the polished text in the transcript.
- If the polish call fails, your message goes through unchanged.
- Skip one message by starting it with `//`. Toggle with `/voice-polish`.

## Install

```bash
claude plugin marketplace add Luffytse/voice-polish
claude plugin install voice-polish@voice-polish-marketplace
```

In an environment setup script (non-interactive), the same two commands apply. Mods need Claude Code v2.1.287 or later. Whether a mod installed this way loads its hook in a cloud session is untested.

The rewrite prompt is the `SYSTEM` constant in `hooks/register.tsx`.
