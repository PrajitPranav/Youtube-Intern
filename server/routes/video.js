import express from "express";
import { getallvideo, uploadvideo } from "../controllers/video.js";
import upload from "../filehelper/filehelper.js";

const routes = express.Router();

// GET all videos — two aliases for compatibility
routes.get("/getall", getallvideo);
routes.get("/getallvideos", getallvideo);

// POST upload
routes.post("/upload", upload.single("file"), uploadvideo);

export default routes;
