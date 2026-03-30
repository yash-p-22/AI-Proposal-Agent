import type { ParsedJob, CaseStudy, ProposalTone, ProposalSection, ProposalOutput } from '@/types';

// We've removed the @google/generative-ai SDK and are using standard fetch REST API instead.
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function callGemini(
  system: string,
  userMessage: string,
  maxTokens = 2000,
  maxRetries = 3,
  jsonMode = false,
): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Missing GEMINI_API_KEY environment variable.');
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const apiVersion = process.env.GEMINI_API_VERSION ?? 'v1beta';
  const endpoint = `https://generativelanguage.googleapis.com/${apiVersion}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const payload: Record<string, unknown> = {
    system_instruction: {
      parts: { text: system }
    },
    contents: [
      {
        role: "user",
        parts: [{ text: userMessage }]
      }
    ],
    generationConfig: {
      maxOutputTokens: maxTokens,
      ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
    }
  };

  let attempt = 0;
  while (true) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || `HTTP error! status: ${response.status}`);
      }
      
      return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (
        (errorMessage.includes('429') || errorMessage.includes('Too Many Requests') || errorMessage.includes('Resource has been exhausted') || errorMessage.includes('Quota exceeded')) &&
        attempt < maxRetries
      ) {
        attempt++;
        let waitTime = 5000 * attempt; 
        
        const retryAfterMatch = errorMessage.match(/retry in ([\d.]+)s/);
        if (retryAfterMatch && retryAfterMatch[1]) {
          waitTime = (parseFloat(retryAfterMatch[1]) * 1000) + 1000;
        }
        
        console.warn(`[Gemini API] Rate limit hit. Retrying in ${Math.round(waitTime / 1000)}s...`);
        await delay(waitTime);
      } else {
        throw err;
      }
    }
  }
}

function parseJSON<T>(raw: string, fallback: T): T {
  try {
    // 1. Strip markdown code fences
    let cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();

    // 2. Try to parse directly
    if (cleaned.startsWith('{') || cleaned.startsWith('[')) {
      return JSON.parse(cleaned) as T;
    }

    // 3. Extract the first complete {...} or [...] block from mixed text
    const match = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (match) {
      return JSON.parse(match[0]) as T;
    }

    // 4. Last resort: try original raw
    return JSON.parse(raw) as T;
  } catch (err: any) {
    console.error('parseJSON error:', err.message, 'Raw:', raw.slice(0, 400));
    return fallback;
  }
}

// ─── Parse job post ───────────────────────────────────────────────────────────

export async function parseJobPost(
  rawText: string,
  budget: string,
  timeline: string,
  industry: string,
): Promise<ParsedJob> {
  const system = `You are a job post parser for a freelance proposal tool.
Extract structured data. Respond with valid JSON only — no markdown, no prose.`;

  const user = `Parse this job post:
Description: ${rawText}
Budget: ${budget}
Timeline: ${timeline}
Industry: ${industry || 'unknown'}

Return exactly this JSON shape:
{
  "skills": ["skill1","skill2"],
  "timeline": "3 weeks",
  "budget": "$4,500",
  "industry": "SaaS / Web Development",
  "complexity": "medium",
  "key_requirements": ["req1","req2"],
  "project_type": "SaaS Dashboard"
}`;

  const raw = await callGemini(system, user, 800, 3, true);
  return parseJSON<ParsedJob>(raw, {
    skills: [], timeline, budget, industry, complexity: 'medium',
    key_requirements: [], project_type: 'Custom project',
  });
}

// ─── Generate proposal ────────────────────────────────────────────────────────

export async function generateProposal(
  jobData: {
    raw_text: string; budget: string; timeline: string;
    client: string; parsed: ParsedJob;
  },
  caseStudies: CaseStudy[],
  tone: ProposalTone,
): Promise<{ output: ProposalOutput; sections: ProposalSection[]; word_count: number }> {
  const toneLabel = tone === 'Luxury' ? 'luxury' : tone === 'Minimal' ? 'friendly' : 'professional';

  const csText = caseStudies.length
    ? JSON.stringify(caseStudies.map(cs => ({
        title: cs.title,
        description: cs.description,
        results: cs.results,
        skills: cs.skills,
        tags: cs.tags,
      })))
    : '[]';

  const system = `You are an expert proposal generation agent.
Your task is to generate a high-quality, client-facing proposal based on a job description.
Follow these strict rules:
- Keep tone: ${toneLabel} (confident, slightly persuasive, not salesy)
- Keep content concise but impactful
- Avoid generic text — always tailor to the job description
- Do NOT hallucinate case studies — only use provided ones
- Return ONLY valid JSON, no markdown, no extra text, no explanation`;

  const user = `Generate a proposal with these inputs:

