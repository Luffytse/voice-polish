import type { Register } from 'claude-code'

const MIN_CHARS = 120
const MODEL = 'haiku'

const SYSTEM = `You are a preprocessor that turns a voice-dictated message into a clear written prompt for a coding agent.
The message is a transcript of someone speaking: it has filler words, restarts, self-corrections, run-on sentences and speech-recognition errors.

Rewrite it so the agent understands exactly what the speaker wants:
- Keep the speaker's intent, facts, names, file paths, code, numbers and opinions. Never add requirements, assumptions or facts they did not state.
- Remove filler, repetition and abandoned false starts; when they correct themselves, keep the final version.
- Fix obvious speech-recognition mistakes only when the intended word is clear from context (tool names, library names, technical terms).
- Write in first person, as the speaker. Keep their language (do not translate).
- Structure it: a one-line goal first, then short paragraphs or bullets for context, requirements and constraints, then any explicit questions. Use only the sections the content needs; short requests stay short.
- Preserve questions as questions, and requests as requests. Do NOT answer or carry out the request yourself.
- Output only the rewritten message, with no preface and no commentary.`

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'voice-polish',
      description: 'Turn automatic voice-prompt polishing on, off, or show its status',
    })

    return next(e)
  })

  on('command.run', { command: 'voice-polish' }, async $ => {
    const isOff = (await $.store.get('isOff')) === true
    const next = $.store.set('isOff', !isOff)
    await next

    return { text: `Voice polish is now ${isOff ? 'ON' : 'OFF'}.` }
  })

  on('prompt.submit', async ($, e, next) => {
    const raw = e.text.trim()
    const isSkipped =
      e.command !== undefined ||
      e.isMeta === true ||
      raw.length < MIN_CHARS ||
      raw.startsWith('/') ||
      raw.startsWith('!') ||
      raw.startsWith('#') ||
      raw.startsWith('//') // a leading // opts out of polishing for one message

    if (isSkipped || (await $.store.get('isOff')) === true) {
      return next(e)
    }

    $.ui.status('Polishing voice prompt…')
    try {
      const r = await $.model.complete({
        model: MODEL,
        system: SYSTEM,
        prompt: `<transcript>\n${raw}\n</transcript>`,
        maxTokens: 2000,
        effort: 'low',
      })

      if (!r.isAnswered || r.text.trim().length === 0) {
        return next(e)
      }

      $.ui.log(`Voice polish, sent to the agent as:\n${r.text.trim()}`)

      return next({
        ...e,
        text: r.text.trim(),
        context: [
          ...(e.context ?? []),
          `The user's message above was auto-polished from a voice transcript. Original transcript, in case the polish dropped something:\n${raw}`,
        ],
      })
    } catch {
      return next(e)
    } finally {
      $.ui.status(undefined)
    }
  })
}
