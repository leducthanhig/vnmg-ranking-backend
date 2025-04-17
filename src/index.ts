import App from "./app";
import PeriodRoute from "./routes/period.route";
import VoteRoute from "./routes/vote.route";

const app = new App([new VoteRoute(), new PeriodRoute()]);

app.listen();
