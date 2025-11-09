globalThis.wwwroot = "wwwroot";
globalThis.httpContext = { host: "http://localhost:5000" };
import Repository from "./models/repository.js";
import PostModel from "./models/post.js";

const repo = new Repository(new PostModel());
const data = repo.getAll({ keywords: "innovation" });
console.log('count', data?.length);
console.log(data?.map(p => p.Title));
