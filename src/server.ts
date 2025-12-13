import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import adminRoutes from "./routes/admin.routes";


const app = express();
app.use(cors());
app.use(express.json());


app.use("/auth", authRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/admin", adminRoutes);


app.listen(8080, () => console.log("Backend running on 8080"));
