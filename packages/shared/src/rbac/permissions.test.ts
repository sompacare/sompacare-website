import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PlatformRole,
  getPermissionsForRoles,
  hasPermission,
  hasAnyPermission,
} from "./permissions";

test("SUPER_ADMIN has all permissions", () => {
  assert.equal(hasPermission([PlatformRole.SUPER_ADMIN], "admin:feature_flags"), true);
  assert.equal(hasPermission([PlatformRole.SUPER_ADMIN], "payroll:process"), true);
});

test("RN can read shifts and confirm assignments", () => {
  assert.equal(hasPermission([PlatformRole.RN], "shifts:read"), true);
  assert.equal(hasPermission([PlatformRole.RN], "assignments:confirm"), true);
  assert.equal(hasPermission([PlatformRole.RN], "shifts:write"), false);
});

test("FACILITY_MANAGER can publish shifts", () => {
  assert.equal(hasPermission([PlatformRole.FACILITY_MANAGER], "shifts:publish"), true);
  assert.equal(hasPermission([PlatformRole.FACILITY_MANAGER], "payroll:approve"), false);
});

test("getPermissionsForRoles merges multiple roles", () => {
  const perms = getPermissionsForRoles([PlatformRole.RN, PlatformRole.RECRUITER]);
  assert.ok(perms.includes("shifts:read"));
  assert.ok(perms.includes("recruiter:pipeline"));
});

test("hasAnyPermission returns true if one matches", () => {
  assert.equal(
    hasAnyPermission([PlatformRole.CNA], ["shifts:write", "shifts:read"]),
    true
  );
});

test("PAYROLL cannot modify shifts", () => {
  assert.equal(hasPermission([PlatformRole.PAYROLL], "shifts:write"), false);
  assert.equal(hasPermission([PlatformRole.PAYROLL], "payroll:approve"), true);
});
