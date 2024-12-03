import { randomBytes } from "crypto";

export default (len = 6) => randomBytes(len).toString("hex").substring(0, len);