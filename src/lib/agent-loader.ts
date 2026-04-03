import fs from 'fs'
import path from 'path'

/** Métadonnées d'un agent métier */
export interface AgentMeta {
  name: string
  description: string
  model: string
  tools: string[]
}

/** Agent chargé : métadonnées + prompt */
export interface LoadedAgent {
  meta: AgentMeta
  prompt: string
}

/**
 * Charge un agent depuis src/agents/{filename}.md.
 * Parse le frontmatter YAML (name, description, model, tools)
 * et retourne le prompt sans le bloc frontmatter.
 *
 * @param filename - Nom du fichier sans extension (ex: 'buffett-analyse')
 * @returns Métadonnées et prompt de l'agent
 */
export function loadAgent(filename: string): LoadedAgent {
  const filePath = path.join(process.cwd(), 'src/agents', `${filename}.md`)
  const raw = fs.readFileSync(filePath, 'utf-8')

  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n/)
  if (!fmMatch) {
    throw new Error(`Frontmatter manquant dans ${filename}.md`)
  }

  const fmBlock = fmMatch[1]
  const prompt = raw.slice(fmMatch[0].length).trimStart()

  const name = fmBlock.match(/^name:\s*(.+)$/m)?.[1].trim().replace(/^"|"$/g, '') ?? filename
  const description = fmBlock.match(/^description:\s*"?(.+?)"?\s*$/m)?.[1] ?? ''
  const model = fmBlock.match(/^model:\s*(.+)$/m)?.[1].trim() ?? ''

  const tools: string[] = []
  const toolsMatch = fmBlock.match(/^tools:\n((?:\s+-\s+.+\n?)+)/m)
  if (toolsMatch) {
    for (const line of toolsMatch[1].split('\n')) {
      const tool = line.match(/^\s+-\s+(.+)/)?.[1]?.trim()
      if (tool) tools.push(tool)
    }
  }

  return { meta: { name, description, model, tools }, prompt }
}

/** Map des noms de modèles agents → identifiants API Google AI */
const MODEL_MAP: Record<string, string> = {
  'gemini-3.1-flash-lite': 'gemini-2.5-flash-lite',
  'gemini-3.1-flash': 'gemini-2.5-flash',
}

/**
 * Résout le nom de modèle agent vers l'identifiant API Google AI.
 * Fallback sur le nom brut si pas de mapping.
 *
 * @param agentModel - Nom du modèle dans le frontmatter
 * @returns Identifiant du modèle pour l'API Google AI
 */
export function resolveModelId(agentModel: string): string {
  return MODEL_MAP[agentModel] ?? agentModel
}
