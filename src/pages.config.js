import Community from './pages/Community';
import Dashboard from './pages/Dashboard';
import Exercises from './pages/Exercises';
import Goals from './pages/Goals';
import Home from './pages/Home';
import Library from './pages/Library';
import Medication from './pages/Medication';
import Nutrition from './pages/Nutrition';
import Premium from './pages/Premium';
import Progress from './pages/Progress';
import Settings from './pages/Settings';
import Supplements from './pages/Supplements';
import Therapist from './pages/Therapist';
import TherapistDashboard from './pages/TherapistDashboard';
import index from './pages/index';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Community": Community,
    "Dashboard": Dashboard,
    "Exercises": Exercises,
    "Goals": Goals,
    "Home": Home,
    "Library": Library,
    "Medication": Medication,
    "Nutrition": Nutrition,
    "Premium": Premium,
    "Progress": Progress,
    "Settings": Settings,
    "Supplements": Supplements,
    "Therapist": Therapist,
    "TherapistDashboard": TherapistDashboard,
    "index": index,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};