import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Home from './pages/page.js'
import Login from './pages/login/page.js'
import Register from './pages/creator/register/page.js'
import ForgotPassword from './pages/forgot-password/page.js'
import ResetPassword from './pages/reset-password/page.js'
import Dashboard from './pages/dashboard/page.js'
import Profile from './pages/dashboard/profile/page.js'
import Payout from './pages/dashboard/payout/page.js'
import Feedback from './pages/dashboard/feedback/page.js'
import History from './pages/history/page.js'
import Admin from './pages/admin/page.js'
import Donate from './pages/donate/[username]/page.js'
import Overlay from './pages/overlay/[username]/page.js'
import OverlayNotifications from './pages/overlay/[username]/notifications/page.js'
import OverlayLeaderboard from './pages/overlay/[username]/leaderboard/page.js'
import OverlayQr from './pages/overlay/[username]/qr-donate/page.js'
import OverlayMediaShare from './pages/overlay/[username]/mediashare/page.jsx'
import Faq from './pages/faq/page.js'
import Contact from './pages/contact/page.js'
import Privacy from './pages/privacy/page.js'
import Terms from './pages/terms/page.js'
import ComingSoon from './pages/coming-soon/page.js'
import NotFound from './pages/not-found.js'
import GlobalPageLoader from './components/GlobalPageLoader.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <GlobalPageLoader />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Navigate to="/creator/register" replace />} />
        <Route path="/creator/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/profile" element={<Profile />} />
        <Route path="/dashboard/payout" element={<Payout />} />
        <Route path="/dashboard/feedback" element={<Feedback />} />
        <Route path="/history" element={<History />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/donate/:username" element={<Donate />} />
        <Route path="/overlay/:username" element={<Overlay />} />
        <Route path="/overlay/:username/notifications" element={<OverlayNotifications />} />
        <Route path="/overlay/:username/leaderboard" element={<OverlayLeaderboard />} />
        <Route path="/overlay/:username/qr-donate" element={<OverlayQr />} />
        <Route path="/overlay/:username/mediashare" element={<OverlayMediaShare />} />
        <Route path="/faq" element={<Faq />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/coming-soon" element={<ComingSoon />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
