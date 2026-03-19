export const ROLES = {
  ADMIN: "resource-planner-admin",
  RW: "resource-planner-rw",
  RO: "resource-planner-ro",
}

export function hasRole(roles: string[], ...required: string[]): boolean {
  return required.some((r) => roles.includes(r))
}
