import Home from './pages/Home';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import MarkAttendance from './pages/MarkAttendance';
import AdminDashboard from './pages/AdminDashboard';

export const PAGES = {
    "Home": Home,
    "StudentDashboard": StudentDashboard,
    "TeacherDashboard": TeacherDashboard,
    "MarkAttendance": MarkAttendance,
    "AdminDashboard": AdminDashboard,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
};