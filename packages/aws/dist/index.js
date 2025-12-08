// src/index.ts
import { createTerraformAPI } from "@terraforge/terraform";
var aws = createTerraformAPI({
  namespace: "aws",
  provider: { org: "hashicorp", type: "aws", version: "6.25.0" }
});
export {
  aws
};
