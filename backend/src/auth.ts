import jwt from "jsonwebtoken";


export function signToken(user: any) {
return jwt.sign(
{ id: user.id, role: user.role, tenant_id: user.tenant_id },
process.env.JWT_SECRET!,
{ expiresIn: "8h" }
);
}
