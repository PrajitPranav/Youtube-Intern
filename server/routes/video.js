import express from "express";
import { getallvideo, uploadvideo } from "../controllers/video.js";
import upload from "../filehelper/filehelper.js";

const routes = express.Router();

routes.get("/getall", getallvideo);
routes.get("/getallvideos", getallvideo);

routes.post("/upload", upload.single("file"), uploadvideo);

export default routes;
