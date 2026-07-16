import Home from './pages/Home';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import MarkAttendance from './pages/MarkAttendance';
import AdminDashboard from './pages/AdminDashboard';
import ScanAttendance from './pages/ScanAttendance';

export const PAGES = {
    "Home": Home,
    "StudentDashboard": StudentDashboard,
    "TeacherDashboard": TeacherDashboard,
    "MarkAttendance": MarkAttendance,
    "AdminDashboard": AdminDashboard,
    "ScanAttendance": ScanAttendance,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
};