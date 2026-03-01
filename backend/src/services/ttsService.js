/**
 * Text-to-Speech service
 * English  → ElevenLabs API (natural voice)
 * Kinyarwanda → null (no good KW TTS exists; frontend falls back to browser)
 */

// Rachel voice — natural, calm, professional
const ELEVENLABS_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'

export const generateSpeech = async (text, language) => {
  if (language !== 'en') return null

  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) throw new Error('ELEVENLABS_API_KEY is not set')

  // Truncate to avoid burning through the free tier (10k chars/month)
  const truncated = text.slice(0, 1500)

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify({
        text: truncated,
        model_id: 'eleven_monolingual_v1',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 }
      })
    }
  )

  if (!response.ok) {
    const errBody = await response.text()
    throw new Error(`ElevenLabs error ${response.status}: ${errBody}`)
  }

  const audioBuffer = await response.arrayBuffer()
  return Buffer.from(audioBuffer).toString('base64')
}
