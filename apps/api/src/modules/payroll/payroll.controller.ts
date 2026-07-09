import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Post,
  Query,
  Res,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Response } from "express";
import {
  AuthenticatedUser,
  CurrentUser,
  RequirePermissions,
} from "../../common/decorators";
import { CreatePayRunDto, PayRunQueryDto } from "./dto/payroll.dto";
import { PayrollService } from "./payroll.service";

@ApiTags("payroll")
@ApiBearerAuth()
@Controller({ path: "payroll/runs", version: "1" })
export class PayrollController {
  constructor(private payrollService: PayrollService) {}

  @Get()
  @RequirePermissions("payroll:read")
  @ApiOperation({ summary: "List pay runs" })
  findAll(@Query() query: PayRunQueryDto) {
    return this.payrollService.findAll(query.page, query.limit);
  }

  @Get(":id")
  @RequirePermissions("payroll:read")
  @ApiOperation({ summary: "Get pay run detail" })
  findOne(@Param("id") id: string) {
    return this.payrollService.findOne(id);
  }

  @Post()
  @RequirePermissions("payroll:write")
  @ApiOperation({ summary: "Generate pay run from approved timecards" })
  generate(@Body() dto: CreatePayRunDto, @CurrentUser() user: AuthenticatedUser) {
    return this.payrollService.generate(dto, user.id);
  }

  @Post(":id/approve")
  @RequirePermissions("payroll:approve")
  @ApiOperation({ summary: "Approve pay run" })
  approve(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.payrollService.approve(id, user.id);
  }

  @Post(":id/process")
  @RequirePermissions("payroll:process")
  @ApiOperation({ summary: "Process payouts and credit wallets" })
  process(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.payrollService.process(id, user.id);
  }

  @Get(":id/export")
  @RequirePermissions("payroll:read")
  @ApiOperation({ summary: "Export pay run as CSV (W-2/1099 prep)" })
  @Header("Content-Type", "text/csv")
  async export(@Param("id") id: string, @Res() res: Response) {
    const { filename, csv } = await this.payrollService.exportCsv(id);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(csv);
  }
}
