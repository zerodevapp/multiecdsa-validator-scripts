import { executeOwnerChange } from "./ownerChangeUtils";
import { NEW_OWNER_ADDRESS } from "./common";

executeOwnerChange("enable", NEW_OWNER_ADDRESS)
  .then((hash) => console.log(`Transaction hash: ${hash}`))
  .catch(console.error);
