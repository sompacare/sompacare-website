import {
  Controller,
  Get,
  NotFoundException,
  Query,
  Res,
  StreamableFile,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Response } from "express";
import { Public } from "../decorators";
import { StorageService } from "./storage.service";

@ApiTags("files")
@Controller({ path: "files", version: "1" })
export class FilesController {
  constructor(private storage: StorageService) {}

  /** Local dev only — serves files written to STORAGE_LOCAL_PATH */
  @Get("download")
  @Public()
  @ApiOperation({ summary: "Stream a locally stored file (dev)" })
  streamLocal(@Query("key") key: string, @Res({ passthrough: true }) res: Response) {
    if (this.storage.isS3Configured()) {
      throw new NotFoundException("Direct file streaming is disabled when S3 is configured");
    }

    const stream = this.storage.openLocalReadStream(decodeURIComponent(key));
    if (!stream) throw new NotFoundException("File not found");

    const fileName = key.split("/").pop() ?? "file";
    res.setHeader("Content-Type", this.storage.guessContentType(fileName));
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
    return new StreamableFile(stream);
  }
}
