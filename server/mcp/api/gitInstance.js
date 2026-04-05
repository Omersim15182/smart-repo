import { Octokit } from "octokit";
import dotenv from "dotenv";
dotenv.config({ override: true, quiet: true });

export const octokit = new Octokit({
  auth: process.env.GIT_TOKEN,
});
