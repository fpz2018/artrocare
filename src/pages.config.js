import Community from './pages/Community';
import Dashboard from './pages/Dashboard';
import Exercises from './pages/Exercises';
import Goals from './pages/Goals';
import Home from './pages/Home';
import Library from './pages/Library';
import Nutrition from './pages/Nutrition';
import Premium from './pages/Premium';
import Progress from './pages/Progress';
import Settings from './pages/Settings';
import Supplements from './pages/Supplements';
import Therapist from './pages/Therapist';
import index from './pages/index';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Community": Community,
    "Dashboard": Dashboard,
    "Exercises": Exercises,
    "Goals": Goals,
    "Home": Home,
    "Library": Library,
    "Nutrition": Nutrition,
    "Premium": Premium,
    "Progress": Progress,
    "Settings": Settings,
    "Supplements": Supplements,
    "Therapist": Therapist,
    "index": index,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};