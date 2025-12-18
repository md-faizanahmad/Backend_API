// middlewares/security.js
import cookieParser from "cookie-parser";
import helmet from "helmet";
import express from "express";

export const securityMiddleware = (app) => {
  app.use(helmet());
  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
};
