import cron from "node-cron";
import synchronizeData from "./dataSynchronizer";

const setupCronJob = () => {
  cron.schedule("0 0 1 * *", async () => {
    console.log("Cron job scheduled to run monthly.");
    try {
      console.log("Synchronizing data from the API...");
      await synchronizeData();
    } catch (error) {
      console.error("Error synchronizing data:", error);
    }
  });
}

export default setupCronJob;
