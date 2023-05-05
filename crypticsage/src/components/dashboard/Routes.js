import React, { Suspense, lazy } from "react";
import { Route } from "react-router-dom";

import StatsSkeleton from "./dashboard_tabs/stats/StatsSkeleton";

const Stats = lazy(() => import("./dashboard_tabs/stats/Stats"));
const Sections = lazy(() => import("./dashboard_tabs/sections/Sections"));
const Journal = lazy(() => import("./dashboard_tabs/journal/Journal"));
const Quiz = lazy(() => import("./dashboard_tabs/quiz/Quiz"));
const Glossary = lazy(() => import("./dashboard_tabs/glossary/Glossary"));
const Schedule = lazy(() => import("./dashboard_tabs/schedule/Schedule"));
const Settings = lazy(() => import("./dashboard_tabs/settings/Settings"));


const TabRoutes = [
    <Route key='stats' index element={
        <Suspense fallback={<StatsSkeleton />}>
            <Stats title="Stats" subtitle="Explore your stats" />
        </Suspense>
    } />,
    <Route key='lessons' path="lessons" element={
        <Suspense fallback={<div>Loading Lessons...</div>}>
            <Sections title="Sections" subtitle="Explore various chapters" />
        </Suspense>
    } />,
    <Route key='journal' path="journal" element={
        <Suspense fallback={<div>Loading Journal...</div>}>
            <Journal title="Journal" subtitle="Explore your journal" />
        </Suspense>
    } />,
    <Route key='quiz' path="quiz" element={
        <Suspense fallback={<div>Loading Quiz...</div>}>
            <Quiz title="Quiz" subtitle="Explore your quiz" />
        </Suspense>
    } />,
    <Route key='glossary' path="glossary" element={
        <Suspense fallback={<div>Loading Glossary...</div>}>
            <Glossary title="Glossary of Terms" subtitle="Explore your glossary" />
        </Suspense>
    } />,
    <Route key='schedule' path="schedule" element={
        <Suspense fallback={<div>Loading Schedule...</div>}>
            <Schedule title="Schedule" subtitle="Explore your schedule" />
        </Suspense>
    } />,
    <Route key='settings' path="settings" element={
        <Suspense fallback={<div>Loading Settings...</div>}>
            <Settings title="Settings" subtitle="Explore your settings" />
        </Suspense>
    } />
];

export default TabRoutes;