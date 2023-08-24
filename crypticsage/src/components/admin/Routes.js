import React, { Suspense, lazy } from "react";
import { Route } from "react-router-dom";

const Dashboard = lazy(() => import('./dashboard/Dashboard'));
const ContentManagement = lazy(() => import('./content_management/ContentManagement'));
const Quiz = lazy(() => import('./quiz/Quiz'));
const Indicators = lazy(() => import('./indicators/Indicators'))

const AdminRoutes = [
    <Route key='admin-dashboard' index element={
        <Suspense fallback={<div>Loading Admin Dashboard</div>}>
            <Dashboard title='Admin Dashboard' subtitle='Explore the various stats here' />
        </Suspense>
    } />,
    <Route key='content_management' path='content_management' element={
        <Suspense fallback={<div>Loading Content Management</div>}>
            <ContentManagement title='test' subtitle='testing' />
        </Suspense>
    } />,
    <Route key='quiz' path='quiz' element={
        <Suspense fallback={<div>Loading Quiz Manager</div>}>
            <Quiz title='Quiz' subtitle='Create and manage quizzes' />
        </Suspense>
    } />,
    <Route key='indicators' path='indicators' element={
        <Suspense fallback={<div>Loading Indicators Tab</div>}>
            <Indicators title='Indicators' subtitle='Experiment with various indicators' />
        </Suspense>
    } />,
]

export default AdminRoutes;