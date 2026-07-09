import { Injectable } from "@nestjs/common";
import { ClinicalRole } from "@sompacare/database";
import { OpenAiService } from "../ai/openai.service";
import type { ParsedResume } from "../ai/parsed-resume.types";

export type { ParsedResume };

@Injectable()
export class ResumeParserService {
  constructor(private openai: OpenAiService) {}

  parseResume(input: {
    resumeText?: string;
    resumeUrl?: string;
    clinicalRole?: ClinicalRole;
  }) {
    return this.openai.parseResume(input);
  }
}
