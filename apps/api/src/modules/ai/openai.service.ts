import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import OpenAI from "openai";
import type { ClinicalRole } from "@sompacare/database";
import type { ParsedResume } from "./parsed-resume.types";

@Injectable()
export class OpenAiService {
  private readonly logger = new Logger(OpenAiService.name);
  private readonly client: OpenAI | null;

  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>("OPENAI_API_KEY");
    this.client = apiKey ? new OpenAI({ apiKey }) : null;
  }

  private getModel(): string {
    return this.config.get<string>("OPENAI_MODEL", "gpt-4o-mini");
  }

  isDevBypass(): boolean {
    return (
      this.config.get("AI_MATCHING_DEV_BYPASS", "true") === "true" ||
      !this.config.get("OPENAI_API_KEY")
    );
  }

  isResumeDevBypass(): boolean {
    return (
      this.config.get("RESUME_PARSER_DEV_BYPASS", "true") === "true" ||
      !this.config.get("OPENAI_API_KEY")
    );
  }

  private async chatText(system: string, user: string, maxTokens = 300): Promise<string | null> {
    if (!this.client) return null;
    try {
      const response = await this.client.chat.completions.create({
        model: this.getModel(),
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        max_tokens: maxTokens,
        temperature: 0.3,
      });
      return response.choices[0]?.message?.content?.trim() ?? null;
    } catch (error) {
      this.logger.warn(`OpenAI text call failed: ${error}`);
      return null;
    }
  }

  private async chatJson<T>(system: string, user: string): Promise<T | null> {
    if (!this.client) return null;
    try {
      const response = await this.client.chat.completions.create({
        model: this.getModel(),
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
        max_tokens: 900,
        temperature: 0.2,
      });
      const text = response.choices[0]?.message?.content?.trim();
      if (!text) return null;
      return JSON.parse(text) as T;
    } catch (error) {
      this.logger.warn(`OpenAI JSON call failed: ${error}`);
      return null;
    }
  }

  async enhanceMatchSummary(input: {
    shiftTitle: string;
    workerName: string;
    score: number;
    highlights: string[];
  }): Promise<{ summary: string; devBypass: boolean }> {
    const fallback = `${input.workerName} is a ${input.score}% match for ${input.shiftTitle} (${input.highlights.slice(0, 2).join(", ") || "baseline fit"}).`;

    if (this.isDevBypass()) {
      return { devBypass: true, summary: fallback };
    }

    const aiSummary = await this.chatText(
      "You write one concise sentence for healthcare staffing match cards. Be factual and professional.",
      `Shift: ${input.shiftTitle}\nWorker: ${input.workerName}\nScore: ${input.score}%\nFactors: ${input.highlights.join(", ")}`
    );

    return {
      devBypass: false,
      summary: aiSummary ?? input.highlights.join("; ") ?? `Match score: ${input.score}%`,
    };
  }

  async parseResume(input: {
    resumeText?: string;
    resumeUrl?: string;
    clinicalRole?: ClinicalRole;
  }): Promise<{ parsed: ParsedResume; devBypass: boolean }> {
    const role = input.clinicalRole ?? "RN";

    if (this.isResumeDevBypass()) {
      this.logger.log("Resume parser dev bypass");
      return {
        devBypass: true,
        parsed: this.devParsedResume(role),
      };
    }

    const source = input.resumeText?.trim();
    if (!source) {
      return {
        devBypass: false,
        parsed: {
          clinicalRole: role,
          summary: input.resumeUrl
            ? "Resume file uploaded — add resume text for full AI parsing."
            : "No resume text provided.",
        },
      };
    }

    const parsed = await this.chatJson<ParsedResume>(
      `Extract healthcare clinician resume data as JSON with keys: clinicalRole (RN|LPN|CNA|NURSE), yearsExperience (number), specialties (string[]), licenses ({type,state,number}[]), certifications (string[]), skills (string[]), summary (string). Use only information present in the resume.`,
      source.slice(0, 12000)
    );

    if (!parsed) {
      return {
        devBypass: false,
        parsed: {
          clinicalRole: role,
          summary: source.slice(0, 200),
          skills: [],
        },
      };
    }

    return { devBypass: false, parsed: { ...parsed, clinicalRole: parsed.clinicalRole ?? role } };
  }

  async generateInsightsSummary(input: {
    urgentTickets: number;
    enabledFlags: number;
    pendingCompliance: number;
    publishedShifts: number;
    fillRate: number;
    topFacilityNames: string[];
  }): Promise<{ summary: string; devBypass: boolean }> {
    const fallback =
      input.urgentTickets > 0
        ? `${input.urgentTickets} urgent support ticket(s) need attention. Review compliance queue and payroll anomalies.`
        : "Platform operating normally. Monitor fill rate and credential expirations.";

    if (this.isDevBypass()) {
      return { devBypass: true, summary: fallback };
    }

    const aiSummary = await this.chatText(
      "You summarize healthcare staffing platform ops in 2 short sentences for an admin dashboard.",
      JSON.stringify(input),
      200
    );

    return { devBypass: false, summary: aiSummary ?? fallback };
  }

  private devParsedResume(role: ClinicalRole): ParsedResume {
    return {
      clinicalRole: role,
      yearsExperience: 3,
      specialties: role === "RN" ? ["Med-Surg", "ICU"] : ["Long-Term Care"],
      licenses: [{ type: role, state: "MD", number: "DEV-PARSED" }],
      certifications: ["BLS/CPR", "ACLS"],
      skills: ["Patient assessment", "EMR documentation", "Vital signs"],
      summary: `Experienced ${role} clinician parsed from resume (dev mode).`,
    };
  }
}
