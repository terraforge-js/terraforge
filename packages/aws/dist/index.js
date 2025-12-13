// src/index.ts
import { createTerraformAPI } from "@terraforge/terraform";
var aws = createTerraformAPI({
  namespace: "aws",
  provider: { org: "hashicorp", type: "aws", version: "6.26.0" }
});
export {
  aws
};
