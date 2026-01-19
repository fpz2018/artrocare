import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Exercises from './pages/Exercises';
import Nutrition from './pages/Nutrition';
import Progress from './pages/Progress';
import Library from './pages/Library';
import Premium from './pages/Premium';
import Settings from './pages/Settings';
import Goals from './pages/Goals';
import Community from './pages/Community';
import Therapist from './pages/Therapist';
import Supplements from './pages/Supplements';
import index from './pages/index';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Dashboard": Dashboard,
    "Exercises": Exercises,
    "Nutrition": Nutrition,
    "Progress": Progress,
    "Library": Library,
    "Premium": Premium,
    "Settings": Settings,
    "Goals": Goals,
    "Community": Community,
    "Therapist": Therapist,
    "Supplements": Supplements,
    "index": index,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};