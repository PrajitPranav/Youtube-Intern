import express from "express";
import { login, updateprofile, getuser } from "../controllers/auth.js";
const routes = express.Router();

routes.post("/login", login);
routes.patch("/update/:id", updateprofile);
routes.get("/:id", getuser);
export default routes;