job_description: ${jobData.raw_text}
client_name: ${jobData.client}
company_name: ${jobData.client}
budget: ${jobData.budget}
timeline: ${jobData.timeline}
case_studies: ${csText}
tone: ${toneLabel}

Return this exact JSON:
{
  "introduction": {
    "heading": "Introduction",
    "content": "string (max 120 words, personalized to client)"
  },
  "project_plan": {
    "heading": "Project Plan",
    "steps": [{ "title": "string", "description": "string" }],
    "timeline": "string",
    "deliverables": ["string"]
  },
  "case_studies": {
    "heading": "Case Study Links",
    "items": [{ "title": "string", "description": "string", "tech_stack": ["string"], "outcome": "string", "link": "string" }]
  },
  "questions": {
    "heading": "Questions to Ask",
    "items": ["string"]
  }
}`;

  const raw = await callGemini(system, user, 4000, 3, true);

  const defaultOutput: ProposalOutput = {
    introduction: { heading: 'Introduction', content: 'Thank you for this opportunity.' },
    project_plan: {
      heading: 'Project Plan',
      steps: [
        { title: 'Discovery', description: 'Understand requirements and goals.' },
        { title: 'Development', description: 'Build the solution.' },
        { title: 'Deployment', description: 'Launch and handover.' },
      ],
      timeline: jobData.timeline,
      deliverables: ['Final product', 'Documentation'],
    },
    case_studies: { heading: 'Case Study Links', items: [] },
    questions: { heading: 'Questions to Ask', items: ['Can you share more about the project scope?'] },
  };

  const output = parseJSON<ProposalOutput>(raw, defaultOutput);

  // Build legacy sections[] for database/ClickUp storage
  const sections: ProposalSection[] = [
    { id: 1, title: output.introduction.heading, content: output.introduction.content },
    {
      id: 2,
      title: output.project_plan.heading,
      content: [
        output.project_plan.steps.map(s => `**${s.title}**: ${s.description}`).join('\n'),
        '',
        `Timeline: ${output.project_plan.timeline}`,
        '',
        'Deliverables:',
        output.project_plan.deliverables.map(d => `• ${d}`).join('\n'),
      ].join('\n'),
    },
    {
      id: 3,
      title: output.case_studies.heading,
      content: output.case_studies.items.length
        ? output.case_studies.items.map(cs =>
            `**${cs.title}**: ${cs.description}\nOutcome: ${cs.outcome}${cs.link ? `\nLink: ${cs.link}` : ''}`
          ).join('\n\n')
        : 'No matching case studies provided.',
    },
    {
      id: 4,
      title: output.questions.heading,
      content: output.questions.items.map((q, i) => `${i + 1}. ${q}`).join('\n'),
    },
  ];

  const word_count = sections.reduce((acc, s) => acc + s.content.split(/\s+/).length, 0);
  return { output, sections, word_count };
}

// ─── Regenerate single section ────────────────────────────────────────────────

export async function regenerateSection(
  sectionTitle: string,
  originalContent: string,
  instruction: string,
  jobContext: string,
): Promise<string> {
  const instructionMap: Record<string, string> = {
    regenerate: 'Rewrite this section with fresh, improved phrasing and content.',
    shorten:    'Shorten this to roughly half the length. Keep all key points.',
    expand:     'Expand this with more detail, specific examples, and compelling language.',
  };

  const system = `You are an expert freelance proposal writer.
${instructionMap[instruction] ?? instruction}

CRITICAL FORMATTING RULES — you MUST follow these exactly:
1. Preserve the EXACT SAME structure and format as the original content.
2. If the original uses a numbered list (1. 2. 3. ...), your output MUST also use a numbered list with the same number of items.
3. If the original uses markdown bold headers (**Title**: description), your output MUST also use markdown bold headers with the same number of sections.
4. If the original has bullet points, timelines, deliverables sections — keep them all in the same structure.
5. Do NOT add a section title at the top.
6. Do NOT add JSON, code fences, or extra commentary.
7. Match the number of items/steps/questions exactly — do not add or remove items.
Return ONLY the reformatted section content preserving the original structure.`;

  const user = `Section: "${sectionTitle}"

Original content (COPY THIS EXACT STRUCTURE/FORMAT):
${originalContent}

Job context: ${jobContext}

Rewrite the content now, keeping the EXACT SAME structure and format as the original:`;

  return await callGemini(system, user, 1200);
}
