import Stats from "./dashboard_tabs/stats/Stats";
import Lessons from "./dashboard_tabs/lessons/Lessons";
import Journal from "./dashboard_tabs/journal/Journal";
import Quiz from "./dashboard_tabs/quiz/Quiz";
import Glossary from "./dashboard_tabs/glossary/Glossary";
import Schedule from "./dashboard_tabs/schedule/Schedule";
import { Route } from "react-router-dom";

const TabRoutes = [
    <Route key='dashboard' path="dashboardTab" element={<Stats title="Stats" subtitle="Explore your stats" />} />,
    <Route key='lesson' path="lessons" element={<Lessons title="Lessons" subtitle="Explore your lessons" />} />,
    <Route key='journal' path="journal" element={<Journal title="Journal" subtitle="Explore your journal" />} />,
    <Route key='quiz' path="quiz" element={<Quiz title="Quiz" subtitle="Explore your quiz" />} />,
    <Route key='glossary' path="glossary" element={<Glossary title="Glossary" subtitle="Explore your glossary" />} />,
    <Route key='schedule' path="schedule" element={<Schedule title="Schedule" subtitle="Explore your schedule" />} />,
];

export default TabRoutes;