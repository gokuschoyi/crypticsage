import Dashboard from './dashboard/Dashboard';
import ContentManagement from './content_management/ContentManagement';
import { Route } from "react-router-dom";

const AdminRoutes = [
    <Route key='admin-dashboard' index element={<Dashboard title='Admin Dashboard' subtitle='Explore the various stats here' />} />,
    <Route key='content_management' path='content_management' element={<ContentManagement title='test' subtitle='testing' />} />
]

export default AdminRoutes;