import jwt from "jsonwebtoken";


export function signToken(user: any) {
return jwt.sign(
{ id: user.id, role: user.role },
process.env.JWT_SECRET!,
{ expiresIn: "8h" }
);
}
