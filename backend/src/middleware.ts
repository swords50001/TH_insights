import jwt from "jsonwebtoken";

export function auth(req: any, res: any, next: any) {
const header = req.headers.authorization;
if (!header) return res.sendStatus(401);

try {
req.user = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET!);
next();
} catch {
res.sendStatus(403);
}
}


export function requireAdmin(req: any, res: any, next: any) {
if (req.user.role !== "admin") return res.sendStatus(403);
next();
}
