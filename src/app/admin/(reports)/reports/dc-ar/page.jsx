import DCARReport from "@/components/reports/DCARReport";
import RoleGuard from "@/components/RoleGuard";
import { RoleType } from "@/constants/user-roles";

export default function DCARPage() {
  return <RoleGuard allowedRoles={[RoleType.ADMIN, RoleType.FINANCE, RoleType.SALES_MANAGER, RoleType.DC_OPERATOR]}><DCARReport /></RoleGuard>;
}
