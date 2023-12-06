import { executeOwnerChange } from "./ownerChangeUtils";
import { OLD_OWNER_ADDRESS } from "./common";

executeOwnerChange("disable", OLD_OWNER_ADDRESS)
  .then((hash) => console.log(`Transaction hash: ${hash}`))
  .catch(console.error);
